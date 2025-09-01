
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



// =================================================================================

// Tipler & Arayüzler (Types & Interfaces)

// =================================================================================

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

    routes: Record<string, { coords: LatLng[]; distance: number }>;

    summary: SummaryItem[];

};

type ToastState = { message: string; type: 'success' | 'error' | 'info' };



// =================================================================================

// Sabitler (Constants)

// =================================================================================

const MAP_CENTER: LatLng = [40.9368, 29.1553];

const MAP_ZOOM = 13;

const OPTIMIZATION_ITERATIONS = 10;

const SPREAD_WEIGHT = 0.5; // K-Means dengeleme faktörü



// =================================================================================

// Yardımcı Fonksiyonlar (Helper Functions)

// =================================================================================

const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

const pointInPolygon = (point: LatLng, polygon: LatLng[]): boolean => { const [x, y] = point; let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j]; const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi; if (intersect) inside = !inside; } return inside; };

const haversineKm = (a: LatLng, b: LatLng) => { const R = 6371; const dLat = ((b[0] - a[0]) * Math.PI) / 180; const dLng = ((b[1] - a[1]) * Math.PI) / 180; const lat1 = (a[0] * Math.PI) / 180; const lat2 = (b[0] * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

const osrmTrip = async (coords: string) => { const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found"); return data; };

const initials = (name: string) => { const parts = name.trim().split(/\s+/); return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase(); };

const createRepIcon = (rep: Rep) => L.divIcon({ className: "rep-marker", html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${rep.color || "#111827"};color:#fff;border:2px solid #fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);">${initials(rep.name)}</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -24] });

const createCustomerIcon = (color: string, highlighted = false) => { const ring = highlighted ? "box-shadow:0 0 0 6px rgba(0,0,0,.08);" : ""; return L.divIcon({ className: "cust-marker", html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${ring}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -18] }); };

const convexHull = (points: LatLng[]): LatLng[] => { if (points.length < 3) return points.slice(); const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])); const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]); const lower: LatLng[] = []; for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } const upper: LatLng[] = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } upper.pop(); lower.pop(); return lower.concat(upper); };





// =================================================================================

// Alt Bileşenler (Child Components)

// =================================================================================



// Harita Çizim Kontrolü

const DrawControl = ({ onPolygonCreated, onDeleted }: { onPolygonCreated: (layer: L.Polygon) => void, onDeleted: () => void }) => {

    const map = useMap();

    useEffect(() => {

        const drawnItems = new L.FeatureGroup();

        map.addLayer(drawnItems);



        const drawControl = new (L as any).Control.Draw({

            draw: { polygon: { allowIntersection: false, showArea: false }, rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false },

            edit: { featureGroup: drawnItems, remove: true, edit: false },

        });

        map.addControl(drawControl);



        let currentPolygon: L.Polygon | null = null;

        const handleCreated = (e: any) => {

            if (currentPolygon) {

                drawnItems.removeLayer(currentPolygon);

            }

            currentPolygon = e.layer as L.Polygon;

            drawnItems.addLayer(currentPolygon);

            onPolygonCreated(currentPolygon);

        };

        const handleDeleted = () => {

            currentPolygon = null;

            onDeleted();

        };



        map.on((L as any).Draw.Event.CREATED, handleCreated);

        map.on((L as any).Draw.Event.DELETED, handleDeleted);



        return () => {

            map.removeControl(drawControl);

            if (map.hasLayer(drawnItems)) map.removeLayer(drawnItems);

            map.off((L as any).Draw.Event.CREATED, handleCreated);

            map.off((L as any).Draw.Event.DELETED, handleDeleted);

        };

    }, [map, onPolygonCreated, onDeleted]);

    return null;

};



// Harita Katmanları Bileşeni

