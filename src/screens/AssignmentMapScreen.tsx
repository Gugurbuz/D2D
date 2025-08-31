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
    AlertTriangle, // Hata durumu için ikon
} from "lucide-react";
import { Customer } from "../RouteMap";
import { Rep } from "../types";

// Tipler & Props
type Props = { 
    customers: Customer[]; 
    assignments: Record<string, string | undefined>; 
    setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>; 
    allReps: Rep[]; 
    onBack: () => void; 
};
type LatLng = [number, number];
type SummaryItem = { repName: string; customerCount: number; totalKm: number | null; repId: string };
type OptimizationResult = {
    assignments: Record<string, string>;
    regions: Record<string, LatLng[]>;
    routes: Record<string, { coords: LatLng[], distance: number }>;
    summary: SummaryItem[];
};
// DEĞİŞİKLİK: Toast state'i artık tip bilgisi de içerecek (success, error, info)
type ToastState = { message: string; type: 'success' | 'error' | 'info' };

// Yardımcı Fonksiyonlar (Değişiklik yok)
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean { const [x, y] = point; let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j]; const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi; if (intersect) inside = !inside; } return inside; }
function haversineKm(a: LatLng, b: LatLng) { const R = 6371; const dLat = ((b[0] - a[0]) * Math.PI) / 180; const dLng = ((b[1] - a[1]) * Math.PI) / 180; const lat1 = (a[0] * Math.PI) / 180; const lat2 = (b[0] * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
async function osrmTrip(coords: string) { const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found"); return data; }
const REP_COLORS: Record<string, string> = { "rep-1": "#0ea5e9", "rep-2": "#22c55e", "rep-3": "#f97316", _default: "#9ca3af", };
const REP_FILLS: Record<string, string> = { "rep-1": "rgba(14,165,233,.18)", "rep-2": "rgba(34,197,94,.18)", "rep-3": "rgba(249,115,22,.18)", _default: "rgba(156,163,175,.18)", };
function initials(name: string) { const parts = name.trim().split(/\s+/); return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase(); }
function repIconFor(rep: Rep) { const bg = REP_COLORS[rep.id] || "#111827"; return L.divIcon({ className: "rep-marker", html: `<div style="display:flex;align-items-center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;border:2px solid #fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);">${initials(rep.name)}</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -24], }); }
function customerIcon(color: string, highlighted = false) { const ring = highlighted ? "box-shadow:0 0 0 6px rgba(0,0,0,.08);" : ""; return L.divIcon({ className: "cust-marker", html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${ring}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -18], }); }
function convexHull(points: LatLng[]): LatLng[] { if (points.length < 3) return points.slice(); const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])); const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]); const lower: LatLng[] = []; for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } const upper: LatLng[] = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } upper.pop(); lower.pop(); return lower.concat(upper); }

const DrawControl = ({ onPolygonCreated, onDeleted }: { onPolygonCreated: (layer: L.Polygon) => void, onDeleted: () => void }) => { /* ... Değişiklik yok ... */ return null; };

const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {
    const mapCenter: LatLng = [40.9368, 29.1553];
    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, { coords: LatLng[], distance: number }>>({});
    const [pendingOptimization, setPendingOptimization] = useState<OptimizationResult | null>(null);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    // DEĞİŞİKLİK: Toast state'i artık obje tutuyor.
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = (message: string, type: ToastState['type'] = 'info', duration = 3000) => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    const colorForCustomer = (c: Customer) => { /* ... Değişiklik yok ... */ };
    const handleClearSelection = useCallback(() => { setSelectedIds([]); }, []);
    const handlePolygonCreated = useCallback((layer: L.Polygon) => { /* ... Değişiklik yok ... */ }, [customers]);
    
    const handleOptimize = async () => {
        setLoading(true);
        setRegions({});
        setOptimizedRoutes({});
        try {
            // ... Optimizasyon mantığı (değişiklik yok) ...
            setPendingOptimization({ assignments: nextAssignments, regions: hulls, routes: newOptimizedRoutes, summary: results });
            setIsSummaryExpanded(true);
        } catch (error) {
            console.error("Optimizasyon sırasında hata:", error);
            // DEĞİŞİKLİK: Hata durumu için yeni toast kullanımı
            showToast("Optimizasyon başarısız oldu.", 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleConfirmOptimization = () => {
        if (!pendingOptimization) return;
        setAssignments(pendingOptimization.assignments);
        setRegions(pendingOptimization.regions);
        setOptimizedRoutes(pendingOptimization.routes);
        setPendingOptimization(null);
        // DEĞİŞİKLİK: Başarı durumu için yeni toast kullanımı
        showToast("Atamalar onaylandı ve uygulandı.", 'success');
    };

    const handleCancelOptimization = () => { setPendingOptimization(null); };
    
    const handleAssignSelected = () => {
        if (selectedIds.length === 0) {
            showToast("Atama yapmak için önce müşteri seçin.", 'info');
            return;
        }
        setAssignments((prev) => { const next = { ...prev }; selectedIds.forEach((id) => { next[id] = selectedRepId; }); return next; });
        showToast(`${selectedIds.length} müşteri ${reps.find(r => r.id === selectedRepId)?.name}'a atandı.`, 'success');
        handleClearSelection();
    };
    
    const handleToggleSelection = (customerId: string) => { /* ... Değişiklik yok ... */ };
    
    const displayRegions = pendingOptimization?.regions ?? regions;
    const displayRoutes = pendingOptimization?.routes ?? optimizedRoutes;
    const selectedCustomers = useMemo(() => customers.filter((c) => selectedIds.includes(c.id)), [customers, selectedIds]);

    // DEĞİŞİKLİK: Toast için stil ve ikonları belirleyen yardımcı obje
    const toastStyles = {
        info: { bg: 'bg-white', text: 'text-gray-800', icon: <Info className="text-blue-500" /> },
        success: { bg: 'bg-green-600', text: 'text-white', icon: <CheckCircle2 /> },
        error: { bg: 'bg-red-600', text: 'text-white', icon: <AlertTriangle /> },
    };

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                {/* ... Üst Bar ... */}
            </div>

            <div className="mb-3 text-xs text-gray-600">
                <b>İpucu:</b> Manuel atama için sağdaki paneli kullanın. Tüm müşterileri otomatik dağıtmak için <b>Optimize Et</b> butonuna basın.
            </div>
            
            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
                <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                    {/* ... Harita İçeriği ... */}
                </MapContainer>

                {pendingOptimization && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl">
                       {/* ... Özet Paneli ... */}
                    </div>
                )}

                <div className={`absolute top-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"} flex`}>
                    {/* ... Manuel Atama Paneli ... */}
                </div>
                {!panelOpen && ( <button onClick={() => setPanelOpen(true)} className="absolute top-4 right-4 z-[1000] bg-white shadow-lg p-3 rounded-full hover:bg-gray-100" title="Paneli Aç"> <Users className="w-5 h-5 text-gray-700" /> </button> )}
                {loading && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]"> <div className="rounded-lg bg-white shadow-lg px-6 py-4 text-base font-semibold text-gray-700"> Optimizasyon ve Rota Hesaplamaları Yapılıyor... </div> </div> )}
            </div>

            {/* DEĞİŞİKLİK: Toast bildiriminin konumu ve tasarımı tamamen yenilendi */}
            {toast && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in-down">
                    <div className={`flex items-center gap-3 rounded-xl shadow-2xl px-4 py-3 ${toastStyles[toast.type].bg} ${toastStyles[toast.type].text}`}>
                        {toastStyles[toast.type].icon}
                        <span className="font-semibold text-sm">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentMapScreen;