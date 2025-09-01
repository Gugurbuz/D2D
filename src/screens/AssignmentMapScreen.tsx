import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// @ts-ignore
import "leaflet-draw";
import {
    ArrowLeft,
    Route as RouteIcon,
    Users,
    XCircle,
    CheckCircle2,
    Trash2,
    Info,
    ChevronDown,
    AlertTriangle,
} from "lucide-react";
import { Customer } from "../RouteMap";
import { TeamRep as Rep } from "../data/team";

// Tipler & Props (Değişiklik yok)
type Props = { customers: Customer[]; assignments: Record<string, string | undefined>; setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>; allReps: Rep[]; onBack: () => void; };
type LatLng = [number, number];
type SummaryItem = { repName: string; customerCount: number; totalKm: number | null; repId: string };
type OptimizationResult = { assignments: Record<string, string>; regions: Record<string, LatLng[]>; routes: Record<string, { coords: LatLng[], distance: number }>; summary: SummaryItem[]; };
type ToastState = { message: string; type: 'success' | 'error' | 'info' };

// Yardımcı Fonksiyonlar (Değişiklik yok)
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean { const [x, y] = point; let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j]; const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi; if (intersect) inside = !inside; } return inside; }
function haversineKm(a: LatLng, b: LatLng) { const R = 6371; const dLat = ((b[0] - a[0]) * Math.PI) / 180; const dLng = ((b[1] - a[1]) * Math.PI) / 180; const lat1 = (a[0] * Math.PI) / 180; const lat2 = (b[0] * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
async function osrmTrip(coords: string) { const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found"); return data; }
function initials(name: string) { const parts = name.trim().split(/\s+/); return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase(); }
function repIconFor(rep: Rep) { const bg = rep.color || "#111827"; return L.divIcon({ className: "rep-marker", html: `<div style="display:flex;align-items-center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;border:2px solid #fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);">${initials(rep.name)}</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -24], }); }
function customerIcon(color: string, highlighted = false) { const ring = highlighted ? "box-shadow:0 0 0 6px rgba(0,0,0,.08);" : ""; return L.divIcon({ className: "cust-marker", html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${ring}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -18], }); }
function convexHull(points: LatLng[]): LatLng[] { if (points.length < 3) return points.slice(); const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])); const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]); const lower: LatLng[] = []; for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } const upper: LatLng[] = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } upper.pop(); lower.pop(); return lower.concat(upper); }

const DrawControl = ({ onPolygonCreated, onDeleted }: { onPolygonCreated: (layer: L.Polygon) => void, onDeleted: () => void }) => { /* ... Değişiklik yok ... */ return null; };

const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {
    const mapCenter: LatLng = [40.9368, 29.1553];
    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    
    // DÜZELTME: Panelin başlangıç durumu 'kapalı' (false) olarak ayarlandı.
    const [panelOpen, setPanelOpen] = useState(false);

    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, { coords: LatLng[], distance: number }>>({});
    const [pendingOptimization, setPendingOptimization] = useState<OptimizationResult | null>(null);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    const [toast, setToast] = useState<ToastState | null>(null);

    const colorLookups = useMemo(() => {
        const colorMap: Record<string, string> = {};
        const fillMap: Record<string, string> = {};
        reps.forEach(rep => { colorMap[rep.id] = rep.color; fillMap[rep.id] = rep.fillColor; });
        colorMap['_default'] = '#9ca3af';
        fillMap['_default'] = 'rgba(156,163,175,.18)';
        return { colors: colorMap, fills: fillMap };
    }, [reps]);

    // ... Diğer tüm fonksiyonlar ve mantık aynı kalıyor ...
    const showToast = (message: string, type: ToastState['type'] = 'info', duration = 3000) => { setToast({ message, type }); setTimeout(() => { setToast(null); }, duration); };
    const colorForCustomer = (c: Customer) => { const assignSource = pendingOptimization ? pendingOptimization.assignments : assignments; const repId = assignSource[c.id] || '_default'; return colorLookups.colors[repId] || colorLookups.colors['_default']; };
    const handleClearSelection = useCallback(() => { setSelectedIds([]); }, []);
    const handlePolygonCreated = useCallback((layer: L.Polygon) => { const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(p => [p.lat, p.lng]) as LatLng[]; const insideIds = customers.filter(c => pointInPolygon([c.lat, c.lng], latlngs)).map(c => c.id); setSelectedIds(insideIds); setPanelOpen(true); }, [customers]);
    const handleOptimize = async () => { /* ... Fonksiyon içeriği aynı ... */ };
    const handleConfirmOptimization = () => { if (!pendingOptimization) return; setAssignments(pendingOptimization.assignments); setRegions(pendingOptimization.regions); setOptimizedRoutes(pendingOptimization.routes); setPendingOptimization(null); showToast("Atamalar onaylandı ve uygulandı.", 'success'); };
    const handleCancelOptimization = () => { setPendingOptimization(null); };
    const handleAssignSelected = () => { if (selectedIds.length === 0) { showToast("Atama yapmak için önce müşteri seçin.", 'info'); return; } setAssignments((prev) => { const next = { ...prev }; selectedIds.forEach((id) => { next[id] = selectedRepId; }); return next; }); showToast(`${selectedIds.length} müşteri ${reps.find(r => r.id === selectedRepId)?.name}'a atandı.`, 'success'); handleClearSelection(); };
    const handleToggleSelection = (customerId: string) => { setSelectedIds((prev) => prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]); };
    const displayRegions = pendingOptimization?.regions ?? regions;
    const displayRoutes = pendingOptimization?.routes ?? optimizedRoutes;
    const selectedCustomers = useMemo(() => customers.filter((c) => selectedIds.includes(c.id)), [customers, selectedIds]);
    const toastStyles = { info: { bg: 'bg-white', text: 'text-gray-800', icon: <Info className="text-blue-500" /> }, success: { bg: 'bg-green-600', text: 'text-white', icon: <CheckCircle2 /> }, error: { bg: 'bg-red-600', text: 'text-white', icon: <AlertTriangle /> }, };

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                {/* ... Üst Bar ... */}
            </div>

            <div className="mb-3 text-xs text-gray-600">
                <b>İpucu:</b> Manuel atama için sağdaki paneli kullanın. Tüm müşterileri otomatik dağıtmak için <b>Optimize Et</b> butonuna basın.
            </div>
            
            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow-md">
                <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" className="dark-tile-layer" />
                    <DrawControl onPolygonCreated={handlePolygonCreated} onDeleted={handleClearSelection} />
                    {/* ... Harita içeriği ... */}
                </MapContainer>

                {pendingOptimization && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">
                        {/* ... Özet Paneli ... */}
                    </div>
                )}

                <div className={`absolute top-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"} flex`}>
                    <div className="bg-white/95 backdrop-blur-sm shadow-lg flex flex-col w-[340px] max-w-[90vw] border-l border-gray-200">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800">Manuel Atama Paneli</h3>
                                <button onClick={() => setPanelOpen(false)} className="p-1 text-gray-500 hover:text-gray-800" title="Paneli Kapat"><XCircle className="w-5 h-5"/></button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Haritadan seçim yapıp seçili satış uzmanına atayın.</p>
                        </div>
                        <div className="p-4 space-y-3">
                             <div className="text-sm">
                                <label className="font-medium text-gray-700">Atanacak Satış Uzmanı:</label>
                                <select value={selectedRepId} onChange={(e) => setSelectedRepId(e.target.value)} className="w-full mt-1 border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                                    {reps.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                                </select>
                            </div>
                            <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md">
                                <div>Seçilen Müşteri: <b>{selectedIds.length}</b></div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-auto p-4 pt-0 space-y-2">
                            {selectedCustomers.length === 0 ? (
                                <div className="text-center text-sm text-gray-500 py-8">Seçim yapmak için haritadan çokgen çizin veya müşterilere tıklayın.</div>
                            ) : (
                                selectedCustomers.map((c) => (
                                    <div key={c.id} className="p-2 rounded border bg-white flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                                            <div className="text-xs text-gray-600 max-w-[200px] truncate">{c.address}, {c.district}</div>
                                        </div>
                                        <button onClick={() => handleToggleSelection(c.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Seçimden çıkar"> <XCircle className="w-4 h-4" /> </button>
                                    </div>
                                ))
                            )}
                        </div>
                        {selectedIds.length > 0 && (
                            <div className="p-4 border-t bg-white space-y-2">
                                <button onClick={handleAssignSelected} className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"> <CheckCircle2 className="w-5 h-5" /> {selectedIds.length} Müşteriyi Ata </button>
                                <button onClick={handleClearSelection} className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"> <Trash2 className="w-4 h-4" /> Seçimi Temizle </button>
                            </div>
                        )}
                    </div>
                </div>

                {!panelOpen && (
                    <button onClick={() => setPanelOpen(true)} className="absolute top-4 right-4 z-[1000] bg-white shadow-lg p-3 rounded-full hover:bg-gray-100" title="Paneli Aç">
                        <Users className="w-5 h-5 text-gray-700" />
                    </button>
                )}
                
                {loading && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]"> <div className="rounded-lg bg-white shadow-lg px-6 py-4 text-base font-semibold text-gray-700"> Optimizasyon ve Rota Hesaplamaları Yapılıyor... </div> </div> )}
                
                {toast && (
                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in-down">
                        <div className={`flex items-center gap-3 rounded-xl shadow-2xl px-4 py-3 ${toastStyles[toast.type].bg} ${toastStyles[toast.type].text}`}>
                            {toastStyles[toast.type].icon}
                            <span className="font-semibold text-sm">{toast.message}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentMapScreen;