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
} from "lucide-react";
import { Customer } from "../RouteMap";
import { Rep } from "../types";

// ... (Tipler, Props ve diğer yardımcı fonksiyonlar aynı)
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

const DrawControl = ({ onPolygonCreated, onDeleted }: { onPolygonCreated: (layer: L.Polygon) => void, onDeleted: () => void }) => { /* ... Değişiklik yok ... */ return null; };

// YENİLİK: Optimizasyon sonuçlarını ve özet verisini tutacak tipler
type OptimizationResult = {
    assignments: Record<string, string>;
    regions: Record<string, LatLng[]>;
    routes: Record<string, { coords: LatLng[], distance: number }>;
    summary: SummaryItem[];
};
type SummaryItem = { repName: string; customerCount: number; totalKm: number | null; repId: string };


const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {
    const mapCenter: LatLng = [40.9368, 29.1553];
    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    
    // Kalıcı (onaylanmış) bölgeler ve rotalar
    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, { coords: LatLng[], distance: number }>>({});

    // YENİLİK: Onay bekleyen optimizasyon sonuçlarını tutacak state
    const [pendingOptimization, setPendingOptimization] = useState<OptimizationResult | null>(null);
    
    // ... (Diğer fonksiyonlar ve useEffect'ler aynı)
    const colorForCustomer = (c: Customer) => REP_COLORS[assignments[c.id] || "_default"] || REP_COLORS._default;
    const handleClearSelection = useCallback(() => { setSelectedIds([]); }, []);
    const handlePolygonCreated = useCallback((layer: L.Polygon) => { const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(p => [p.lat, p.lng]) as LatLng[]; const insideIds = customers.filter(c => pointInPolygon([c.lat, c.lng], latlngs)).map(c => c.id); setSelectedIds(insideIds); }, [customers]);

    const handleOptimize = async () => {
        setLoading(true);
        // Önceki optimizasyon görsellerini temizle
        setRegions({});
        setOptimizedRoutes({});
        
        try {
            // ... (Atama hesaplama mantığı aynı)
            const K = reps.length || 1;
            const target = Math.ceil(customers.length / K);
            let centroids: LatLng[] = reps.map((r) => [r.lat, r.lng]);
            const pts: LatLng[] = customers.map((c) => [c.lat, c.lng]);
            let assign: number[] = new Array(customers.length).fill(-1);
            for (let t = 0; t < 8; t++) { /* K-Means iterasyonları */ }
            
            const nextAssignments: Record<string, string> = {};
            const customersPerRep: Record<string, Customer[]> = Object.fromEntries(reps.map(r => [r.id, []]));
            customers.forEach((c, i) => { const repId = reps[assign[i]]?.id || reps[0].id; nextAssignments[c.id] = repId; if (customersPerRep[repId]) customersPerRep[repId].push(c); });

            const routePromises = reps.map(async (rep) => { /* ... Rota hesaplama mantığı aynı ... */ });
            const results = await Promise.all(routePromises);

            const newOptimizedRoutes: Record<string, { coords: LatLng[], distance: number }> = {};
            results.forEach(res => { if (res.coords.length > 0) newOptimizedRoutes[res.repId] = { coords: res.coords, distance: res.totalKm ?? 0 }; });
            
            const hulls: Record<string, LatLng[]> = {};
            reps.forEach((r) => { hulls[r.id] = customersPerRep[r.id].length ? convexHull(customersPerRep[r.id].map(c => [c.lat, c.lng])) : []; });

            // YENİLİK: Sonuçları doğrudan işlemek yerine "pendingOptimization" state'ine kaydet
            setPendingOptimization({
                assignments: nextAssignments,
                regions: hulls,
                routes: newOptimizedRoutes,
                summary: results,
            });

        } catch (error) {
            console.error("Optimizasyon sırasında hata:", error);
            setToast("Optimizasyon başarısız oldu.");
        } finally {
            setLoading(false);
        }
    };
    
    // YENİLİK: Optimizasyonu onaylama fonksiyonu
    const handleConfirmOptimization = () => {
        if (!pendingOptimization) return;

        // Beklemedeki verileri ana state'lere aktar
        setAssignments(pendingOptimization.assignments);
        setRegions(pendingOptimization.regions);
        setOptimizedRoutes(pendingOptimization.routes);
        
        // Geçici state'i temizle ve modal'ı kapat
        setPendingOptimization(null);
        setToast("Atamalar onaylandı ve uygulandı.");
    };

    // YENİLİK: Optimizasyonu iptal etme / çıkış fonksiyonu
    const handleCancelOptimization = () => {
        setPendingOptimization(null); // Sadece geçici state'i temizle
    };

    // YENİLİK: Haritada gösterilecek bölgeler ve rotalar, ön izleme durumuna göre belirlenir
    const displayRegions = pendingOptimization?.regions ?? regions;
    const displayRoutes = pendingOptimization?.routes ?? optimizedRoutes;

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                {/* ... Üst bar ... */}
            </div>
            
            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
                <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    <DrawControl onPolygonCreated={handlePolygonCreated} onDeleted={handleClearSelection} />

                    {/* Bölgeler artık displayRegions'dan çiziliyor */}
                    {reps.map((r) => { const hull = displayRegions[r.id]; return hull && hull.length >= 3 ? ( <Polygon key={`poly-${r.id}`} positions={hull as unknown as LatLngExpression[]} pathOptions={{ color: REP_COLORS[r.id] || "#444", fillColor: REP_FILLS[r.id] || "rgba(0,0,0,.1)", fillOpacity: 0.6, weight: 2 }} /> ) : null; })}
                    
                    {/* Marker'lar ... */}
                    
                    {/* Rotalar artık displayRoutes'dan çiziliyor */}
                    {Object.entries(displayRoutes).map(([repId, route]) => (
                        route.coords.length > 1 && (
                            <Polyline key={`route-${repId}`} positions={route.coords as LatLngExpression[]} pathOptions={{ color: REP_COLORS[repId] || '#ff0000', weight: 5, opacity: 0.8, dashArray: '5, 10' }} />
                        )
                    ))}
                </MapContainer>

                {/* Manuel Atama Paneli ... */}
            </div>

            {/* YENİLİK: Özet Penceresi (Modal) artık pendingOptimization'a bağlı */}
            {pendingOptimization && (
                <div className="absolute inset-0 z-[1100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-up">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Optimizasyon Ön İzlemesi</h2>
                            <p className="text-sm text-gray-600 mt-1">Aşağıdaki atamaları onaylıyor musunuz? Harita üzerinde sonucu görebilirsiniz.</p>
                        </div>
                        <div className="p-6">
                            <table className="w-full text-left">
                                {/* ... Tablo içeriği aynı, sadece veri kaynağı değişti ... */}
                                <tbody>
                                    {pendingOptimization.summary.map(item => (
                                        <tr key={item.repId} className="border-b last:border-none">
                                            {/* ... */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* YENİLİK: Butonlar güncellendi */}
                        <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={handleCancelOptimization} className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">
                                Çık
                            </button>
                            <button onClick={handleConfirmOptimization} className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700">
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {loading && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]"> <div className="rounded-lg bg-white shadow-lg px-6 py-4 text-base font-semibold text-gray-700"> Optimizasyon ve Rota Hesaplamaları Yapılıyor... </div> </div> )}
        </div>
    );
};

// Kodun kalan kısımları (DrawControl, customerIcon vb.) yukarıdaki tam kod bloklarından alınabilir.
// Okunabilirliği artırmak için burada tekrar edilmemiştir.
// Lütfen bu parçayı projenizdeki tam kodla birleştirin.