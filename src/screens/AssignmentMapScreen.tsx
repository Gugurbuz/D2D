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
function repIconFor(rep: Rep) { const bg = rep.color || "#111827"; return L.divIcon({ className: "rep-marker", html: `<div style="display:flex;align-items-center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;border:2px solid #fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);">${initials(rep.name)}</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -24], }); }
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
    const [toast, setToast] = useState<ToastState | null>(null);

    const colorLookups = useMemo(() => {
        const colorMap: Record<string, string> = {};
        const fillMap: Record<string, string> = {};
        reps.forEach(rep => { colorMap[rep.id] = rep.color; fillMap[rep.id] = rep.fillColor; });
        colorMap['_default'] = '#9ca3af';
        fillMap['_default'] = 'rgba(156,163,175,.18)';
        return { colors: colorMap, fills: fillMap };
    }, [reps]);

    const showToast = (message: string, type: ToastState['type'] = 'info', duration = 3000) => { /* ... Değişiklik yok ... */ };
    const colorForCustomer = (c: Customer) => { /* ... Değişiklik yok ... */ };
    const handleClearSelection = useCallback(() => { setSelectedIds([]); }, []);
    const handlePolygonCreated = useCallback((layer: L.Polygon) => { /* ... Değişiklik yok ... */ }, [customers]);
    
    // YENİLENMİŞ OPTİMİZASYON FONKSİYONU
    const handleOptimize = async () => {
        setLoading(true);
        setRegions({});
        setOptimizedRoutes({});
        try {
            const K = reps.length || 1;
            const pts: LatLng[] = customers.map((c) => [c.lat, c.lng]);
            if (customers.length === 0 || K === 0) return;

            // Coğrafi yayılımın maliyet üzerindeki etkisini belirleyen ağırlık. 
            // Bu değeri artırırsanız, KM denkliğine daha fazla önem verilir. 0.5 iyi bir başlangıç.
            const SPREAD_WEIGHT = 0.5;

            const targetCapacity = Math.ceil(customers.length / K);
            let centroids: LatLng[] = reps.map((r) => [r.lat, r.lng]);
            let assignments: number[] = new Array(customers.length).fill(-1);

            for (let i = 0; i < 10; i++) { // İterasyon sayısı artırıldı
                // 1. Her kümenin mevcut "yayılımını" hesapla
                // Yayılım = kümeye atanan müşterilerin merkeze olan ortalama uzaklığı
                const clusterSpreads = new Array(K).fill(0);
                const clusterMembers: number[][] = Array.from({ length: K }, () => []);
                if (i > 0) { // Sadece ilk iterasyondan sonra
                    assignments.forEach((repIdx, custIdx) => {
                        if (repIdx !== -1) clusterMembers[repIdx].push(custIdx);
                    });

                    clusterMembers.forEach((members, repIdx) => {
                        if (members.length > 0) {
                            const totalDist = members.reduce((sum, custIdx) => sum + haversineKm(pts[custIdx], centroids[repIdx]), 0);
                            clusterSpreads[repIdx] = totalDist / members.length;
                        }
                    });
                }

                // 2. Müşterileri, kapasite ve birleşik maliyete göre ata
                const buckets: number[][] = Array.from({ length: K }, () => []);
                const customerOrder = [...customers.keys()].sort((a, b) => Math.random() - 0.5); // Atama sırasını rastgele yap

                customerOrder.forEach(custIdx => {
                    const point = pts[custIdx];
                    const costs = centroids.map((centroid, repIdx) => {
                        const distanceCost = haversineKm(point, centroid);
                        const spreadCost = clusterSpreads[repIdx] || 0;
                        const totalCost = distanceCost + (SPREAD_WEIGHT * spreadCost);
                        return { repIdx, cost: totalCost };
                    }).sort((a, b) => a.cost - b.cost);

                    let chosenRep = -1;
                    for (const { repIdx } of costs) {
                        if (buckets[repIdx].length < targetCapacity) {
                            chosenRep = repIdx;
                            break;
                        }
                    }
                    if (chosenRep === -1) chosenRep = costs[0].repIdx; // Kapasite dolduysa en iyi maliyetliye ata

                    buckets[chosenRep].push(custIdx);
                    assignments[custIdx] = chosenRep;
                });

                // 3. Merkezleri güncelle
                centroids = buckets.map((bucket, k) => {
                    if (bucket.length === 0) return reps[k] ? [reps[k].lat, reps[k].lng] : centroids[k];
                    const sum = bucket.reduce((acc, i) => [acc[0] + pts[i][0], acc[1] + pts[i][1]], [0, 0] as LatLng);
                    return [sum[0] / bucket.length, sum[1] / bucket.length];
                });
            }

            // Sonuçları işleme (öncekiyle aynı)
            const nextAssignments: Record<string, string> = {};
            const customersPerRep: Record<string, Customer[]> = Object.fromEntries(reps.map(r => [r.id, []]));
            customers.forEach((c, i) => { const repId = reps[assignments[i]]?.id || reps[0].id; nextAssignments[c.id] = repId; if (customersPerRep[repId]) customersPerRep[repId].push(c); });
            const routePromises = reps.map(async (rep) => { /* ... */ });
            const results = await Promise.all(routePromises);
            const newOptimizedRoutes: Record<string, { coords: LatLng[], distance: number }> = {};
            results.forEach(res => { if (res.coords.length > 0) newOptimizedRoutes[res.repId] = { coords: res.coords, distance: res.totalKm ?? 0 }; });
            const hulls: Record<string, LatLng[]> = {};
            reps.forEach((r) => { hulls[r.id] = customersPerRep[r.id].length ? convexHull(customersPerRep[r.id].map(c => [c.lat, c.lng])) : []; });
            setPendingOptimization({ assignments: nextAssignments, regions: hulls, routes: newOptimizedRoutes, summary: results });
            setIsSummaryExpanded(true);

        } catch (error) {
            console.error("Optimizasyon sırasında hata:", error);
            showToast("Optimizasyon başarısız oldu.", 'error');
        } finally {
            setLoading(false);
        }
    };
    
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
            {/* ... Arayüz (değişiklik yok) ... */}
        </div>
    );
};

export default AssignmentMapScreen;