const MapLayers = React.memo(({ customers, reps, assignments, pendingOptimization, selectedIds, onToggleSelection, colorLookups, displayRegions, displayRoutes, repIcons, customerIcons }: any) => {

    return <>

        {/* Bölgeler (Polygons) */}

        {Object.entries(displayRegions).map(([repId, hull]) => {

            const rep = reps.find((r: Rep) => r.id === repId);

            return rep && Array.isArray(hull) && hull.length >= 3 ? (

                <Polygon key={`poly-${repId}`} positions={hull as LatLngExpression[]} pathOptions={{ color: rep.color, fillColor: rep.fillColor, fillOpacity: 0.6, weight: 2 }} />

            ) : null;

        })}



        {/* Satış Uzmanı Marker'ları */}

        {reps.map((r: Rep) => (

            <Marker key={r.id} position={[r.lat, r.lng]} icon={repIcons[r.id]}>

                <Popup><b>{r.name}</b></Popup>

            </Marker>

        ))}



        {/* Müşteri Marker'ları */}

        {customers.map((c: Customer) => (

            <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcons[c.id]}>

                <Popup>

                    <div className="space-y-1">

                        <div className="font-semibold">{c.name}</div>

                        <div className="text-xs text-gray-500">Atanan: <b>{assignments[c.id] ? (reps.find((r: Rep) => r.id === assignments[c.id])?.name || assignments[c.id]) : "—"}</b></div>

                        <div className="flex gap-2 mt-2">

                            <button onClick={() => onToggleSelection(c.id)} className={`w-full px-3 py-1.5 rounded border text-xs transition-colors ${selectedIds.includes(c.id) ? "bg-amber-100 border-amber-300" : "bg-white"}`}>

                                {selectedIds.includes(c.id) ? "Seçimden Kaldır" : "Seçime Ekle"}

                            </button>

                        </div>

                    </div>

                </Popup>

            </Marker>

        ))}



        {/* Rotalar (Polylines) */}

        {Object.entries(displayRoutes).map(([repId, route]: [string, any]) => (

            route.coords.length > 1 && (

                <Polyline key={`route-${repId}`} positions={route.coords as LatLngExpression[]} pathOptions={{ color: colorLookups.colors[repId] || '#ff0000', weight: 5, opacity: 0.8, dashArray: '5, 10' }} />

            )

        ))}

    </>

});





// Manuel Atama Paneli

