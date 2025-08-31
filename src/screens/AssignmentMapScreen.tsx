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
// DEĞİŞİKLİK: 'Rep' tipinin artık 'TeamRep' ile aynı olduğunu ve renkleri içerdiğini varsayıyoruz.
// Projenizdeki types.ts dosyasında 'Rep' tipini 'TeamRep' ile eşitlemeniz gerekebilir.
import { TeamRep as Rep } from "../data/team"; 

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
type ToastState = { message: string; type: 'success' | 'error' | 'info' };

// Yardımcı Fonksiyonlar
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean { const [x, y] = point; let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j]; const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi; if (intersect) inside = !inside; } return inside; }
function haversineKm(a: LatLng, b: LatLng) { const R = 6371; const dLat = ((b[0] - a[0]) * Math.PI) / 180; const dLng = ((b[1] - a[1]) * Math.PI) / 180; const lat1 = (a[0] * Math.PI) / 180; const lat2 = (b[0] * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
async function osrmTrip(coords: string) { const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found"); return data; }
function initials(name: string) { const parts = name.trim().split(/\s+/); return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase(); }

// GÜNCELLENDİ: repIconFor artık rep objesinden rengi doğrudan alıyor
function repIconFor(rep: Rep) {
    const bg = rep.color || "#111827"; // Fallback to black
    return L.divIcon({ className: "rep-marker", html: `<div style="display:flex;align-items-center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;border:2px solid #fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);">${initials(rep.name)}</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -24], });
}

function customerIcon(color: string, highlighted = false) { const ring = highlighted ? "box-shadow:0 0 0 6px rgba(0,0,0,.08);" : ""; return L.divIcon({ className: "cust-marker", html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${ring}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -18], }); }
function convexHull(points: LatLng[]): LatLng[] { if (points.length < 3) return points.slice(); const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])); const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]); const lower: LatLng[] = []; for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } const upper: LatLng[] = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } upper.pop(); lower.pop(); return lower.concat(upper); }

const DrawControl = ({ onPolygonCreated, onDeleted }: { onPolygonCreated: (layer: L.Polygon) => void, onDeleted: () => void }) => { /* ... Değişiklik yok ... */ return null; };

const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {
    // ... State'ler (değişiklik yok) ...
    const mapCenter: LatLng = [40.9368, 29.1553];
    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, { coords: LatLng[], distance: number }>>({});
    const [pendingOptimization, setPendingOptimization] = useState<OptimizationResult | null>(null);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    const [toast, setToast] = useState<ToastState | null>(null);

    // YENİLİK: Renkler artık `allReps` prop'undan dinamik olarak oluşturulan bir sözlükten geliyor
    const colorLookups = useMemo(() => {
        const colorMap: Record<string, string> = {};
        const fillMap: Record<string, string> = {};
        
        reps.forEach(rep => {
            colorMap[rep.id] = rep.color;
            fillMap[rep.id] = rep.fillColor;
        });

        // Atanmamış veya ID'si bulunamayanlar için varsayılan renkler
        colorMap['_default'] = '#9ca3af';
        fillMap['_default'] = 'rgba(156,163,175,.18)';

        return { colors: colorMap, fills: fillMap };
    }, [reps]);

    const showToast = (message: string, type: ToastState['type'] = 'info', duration = 3000) => { /* ... Değişiklik yok ... */ };
    
    // GÜNCELLENDİ: colorForCustomer artık dinamik renk sözlüğünü kullanıyor
    const colorForCustomer = (c: Customer) => {
        const assignSource = pendingOptimization ? pendingOptimization.assignments : assignments;
        const repId = assignSource[c.id] || '_default';
        return colorLookups.colors[repId] || colorLookups.colors['_default'];
    };

    const handleClearSelection = useCallback(() => { setSelectedIds([]); }, []);
    const handlePolygonCreated = useCallback((layer: L.Polygon) => { /* ... */ }, [customers]);
    const handleOptimize = async () => { /* ... Değişiklik yok ... */ };
    const handleConfirmOptimization = () => { /* ... Değişiklik yok ... */ };
    const handleCancelOptimization = () => { /* ... Değişiklik yok ... */ };
    const handleAssignSelected = () => { /* ... Değişiklik yok ... */ };
    const handleToggleSelection = (customerId: string) => { /* ... Değişiklik yok ... */ };
    
    const displayRegions = pendingOptimization?.regions ?? regions;
    const displayRoutes = pendingOptimization?.routes ?? optimizedRoutes;
    const selectedCustomers = useMemo(() => customers.filter((c) => selectedIds.includes(c.id)), [customers, selectedIds]);
    const toastStyles = { /* ... Değişiklik yok ... */ };

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
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    <DrawControl onPolygonCreated={handlePolygonCreated} onDeleted={handleClearSelection} />

                    {/* GÜNCELLENDİ: Bölgeler renklerini doğrudan 'rep' objesinden alıyor */}
                    {reps.map((r) => { 
                        const hull = displayRegions[r.id]; 
                        return hull && hull.length >= 3 ? ( 
                            <Polygon key={`poly-${r.id}`} positions={hull as unknown as LatLngExpression[]} 
                                     pathOptions={{ color: r.color, fillColor: r.fillColor, fillOpacity: 0.6, weight: 2 }} /> 
                        ) : null; 
                    })}
                    
                    {/* GÜNCELLENDİ: Temsilci ikonu rengini doğrudan 'rep' objesinden alıyor */}
                    {reps.map((r) => ( <Marker key={r.id} position={[r.lat, r.lng]} icon={repIconFor(r)}> <Popup><b>{r.name}</b></Popup> </Marker> ))}
                    
                    {customers.map((c) => {
                        const color = colorForCustomer(c);
                        const isSelected = selectedIds.includes(c.id);
                        return ( <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon(color, isSelected)}> {/* ... Popup ... */} </Marker> );
                    })}
                    
                    {/* GÜNCELLENDİ: Rotalar renklerini dinamik renk sözlüğünden alıyor */}
                    {Object.entries(displayRoutes).map(([repId, route]) => ( 
                        route.coords.length > 1 && ( 
                            <Polyline key={`route-${repId}`} positions={route.coords as LatLngExpression[]} 
                                      pathOptions={{ color: colorLookups.colors[repId] || '#ff0000', weight: 5, opacity: 0.8, dashArray: '5, 10' }} /> 
                        ) 
                    ))}
                </MapContainer>

                {pendingOptimization && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl">
                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-down transition-all duration-300">
                            {/* ... Özet Paneli içeriği ... */}
                            <div onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                {/* ... */}
                            </div>
                            {isSummaryExpanded && (
                                <div className="p-4 border-t bg-gray-50/50">
                                     <table className="w-full text-left">
                                        <tbody>
                                            {/* GÜNCELLENDİ: Renk noktası artık dinamik renk sözlüğünden geliyor */}
                                            {pendingOptimization.summary.map(item => (
                                                <tr key={item.repId} className="border-b last:border-none">
                                                    <td className="py-2.5 font-medium flex items-center gap-2"> 
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorLookups.colors[item.repId] || '#ccc' }}></span> 
                                                        {item.repName} 
                                                    </td>
                                                    {/* ... */}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="p-3 bg-gray-100 border-t flex justify-end gap-3">
                               {/* ... Butonlar ... */}
                            </div>
                        </div>
                    </div>
                )}

                <div className={`absolute top-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"} flex`}>
                   {/* ... Manuel Atama Paneli ... */}
                </div>
                {!panelOpen && ( <button onClick={() => setPanelOpen(true)} className="absolute top-4 right-4 z-[1000] bg-white shadow-lg p-3 rounded-full hover:bg-gray-100" title="Paneli Aç"> <Users className="w-5 h-5 text-gray-700" /> </button> )}
                {loading && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]"> {/* ... Loading ... */} </div> )}
                
                {toast && (
                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in-down">
                        {/* ... Toast ... */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentMapScreen;