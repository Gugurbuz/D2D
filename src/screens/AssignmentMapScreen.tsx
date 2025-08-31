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
    Ruler,
    Users,
    XCircle,
    Info,
    Minimize2,
    CheckCircle2, // YENİLİK: İkon eklendi
    Trash2,      // YENİLİK: İkon eklendi
} from "lucide-react";
import { Customer } from "../RouteMap";
import { Rep } from "../types";

// ... (Tipler, Props ve Yardımcı Fonksiyonlar aynı kalıyor, değişiklik yok)
type Props = { customers: Customer[]; assignments: Record<string, string | undefined>; setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>; allReps: Rep[]; onBack: () => void; };
type LatLng = [number, number];
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean { const [x, y] = point; let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j]; const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi; if (intersect) inside = !inside; } return inside; }
function haversineKm(a: LatLng, b: LatLng) { const R = 6371; const dLat = ((b[0] - a[0]) * Math.PI) / 180; const dLng = ((b[1] - a[1]) * Math.PI) / 180; const lat1 = (a[0] * Math.PI) / 180; const lat2 = (b[0] * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
async function osrmTrip(coords: string) { const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found"); return data; }
const REP_COLORS: Record<string, string> = { "rep-1": "#0ea5e9", "rep-2": "#22c55e", "rep-3": "#f97316", _default: "#9ca3af", };
const REP_FILLS: Record<string, string> = { "rep-1": "rgba(14,165,233,.18)", "rep-2": "rgba(34,197,94,.18)", "rep-3": "rgba(249,115,22,.18)", _default: "rgba(156,163,175,.18)", };
function initials(name: string) { const parts = name.trim().split(/\s+/); return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase(); }
function repIconFor(rep: Rep) { const bg = REP_COLORS[rep.id] || "#111827"; return L.divIcon({ className: "rep-marker", html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;border:2px solid #fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);">${initials(rep.name)}</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -24], }); }
function customerIcon(color: string, highlighted = false) { const ring = highlighted ? "box-shadow:0 0 0 6px rgba(0,0,0,.08);" : ""; return L.divIcon({ className: "cust-marker", html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${ring}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -18], }); }
function convexHull(points: LatLng[]): LatLng[] { if (points.length < 3) return points.slice(); const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])); const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]); const lower: LatLng[] = []; for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } const upper: LatLng[] = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } upper.pop(); lower.pop(); return lower.concat(upper); }