const ManualAssignmentPanel = React.memo(({ isOpen, onClose, reps, selectedRepId, onRepChange, selectedCustomers, onToggleSelection, onAssign, onClearSelection }: any) => {

    if (!isOpen) return null;



    return (

        <div className="absolute top-0 right-0 bottom-0 z-[1000] transition-transform duration-300 translate-x-0 flex">

            <div className="bg-white/95 backdrop-blur-sm shadow-lg flex flex-col w-[340px] max-w-[90vw]">

                <div className="p-4 border-b">

                    <div className="flex items-center justify-between">

                        <h3 className="font-semibold text-gray-800">Manuel Atama Paneli</h3>

                        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800" title="Paneli Kapat"><XCircle className="w-5 h-5" /></button>

                    </div>

                    <p className="text-xs text-gray-600 mt-1">Haritadan seçim yapıp seçili satış uzmanına atayın.</p>

                </div>



                <div className="p-4 space-y-3">

                    <div className="text-sm">

                        <label className="font-medium text-gray-700">Atanacak Satış Uzmanı:</label>

                        <select value={selectedRepId} onChange={onRepChange} className="w-full mt-1 border rounded-lg px-2 py-1.5">

                            {reps.map((r: Rep) => (<option key={r.id} value={r.id}>{r.name}</option>))}

                        </select>

                    </div>

                    <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md">

                        <div>Seçilen Müşteri: <b>{selectedCustomers.length}</b></div>

                    </div>

                </div>



                <div className="flex-grow overflow-auto p-4 pt-0 space-y-2">

                    {selectedCustomers.length === 0 ? (

                        <div className="text-center text-sm text-gray-500 py-8">Seçim yapmak için haritadan çokgen çizin veya müşterilere tıklayın.</div>

                    ) : (

                        selectedCustomers.map((c: Customer) => (

                            <div key={c.id} className="p-2 rounded border bg-white flex items-center justify-between">

                                <div>

                                    <div className="font-medium text-gray-900 text-sm">{c.name}</div>

                                    <div className="text-xs text-gray-600 max-w-[200px] truncate">{c.address}, {c.district}</div>

                                </div>

                                <button onClick={() => onToggleSelection(c.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Seçimden çıkar"> <XCircle className="w-4 h-4" /> </button>

                            </div>

                        ))

                    )}

                </div>



                {selectedCustomers.length > 0 && (

                    <div className="p-4 border-t bg-white space-y-2">

                        <button onClick={onAssign} className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"> <CheckCircle2 className="w-5 h-5" /> {selectedCustomers.length} Müşteriyi Ata </button>

                        <button onClick={onClearSelection} className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"> <Trash2 className="w-4 h-4" /> Seçimi Temizle </button>

                    </div>

                )}

            </div>

        </div>

    );

});





// Optimizasyon Önizleme Kartı

const OptimizationPreview = React.memo(({ result, onConfirm, onCancel, colorLookups }: { result: OptimizationResult, onConfirm: () => void, onCancel: () => void, colorLookups: any }) => {

    const [isExpanded, setIsExpanded] = useState(true);



    return (

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-down transition-all duration-300">

                <div onClick={() => setIsExpanded(!isExpanded)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">

                    <div className="flex items-center gap-3">

                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full"> <Info className="w-6 h-6" /> </div>

                        <div>

                            <h3 className="font-bold text-gray-800">Optimizasyon Ön İzlemesi</h3>

                            <p className="text-sm text-gray-600">

                                Toplam <b>{result.summary.reduce((acc, item) => acc + item.customerCount, 0)} ziyaret</b>,

                                <b> {result.summary.filter(item => item.customerCount > 0).length} satış uzmanına</b> atandı.

                                Tahmini Rota: <b>{fmtKm(result.summary.reduce((acc, item) => acc + (item.totalKm || 0), 0))}</b>

                            </p>

                        </div>

                    </div>

                    <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />

                </div>

                {isExpanded && (

                    <>

                        <div className="p-4 border-t bg-gray-50/50 max-h-60 overflow-y-auto">

                            <table className="w-full text-left text-sm">

                                <thead><tr className="border-b"><th className="pb-2 font-semibold text-gray-700">Satış Uzmanı</th><th className="pb-2 font-semibold text-gray-700 text-center">Müşteri</th><th className="pb-2 font-semibold text-gray-700 text-right">Rota (km)</th></tr></thead>

                                <tbody>

                                    {result.summary.map(item => (

                                        <tr key={item.repId} className="border-b last:border-none">

                                            <td className="py-2.5 font-medium flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorLookups.colors[item.repId] || '#ccc' }}></span> {item.repName}</td>

                                            <td className="py-2.5 text-center">{item.customerCount}</td>

                                            <td className="py-2.5 text-right font-mono">{item.totalKm === null ? <span className="text-red-500">N/A</span> : fmtKm(item.totalKm)}</td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                        <div className="p-3 bg-gray-100 border-t flex justify-end gap-3">

                            <button onClick={onCancel} className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"> Çık </button>

                            <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2"> <CheckCircle2 className="w-5 h-5" /> Onayla </button>

                        </div>

                    </>

                )}

            </div>

        </div>

    );

});





// =================================================================================

// Ana Bileşen (Main Component)

// =================================================================================

const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {



    // --- State Management ---

    const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "");

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);

    // DEĞİŞİKLİK: Panel varsayılan olarak kapalı.

    const [panelOpen, setPanelOpen] = useState(false); 

    const [toast, setToast] = useState<ToastState | null>(null);



    // Harita verileri state'leri

    const [regions, setRegions] = useState<Record<string, LatLng[]>>({});

    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, { coords: LatLng[], distance: number }>>({});

    const [pendingOptimization, setPendingOptimization] = useState<OptimizationResult | null>(null);





    // --- Memoized Values ---

    const colorLookups = useMemo(() => {

        const colorMap: Record<string, string> = {};

        const fillMap: Record<string, string> = {};

        reps.forEach(rep => {

            colorMap[rep.id] = rep.color;

            fillMap[rep.id] = rep.fillColor;

        });

        colorMap['_default'] = '#9ca3af';

        fillMap['_default'] = 'rgba(156,163,175,.18)';

        return { colors: colorMap, fills: fillMap };

    }, [reps]);



    const repIcons = useMemo(() => Object.fromEntries(

        reps.map(rep => [rep.id, createRepIcon(rep)])

    ), [reps]);

    

    const customerIcons = useMemo(() => {

        const assignSource = pendingOptimization ? pendingOptimization.assignments : assignments;

        return Object.fromEntries(

            customers.map(c => {

                const repId = assignSource[c.id] || '_default';

                const color = colorLookups.colors[repId] || colorLookups.colors['_default'];

                const isSelected = selectedIds.includes(c.id);

                return [c.id, createCustomerIcon(color, isSelected)];

            })

        );

    }, [customers, assignments, pendingOptimization, selectedIds, colorLookups]);



    const selectedCustomers = useMemo(() => customers.filter((c) => selectedIds.includes(c.id)), [customers, selectedIds]);

    const displayRegions = pendingOptimization?.regions ?? regions;

    const displayRoutes = pendingOptimization?.routes ?? optimizedRoutes;





    // --- Callbacks & Handlers ---

    const showToast = useCallback((message: string, type: ToastState['type'] = 'info', duration = 3000) => {

        setToast({ message, type });

        setTimeout(() => setToast(null), duration);

    }, []);



    const handleClearSelection = useCallback(() => setSelectedIds([]), []);



    const handlePolygonCreated = useCallback((layer: L.Polygon) => {

        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(p => [p.lat, p.lng]) as LatLng[];

        const insideIds = customers.filter(c => pointInPolygon([c.lat, c.lng], latlngs)).map(c => c.id);

        setSelectedIds(insideIds);

    }, [customers]);



    const handleToggleSelection = useCallback((customerId: string) => {

        setSelectedIds(prev => prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]);

    }, []);



    const handleAssignSelected = useCallback(() => {

        if (selectedIds.length === 0) {

            showToast("Atama yapmak için önce müşteri seçin.", 'info');

            return;

        }

        setAssignments(prev => {

            const next = { ...prev };

            selectedIds.forEach(id => { next[id] = selectedRepId; });

            return next;

        });

        showToast(`${selectedIds.length} müşteri ${reps.find(r => r.id === selectedRepId)?.name}'a atandı.`, 'success');

        handleClearSelection();

    }, [selectedIds, selectedRepId, reps, setAssignments, showToast, handleClearSelection]);



    const handleOptimize = useCallback(async () => {

        setLoading(true);

        setRegions({});

        setOptimizedRoutes({});

        

        try {

            const K = reps.length;

            const pts: LatLng[] = customers.map(c => [c.lat, c.lng]);

            if (customers.length === 0 || K === 0) return;



            // Kapasite dengeli K-Means benzeri kümeleme algoritması

            const targetCapacity = Math.ceil(customers.length / K);

            let centroids: LatLng[] = reps.map(r => [r.lat, r.lng]);

            let assignments: number[] = new Array(customers.length).fill(-1);



            for (let i = 0; i < OPTIMIZATION_ITERATIONS; i++) {

                const buckets: number[][] = Array.from({ length: K }, () => []);

                const customerOrder = [...customers.keys()].sort(() => Math.random() - 0.5);



                customerOrder.forEach(custIdx => {

                    const point = pts[custIdx];

                    const costs = centroids

                        .map((centroid, repIdx) => ({ repIdx, cost: haversineKm(point, centroid) }))

                        .sort((a, b) => a.cost - b.cost);

                    

                    let chosenRep = costs[0].repIdx;

                    for (const { repIdx } of costs) {

                        if (buckets[repIdx].length < targetCapacity) {

                            chosenRep = repIdx;

                            break;

                        }

                    }

                    buckets[chosenRep].push(custIdx);

                    assignments[custIdx] = chosenRep;

                });

                

                centroids = buckets.map((bucket, k) => {

                    if (bucket.length === 0) return reps[k] ? [reps[k].lat, reps[k].lng] : centroids[k];

                    const sum = bucket.reduce((acc, ptIdx) => [acc[0] + pts[ptIdx][0], acc[1] + pts[ptIdx][1]], [0, 0] as LatLng);

                    return [sum[0] / bucket.length, sum[1] / bucket.length];

                });

            }



            const nextAssignments: Record<string, string> = {};

            const customersPerRep: Record<string, Customer[]> = Object.fromEntries(reps.map(r => [r.id, []]));

            customers.forEach((c, i) => { const repId = reps[assignments[i]]?.id || reps[0].id; nextAssignments[c.id] = repId; if (customersPerRep[repId]) customersPerRep[repId].push(c); });



            // Rota hesaplamaları için OSRM'e paralel istekler

            const routePromises = reps.map(async (rep) => {

                const repCustomers = customersPerRep[rep.id];

                if (repCustomers.length === 0) return { repId: rep.id, repName: rep.name, customerCount: 0, totalKm: null, coords: [] };

                try {

                    const coords = [[rep.lat, rep.lng], ...repCustomers.map(c => [c.lat, c.lng] as LatLng)].map(p => `${p[1]},${p[0]}`).join(';');

                    const tripData = await osrmTrip(coords);

                    return { repId: rep.id, repName: rep.name, customerCount: repCustomers.length, totalKm: tripData.trips[0].distance / 1000, coords: tripData.trips[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as LatLng) };

                } catch (error) { return { repId: rep.id, repName: rep.name, customerCount: repCustomers.length, totalKm: null, coords: [] }; }

            });



            const results = await Promise.all(routePromises);

            const newOptimizedRoutes: Record<string, { coords: LatLng[], distance: number }> = {};

            results.forEach(res => { if (res.coords.length > 0) newOptimizedRoutes[res.repId] = { coords: res.coords, distance: res.totalKm ?? 0 }; });



            const hulls: Record<string, LatLng[]> = {};

            reps.forEach(r => { hulls[r.id] = customersPerRep[r.id].length ? convexHull(customersPerRep[r.id].map(c => [c.lat, c.lng])) : []; });

            

            setPendingOptimization({ assignments: nextAssignments, regions: hulls, routes: newOptimizedRoutes, summary: results });

        } catch (error) {

            console.error("Optimizasyon sırasında hata:", error);

            showToast("Optimizasyon başarısız oldu.", 'error');

        } finally {

            setLoading(false);

        }

    }, [customers, reps, showToast]);



    const handleConfirmOptimization = useCallback(() => {

        if (!pendingOptimization) return;

        setAssignments(pendingOptimization.assignments);

        setRegions(pendingOptimization.regions);

        setOptimizedRoutes(pendingOptimization.routes);

        setPendingOptimization(null);

        showToast("Atamalar onaylandı ve uygulandı.", 'success');

    }, [pendingOptimization, setAssignments, showToast]);



    const handleCancelOptimization = useCallback(() => setPendingOptimization(null), []);

    



    // --- Render ---

    return (

        <div className="p-4">

            <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2 text-gray-900 font-semibold">

                    <button onClick={onBack} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">

                        <ArrowLeft className="w-4 h-4" /> Geri

                    </button>

                    <div className="flex items-center gap-2 ml-2">

                        <RouteIcon className="w-5 h-5 text-[#0099CB]" /> Haritadan Görev Atama

                    </div>

                </div>

                <button onClick={handleOptimize} disabled={loading} className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90 disabled:bg-gray-400">

                    {loading ? "Hesaplanıyor..." : "Optimize Et"}

                </button>

            </div>



            <div className="mb-3 text-xs text-gray-600">

                <b>İpucu:</b> Manuel atama için sağdaki paneli kullanın. Tüm müşterileri otomatik dağıtmak için <b>Optimize Et</b> butonuna basın.

            </div>

            

            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">

                <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: "100%", width: "100%" }} className="z-0">

                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

                    <DrawControl onPolygonCreated={handlePolygonCreated} onDeleted={handleClearSelection} />

                    <MapLayers

                        customers={customers}

                        reps={reps}

                        assignments={assignments}

                        pendingOptimization={pendingOptimization}

                        selectedIds={selectedIds}

                        onToggleSelection={handleToggleSelection}

                        colorLookups={colorLookups}

                        displayRegions={displayRegions}

                        displayRoutes={displayRoutes}

                        repIcons={repIcons}

                        customerIcons={customerIcons}

                    />

                </MapContainer>



                {pendingOptimization && (

                    <OptimizationPreview result={pendingOptimization} onConfirm={handleConfirmOptimization} onCancel={handleCancelOptimization} colorLookups={colorLookups} />

                )}



                <ManualAssignmentPanel

                    isOpen={panelOpen}

                    onClose={() => setPanelOpen(false)}

                    reps={reps}

                    selectedRepId={selectedRepId}

                    onRepChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRepId(e.target.value)}

                    selectedCustomers={selectedCustomers}

                    onToggleSelection={handleToggleSelection}

                    onAssign={handleAssignSelected}

                    onClearSelection={handleClearSelection}

                />

                

                {!panelOpen && (

                    <button onClick={() => setPanelOpen(true)} className="absolute top-4 right-4 z-[1000] bg-white shadow-lg p-3 rounded-full hover:bg-gray-100" title="Paneli Aç">

                        <Users className="w-5 h-5 text-gray-700" />

                    </button>

                )}

                

                {loading && (

                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]">

                        <div className="rounded-lg bg-white shadow-lg px-6 py-4 text-base font-semibold text-gray-700">

                            Optimizasyon ve Rota Hesaplamaları Yapılıyor...

                        </div>

                    </div>

                )}

                

                {toast && (

                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in-down">

                        <div className={`flex items-center gap-3 rounded-xl shadow-2xl px-4 py-3 ${

                            toast.type === 'success' ? 'bg-green-600 text-white' :

                            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-white text-gray-800'

                        }`}>

                            {toast.type === 'success' && <CheckCircle2 />}

                            {toast.type === 'error' && <AlertTriangle />}

                            {toast.type === 'info' && <Info className="text-blue-500"/>}

                            <span className="font-semibold text-sm">{toast.message}</span>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

};



export default AssignmentMapScreen;