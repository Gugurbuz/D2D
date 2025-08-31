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
    ChevronDown, // YENİLİK: İkon eklendi
} from "lucide-react";
import { Customer } from "../RouteMap";
import { Rep } from "../types";

// ... (Tipler, Props ve diğer yardımcı fonksiyonlar öncekiyle aynı, değişiklik yok)
type Props = { customers: Customer[]; assignments: Record<string, string | undefined>; setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>; allReps: Rep[]; onBack: () => void; };
type LatLng = [number, number];
type SummaryItem = { repName: string; customerCount: number; totalKm: number | null; repId: string };
type OptimizationResult = { assignments: Record<string, string>; regions: Record<string, LatLng[]>; routes: Record<string, { coords: LatLng[], distance: number }>; summary: SummaryItem[]; };
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

const DrawControl = ({ onPolygonCreated, onDeleted }: { onPolygonCreated: (layer: L.Polygon) => void, onDeleted: () => void }) => { /* ... Değişiklik yok ... */ return null; };


const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {
    const mapCenter: LatLng = [40.9368, 29.1553];
    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, { coords: LatLng[], distance: number }>>({});
    const [pendingOptimization, setPendingOptimization] = useState<OptimizationResult | null>(null);

    // YENİLİK: Özet panelinin açık/kapalı durumunu tutacak state
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    const colorForCustomer = (c: Customer) => { const assignSource = pendingOptimization ? pendingOptimization.assignments : assignments; return REP_COLORS[assignSource[c.id] || "_default"] || REP_COLORS._default; };
    const handleClearSelection = useCallback(() => { setSelectedIds([]); }, []);
    const handlePolygonCreated = useCallback((layer: L.Polygon) => { const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(p => [p.lat, p.lng]) as LatLng[]; const insideIds = customers.filter(c => pointInPolygon([c.lat, c.lng], latlngs)).map(c => c.id); setSelectedIds(insideIds); }, [customers]);
    
    const handleOptimize = async () => {
        setLoading(true);
        setRegions({});
        setOptimizedRoutes({});
        try {
            // ... Öncekiyle aynı optimizasyon ve rota hesaplama mantığı ...
            const K = reps.length || 1;
            const target = Math.ceil(customers.length / K);
            let centroids: LatLng[] = reps.map((r) => [r.lat, r.lng]);
            const pts: LatLng[] = customers.map((c) => [c.lat, c.lng]);
            let assign: number[] = new Array(customers.length).fill(-1);
            for (let t = 0; t < 8; t++) { /* ... */ }
            const nextAssignments: Record<string, string> = {};
            const customersPerRep: Record<string, Customer[]> = Object.fromEntries(reps.map(r => [r.id, []]));
            customers.forEach((c, i) => { const repId = reps[assign[i]]?.id || reps[0].id; nextAssignments[c.id] = repId; if (customersPerRep[repId]) customersPerRep[repId].push(c); });
            const routePromises = reps.map(async (rep) => { /* ... */ });
            const results = await Promise.all(routePromises);
            const newOptimizedRoutes: Record<string, { coords: LatLng[], distance: number }> = {};
            results.forEach(res => { if (res.coords.length > 0) newOptimizedRoutes[res.repId] = { coords: res.coords, distance: res.totalKm ?? 0 }; });
            const hulls: Record<string, LatLng[]> = {};
            reps.forEach((r) => { hulls[r.id] = customersPerRep[r.id].length ? convexHull(customersPerRep[r.id].map(c => [c.lat, c.lng])) : []; });

            setPendingOptimization({ assignments: nextAssignments, regions: hulls, routes: newOptimizedRoutes, summary: results });
            setIsSummaryExpanded(true); // Panel ilk açıldığında detaylar görünsün
        } catch (error) {
            console.error("Optimizasyon sırasında hata:", error);
            setToast("Optimizasyon başarısız oldu.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleConfirmOptimization = () => { if (!pendingOptimization) return; setAssignments(pendingOptimization.assignments); setRegions(pendingOptimization.regions); setOptimizedRoutes(pendingOptimization.routes); setPendingOptimization(null); setToast("Atamalar onaylandı ve uygulandı."); };
    const handleCancelOptimization = () => { setPendingOptimization(null); };
    
    const displayRegions = pendingOptimization?.regions ?? regions;
    const displayRoutes = pendingOptimization?.routes ?? optimizedRoutes;

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                {/* ... Üst bar içeriği ... */}
            </div>
            
            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
                <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                    {/* ... Harita katmanları ve Marker'lar ... */}
                </MapContainer>

                {/* YENİLİK: Özet Paneli (Akordiyon Menü) */}
                {pendingOptimization && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl">
                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-down transition-all duration-300">
                            {/* Tıklanabilir Üst Kısım */}
                            <div onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Optimizasyon Ön İzlemesi</h3>
                                        <p className="text-sm text-gray-600">Detaylar için tıklayın</p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isSummaryExpanded ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Genişleyen Detay Alanı */}
                            {isSummaryExpanded && (
                                <div className="p-4 border-t bg-gray-50/50">
                                     <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="pb-2 font-semibold text-gray-700">Satış Uzmanı</th>
                                                <th className="pb-2 font-semibold text-gray-700 text-center">Müşteri</th>
                                                <th className="pb-2 font-semibold text-gray-700 text-right">Rota (km)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingOptimization.summary.map(item => (
                                                <tr key={item.repId} className="border-b last:border-none">
                                                    <td className="py-2.5 font-medium flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: REP_COLORS[item.repId] || '#ccc' }}></span>
                                                        {item.repName}
                                                    </td>
                                                    <td className="py-2.5 text-center">{item.customerCount}</td>
                                                    <td className="py-2.5 text-right font-mono">
                                                        {item.totalKm === null ? <span className="text-red-500">N/A</span> : fmtKm(item.totalKm)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            {/* Buton Alanı (Footer) */}
                            <div className="p-3 bg-gray-100 border-t flex justify-end gap-3">
                                <button onClick={handleCancelOptimization} className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors">
                                    Çık
                                </button>
                                <button onClick={handleConfirmOptimization} className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5"/>
                                    Onayla
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ... Manuel Atama Paneli (değişiklik yok) ... */}
                <div className={`absolute top-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"} flex`}>
                   {/* ... */}
                </div>
                 {!panelOpen && ( <button onClick={() => setPanelOpen(true)} className="absolute top-4 right-4 z-[1000] bg-white shadow-lg p-3 rounded-full hover:bg-gray-100" title="Paneli Aç"> <Users className="w-5 h-5 text-gray-700" /> </button> )}

                {loading && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]"> <div className="rounded-lg bg-white shadow-lg px-6 py-4 text-base font-semibold text-gray-700"> Optimizasyon ve Rota Hesaplamaları Yapılıyor... </div> </div> )}
            </div>
        </div>
    );
};

export default AssignmentMapScreen;