/* ------------------------------------------------
    Ana Bileşen
------------------------------------------------ */
const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {
    const mapCenter: LatLng = [40.9368, 29.1553];

    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [routeKm, setRouteKm] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});

    // YENİLİK: Seçili müşteriler için rota hesaplama useMemo ile optimize edildi
    useEffect(() => {
        const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));
        if (selectedCustomers.length > 0) {
            computeRouteForSelection(selectedCustomers);
        } else {
            setRouteCoords([]);
            setRouteKm(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIds, selectedRepId, customers]);

    const colorForCustomer = (c: Customer) => REP_COLORS[assignments[c.id] || "_default"] || REP_COLORS._default;

    // YENİLİK: Tüm seçimleri ve çizimleri temizleyen merkezi bir fonksiyon
    const handleClearSelection = useCallback(() => {
        setSelectedIds([]);
        setRouteCoords([]);
        setRouteKm(null);
        if (drawnItemsRef.current) {
            drawnItemsRef.current.clearLayers();
        }
    }, []);

    // YENİLİK: Seçilen müşterileri toplu atamak için merkezi fonksiyon
    const handleAssignSelected = () => {
        if (selectedIds.length === 0) {
            setToast("Atama yapmak için önce müşteri seçin.");
            setTimeout(() => setToast(null), 2000);
            return;
        }
        setAssignments((prev) => {
            const next = { ...prev };
            selectedIds.forEach((id) => {
                next[id] = selectedRepId;
            });
            return next;
        });
        setToast(`${selectedIds.length} müşteri ${reps.find(r => r.id === selectedRepId)?.name}'a atandı.`);
        setTimeout(() => setToast(null), 2000);
        handleClearSelection(); // Atama sonrası seçimi temizle
    };
    
    // YENİLİK: Popup'tan tek bir müşteriyi seçime ekleme/çıkarma fonksiyonu
    const handleToggleSelection = (customerId: string) => {
        setSelectedIds((prev) =>
            prev.includes(customerId)
                ? prev.filter((id) => id !== customerId)
                : [...prev, customerId]
        );
    };

    const computeRouteForSelection = async (list: Customer[]) => {
        try {
            setLoading(true);
            const rep = reps.find((r) => r.id === selectedRepId) || reps[0];
            const start: LatLng = [rep.lat, rep.lng];
            const coords = [start, ...list.map((c) => [c.lat, c.lng] as LatLng)].map((p) => `${p[1]},${p[0]}`).join(";");
            const data = await osrmTrip(coords);
            const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
            setRouteCoords(latlngs);
            setRouteKm((data.trips[0].distance as number) / 1000);
        } catch {
            const rep = reps.find((r) => r.id === selectedRepId) || reps[0];
            const seq = [[rep.lat, rep.lng] as LatLng, ...list.map((c) => [c.lat, c.lng] as LatLng)];
            let acc = 0; for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
            setRouteCoords(seq); setRouteKm(acc);
        } finally {
            setLoading(false);
        }
    };

    // YENİLİK: DrawControl bileşeni ve mantığı basitleştirildi
    const DrawControl = () => {
        const map = useMap();

        useEffect(() => {
            if (!map || drawnItemsRef.current) return; // Zaten varsa tekrar ekleme

            const drawnItems = new L.FeatureGroup();
            drawnItemsRef.current = drawnItems;
            map.addLayer(drawnItems);

            const drawControl = new (L as any).Control.Draw({
                draw: { rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false,
                    polygon: { allowIntersection: false, showArea: false, drawError: { color: "#ff0000", message: "Hatalı çizim" } },
                },
                edit: { featureGroup: drawnItems, edit: false, remove: true },
            });

            map.addControl(drawControl);

            const onCreated = (e: any) => {
                const layer = e.layer as L.Polygon;
                drawnItems.clearLayers(); // Önceki çizimi temizle
                drawnItems.addLayer(layer);

                const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(p => [p.lat, p.lng]) as LatLng[];
                const insideIds = customers.filter(c => pointInPolygon([c.lat, c.lng], latlngs)).map(c => c.id);
                setSelectedIds(insideIds);
            };

            const onDeleted = () => {
                handleClearSelection();
            };

            map.on((L as any).Draw.Event.CREATED, onCreated);
            map.on((L as any).Draw.Event.DELETED, onDeleted);

            return () => {
                map.removeControl(drawControl);
                if (map.hasLayer(drawnItems)) {
                    map.removeLayer(drawnItems);
                }
                drawnItemsRef.current = null;
                map.off((L as any).Draw.Event.CREATED, onCreated);
                map.off((L as any).Draw.Event.DELETED, onDeleted);
            };
        }, [map]); // YENİLİK: Bağımlılık sadece 'map' olmalı

        return null;
    };
    
    // ... (handleOptimize fonksiyonu aynı kalıyor)
    const handleOptimize = async () => { /* ... Mevcut kod ... */  const K = reps.length || 1; if (!K) return; const target = Math.ceil(customers.length / K); let centroids: LatLng[] = reps.map((r) => [r.lat, r.lng]); const pts: LatLng[] = customers.map((c) => [c.lat, c.lng]); let assign: number[] = new Array(customers.length).fill(-1); const iter = 8; for (let t = 0; t < iter; t++) { const buckets: number[][] = Array.from({ length: K }, () => []); pts.forEach((p, i) => { const order = centroids.map((c, k) => ({ k, d: haversineKm(p, c) })).sort((a, b) => a.d - b.d); let chosen = order[0].k; for (const cand of order) { if (buckets[cand.k].length < target) { chosen = cand.k; break; } } buckets[chosen].push(i); assign[i] = chosen; }); centroids = buckets.map((idxs, k) => { if (idxs.length === 0) return centroids[k]; const s = idxs.reduce((acc, i) => [acc[0] + pts[i][0], acc[1] + pts[i][1]], [0, 0] as LatLng); return [s[0] / idxs.length, s[1] / idxs.length] as LatLng; }); } const next: Record<string, string> = {}; customers.forEach((c, i) => { const repId = reps[assign[i]]?.id || reps[0].id; next[c.id] = repId; }); setAssignments((prev) => ({ ...prev, ...next })); const perRepPoints: Record<string, LatLng[]> = {}; reps.forEach((r) => (perRepPoints[r.id] = [])); customers.forEach((c, i) => { const rid = next[c.id]!; perRepPoints[rid].push([c.lat, c.lng]); }); const hulls: Record<string, LatLng[]> = {}; reps.forEach((r) => { const pts = perRepPoints[r.id]; hulls[r.id] = pts.length ? convexHull(pts.map((p) => [p[0], p[1]])) : []; }); setRegions(hulls); setToast("Otomatik atama tamamlandı."); setTimeout(() => setToast(null), 2000); };
    
    const selectedCustomers = useMemo(() => customers.filter((c) => selectedIds.includes(c.id)), [customers, selectedIds]);

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                {/* ... (Üst Bar aynı kalıyor) ... */}
                <div className="flex items-center gap-2 text-gray-900 font-semibold"> <button onClick={onBack} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"> <ArrowLeft className="w-4 h-4" /> Geri </button> <div className="flex items-center gap-2 ml-2"> <RouteIcon className="w-5 h-5 text-[#0099CB]" /> Haritadan Görev Atama </div> </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleOptimize} className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90" title="Müşterileri ekip arasında en dengeli şekilde dağıt"> Optimize Et </button>
                </div>
            </div>
            
            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
                <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    <DrawControl />
                    
                    {/* Rep bölgeleri (optimize sonrası) */}
                    {reps.map((r) => { const hull = regions[r.id]; return hull && hull.length >= 3 ? ( <Polygon key={`poly-${r.id}`} positions={hull as unknown as LatLngExpression[]} pathOptions={{ color: REP_COLORS[r.id] || "#444", fillColor: REP_FILLS[r.id] || "rgba(0,0,0,.1)", fillOpacity: 0.6, weight: 2 }} /> ) : null; })}
                    {/* Rep Marker'ları */}
                    {reps.map((r) => ( <Marker key={r.id} position={[r.lat, r.lng]} icon={repIconFor(r)}> <Popup><b>{r.name}</b></Popup> </Marker> ))}

                    {/* Müşteri Marker'ları */}
                    {customers.map((c) => {
                        const color = colorForCustomer(c);
                        const isSelected = selectedIds.includes(c.id);
                        return (
                            <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon(color, isSelected)}>
                                <Popup>
                                    <div className="space-y-1">
                                        <div className="font-semibold">{c.name}</div>
                                        <div className="text-xs text-gray-500">Atanan: <b>{assignments[c.id] ? (reps.find(r => r.id === assignments[c.id])?.name || assignments[c.id]) : "—"}</b></div>
                                        <div className="flex gap-2 mt-2">
                                            {/* YENİLİK: Popup butonu sadeleştirildi */}
                                            <button onClick={() => handleToggleSelection(c.id)} className={`w-full px-3 py-1.5 rounded border text-xs transition-colors ${isSelected ? "bg-amber-100 border-amber-300" : "bg-white"}`}>
                                                {isSelected ? "Seçimden Kaldır" : "Seçime Ekle"}
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {routeCoords.length > 1 && (<Polyline positions={routeCoords as LatLngExpression[]} pathOptions={{ color: "#0099CB", weight: 7 }} />)}
                </MapContainer>

                {/* YENİLİK: SAĞ PANEL TAMAMEN YENİLENDİ */}
                <div className={`absolute top-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"} flex`}>
                    <div className="bg-white/95 backdrop-blur-sm shadow-lg flex flex-col w-[340px] max-w-[90vw]">
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
                                <select value={selectedRepId} onChange={(e) => setSelectedRepId(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-1.5">
                                    {reps.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                                </select>
                            </div>
                            <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md">
                                <div>Seçilen Müşteri: <b>{selectedIds.length}</b></div>
                                <div>Tahmini Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></div>
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
                                        <button onClick={() => handleToggleSelection(c.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Seçimden çıkar">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {selectedIds.length > 0 && (
                            <div className="p-4 border-t bg-white space-y-2">
                                <button onClick={handleAssignSelected} className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {selectedIds.length} Müşteriyi Ata
                                </button>
                                <button onClick={handleClearSelection} className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                    Seçimi Temizle
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {!panelOpen && (
                    <button onClick={() => setPanelOpen(true)} className="absolute top-4 right-4 z-[1000] bg-white shadow-lg p-3 rounded-full hover:bg-gray-100" title="Paneli Aç">
                        <Users className="w-5 h-5 text-gray-700" />
                    </button>
                )}
                
                {loading && ( <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-[900]"> <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700"> Rota Hesaplanıyor… </div> </div> )}
            </div>

            <div className="mt-2 text-xs text-gray-600">
                <b>İpucu:</b> Manuel atama için sağdaki paneli kullanın. Tüm müşterileri otomatik dağıtmak için <b>Optimize Et</b> butonuna basın.
            </div>

            {toast && ( <div className="fixed top-4 right-4 z-[1100]"> <div className="bg-white rounded-xl shadow-lg border px-4 py-3 text-sm text-gray-800"> {toast} </div> </div> )}
        </div>
    );
};

export default AssignmentMapScreen;