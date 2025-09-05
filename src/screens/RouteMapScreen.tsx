// src/screens/RouteMapScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import {
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  Star,
  StarOff,
  Navigation,
} from "lucide-react";

/* =======================
   Tipler
   ======================= */
export type Customer = {
  id: string;
  assignedRepId?: string;
  name: string;
  address: string;
  district: string;
  plannedTime: string;
  priority: "Yüksek" | "Orta" | "Düşük";
  tariff: string;
  meterNumber: string;
  consumption: string;
  offerHistory: string[];
  status: "Bekliyor" | "Yolda" | "Tamamlandı";
  estimatedDuration: string;
  distance: string;
  lat: number;
  lng: number;
  phone: string;
};

export type SalesRep = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* =======================
   Demo veri
   ======================= */
const defaultSalesRep: SalesRep = { id: "rep-1", name: "Mehmet Yılmaz", lat: 40.9839, lng: 29.0285 };
const anadoluCustomers: Customer[] = [
  { id: "1", assignedRepId: "rep-1", name: "Buse Aksoy", address: "Bağdat Cd. No:120", district: "Maltepe", plannedTime: "09:00", priority: "Düşük", tariff: "Mesken", meterNumber: "210000001", consumption: "270 kWh/ay", offerHistory: ["2025-03: Dijital sözleşme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km",  lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01" },
  { id: "2", assignedRepId: "rep-2", name: "Kaan Er",    address: "Alemdağ Cd. No:22", district: "Ümraniye", plannedTime: "09:20", priority: "Orta",   tariff: "Mesken", meterNumber: "210000002", consumption: "300 kWh/ay", offerHistory: ["2024-08: %10 indirim"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km",  lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02" },
  { id: "3", assignedRepId: "rep-3", name: "Canan Sezer",address: "Finans Mrk. A1",    district: "Ataşehir", plannedTime: "09:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000003", consumption: "1400 kWh/ay", offerHistory: ["2024-09: Kurumsal teklif"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "6.2 km",  lat: 40.9923, lng: 29.1274, phone: "0555 111 22 03" },
  { id: "4", assignedRepId: "rep-1", name: "Kübra Oral", address: "İnönü Mh. No:18",   district: "Kadıköy",  plannedTime: "10:00", priority: "Orta",   tariff: "Mesken", meterNumber: "210000004", consumption: "310 kWh/ay",  offerHistory: ["2024-11: Sadakat indirimi"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.1 km",  lat: 40.9857, lng: 29.0496, phone: "0555 111 22 04" },
  { id: "5", assignedRepId: "rep-1", name: "Ayça Erden", address: "Koşuyolu Cd. 7",    district: "Kadıköy",  plannedTime: "10:20", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000005", consumption: "980 kWh/ay",  offerHistory: ["2024-10: %10 indirim"],      status: "Bekliyor", estimatedDuration: "35 dk", distance: "8.3 km",  lat: 41.0004, lng: 29.0498, phone: "0555 111 22 05" },
  { id: "6", assignedRepId: "rep-2", name: "Meral Kılıç",address: "Çengelköy Sahil",   district: "Üsküdar",  plannedTime: "10:40", priority: "Düşük",  tariff: "Mesken", meterNumber: "210000006", consumption: "260 kWh/ay",  offerHistory: ["2024-03: Hoş geldin"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "12.1 km", lat: 41.0573, lng: 29.0557, phone: "0555 111 22 06" },
];

/* =======================
   Yardımcılar
   ======================= */
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});
function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) {
  const highlight = !!opts?.highlight;
  const starred = !!opts?.starred;
  const bg = starred ? "#F5B301" : highlight ? "#FF6B00" : "#0099CB";
  const pulse = highlight ? "box-shadow:0 0 0 6px rgba(255,107,0,.15);" : "";
  return L.divIcon({
    className: "number-marker",
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;line-height:1;background:${bg};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${pulse}transform:${highlight ? "scale(1.14)" : "scale(1)"};">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

const toCoordStr = (lat: number, lng: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
const makeRadiusesParam = (n: number, r = 1000) => new Array(n).fill(String(r)).join(";");

async function osrmTripSafe(points: { lat: number; lng: number }[]) {
  try {
    const coords = points.map((p) => toCoordStr(p.lat, p.lng)).join(";");
    const radiuses = makeRadiusesParam(points.length, 1000);
    const url = encodeURI(
      `https://router.project-osrm.org/trip/v1/driving/${coords}` +
        `?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&radiuses=${radiuses}`
    );
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) return null;
    const data = JSON.parse(text);
    if (data.code !== "Ok" || !data.trips?.[0]) return null;
    return data;
  } catch {
    return null;
  }
}
async function osrmRouteSafe(from: LatLng, to: LatLng) {
  try {
    const coords = `${toCoordStr(from[0], from[1])};${toCoordStr(to[0], to[1])}`;
    const url = encodeURI(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&annotations=false&steps=false`
    );
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) return null;
    const data = JSON.parse(text);
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    return data.routes[0] as { distance: number; geometry: { coordinates: [number, number][] } };
  } catch {
    return null;
  }
}
function greedyOrder(points: LatLng[], startIndex = 0): number[] {
  const n = points.length;
  const used = new Array(n).fill(false);
  const order = [startIndex];
  used[startIndex] = true;
  for (let k = 1; k < n; k++) {
    const last = points[order[order.length - 1]];
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      const d = haversineKm(last, points[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    used[best] = true;
    order.push(best);
  }
  return order;
}
async function buildGeometryFromOrder(orderedLatLngs: LatLng[]) {
  const coords: LatLng[] = [];
  let totalKm = 0;
  if (orderedLatLngs.length === 0) return { coords, km: 0 };
  coords.push(orderedLatLngs[0]);
  for (let i = 1; i < orderedLatLngs.length; i++) {
    const a = orderedLatLngs[i - 1];
    const b = orderedLatLngs[i];
    const route = await osrmRouteSafe(a, b);
    if (route) {
      const seg = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
      coords.push(...seg.slice(1));
      totalKm += route.distance / 1000;
    } else {
      coords.push(b);
      totalKm += haversineKm(a, b);
    }
  }
  return { coords, km: totalKm };
}

/* =======================
   Bileşen
   ======================= */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const allCustomers = customers && customers.length > 0 ? customers : anadoluCustomers;
  const customersForRep = allCustomers.filter((c) => c.assignedRepId === rep.id);

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(customersForRep);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // IMPORTANT: Leaflet marker instance’larını burada tutuyoruz
  const markerRefs = useRef<Record<string, L.Marker | undefined>>({});
  const mapRef = useRef<L.Map | null>(null);
  const prevSelectedIdRef = useRef<string | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  // swipe panel
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };

  /* ---- Tek seçim akışı ---- */
  const selectCustomer = (id: string, pan = true) => {
    const c = customersForRep.find((x) => x.id === id);
    if (!c || !mapRef.current) return;

    // 1) önce tüm popup’ları kapat
    mapRef.current.closePopup();
    if (prevSelectedIdRef.current && markerRefs.current[prevSelectedIdRef.current]) {
      markerRefs.current[prevSelectedIdRef.current]?.closePopup();
    }

    // 2) state’i güncelle
    setSelectedId(id);
    prevSelectedIdRef.current = id;

    // 3) haritayı kaydır/zoomla
    const targetZoom = Math.max(mapRef.current.getZoom(), 15);
    mapRef.current.flyTo([c.lat, c.lng], targetZoom, { animate: true, duration: 0.6 });

    // 4) animasyon bitince popup aç (garantili)
    const m = markerRefs.current[id];
    if (m) {
      mapRef.current.once("moveend", () => {
        // moveend sırasında popup hâlâ kapalı ise aç
        if (prevSelectedIdRef.current === id) {
          m.openPopup();
        }
      });
    } else {
      // marker henüz mount olmamış olabilir; bir tik sonra dene
      setTimeout(() => markerRefs.current[id]?.openPopup(), 0);
    }

    // 5) sağ paneli ilgili satıra kaydır
    const row = document.getElementById(`cust-row-${id}`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // veri filtresi değişince seçimi sıfırla (stale id kapanır)
  useEffect(() => {
    if (selectedId && !customersForRep.some((c) => c.id === selectedId)) {
      setSelectedId(null);
      prevSelectedIdRef.current = null;
      mapRef.current?.closePopup();
    }
  }, [customersForRep, selectedId]);

  /* ---- Polyline fit ---- */
  const fitPolylineBounds = (poly: LatLng[]) => {
    if (!mapRef.current || poly.length < 2) return;
    const bounds = L.latLngBounds(poly.map(([la, ln]) => L.latLng(la, ln)));
    mapRef.current.fitBounds(bounds, { padding: [24, 24] });
  };

  /* ---- Optimizasyon ---- */
  const handleOptimize = async () => {
    setLoading(true);
    try {
      const start = { lat: rep.lat, lng: rep.lng };

      if (!starredId) {
        const points = [start, ...customersForRep.map((c) => ({ lat: c.lat, lng: c.lng, ref: c }))];
        const tripData = await osrmTripSafe(points);
        if (tripData) {
          const ordered = tripData.waypoints
            .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
            .sort((a: any, b: any) => a.order - b.order)
            .map((x: any) => points[x.inputIdx]);
          const sortedCustomers = ordered.slice(1).map((p: any) => p.ref as Customer);
          setOrderedCustomers(sortedCustomers);

          const latlngs: LatLng[] = tripData.trips[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setRouteCoords(latlngs);
          setRouteKm((tripData.trips[0].distance as number) / 1000);

          if (sortedCustomers[0]) selectCustomer(sortedCustomers[0].id, true);
          fitPolylineBounds(latlngs);
          return;
        }

        // fallback
        const greedyPoints: LatLng[] = [[rep.lat, rep.lng], ...customersForRep.map((c) => [c.lat, c.lng])];
        const orderIdx = greedyOrder(greedyPoints, 0);
        const orderedLatLngs = orderIdx.map((i) => greedyPoints[i]);
        const orderedCusts = orderIdx.slice(1).map((i) => customersForRep[i - 1]);
        setOrderedCustomers(orderedCusts);

        const geom = await buildGeometryFromOrder(orderedLatLngs);
        setRouteCoords(geom.coords);
        setRouteKm(geom.km);

        if (orderedCusts[0]) selectCustomer(orderedCusts[0].id, true);
        fitPolylineBounds(geom.coords);
      } else {
        // yıldızlı ilk
        const star = customersForRep.find((c) => c.id === starredId)!;
        const others = customersForRep.filter((c) => c.id !== starredId);

        const firstLeg = await osrmRouteSafe([rep.lat, rep.lng], [star.lat, star.lng]);
        const firstLegCoords: LatLng[] = firstLeg
          ? firstLeg.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng)
          : ([[rep.lat, rep.lng], [star.lat, star.lng]] as LatLng[]);
        const firstLegKm = firstLeg ? firstLeg.distance / 1000 : haversineKm([rep.lat, rep.lng], [star.lat, star.lng]);

        const points2 = [{ lat: star.lat, lng: star.lng }, ...others.map((c) => ({ lat: c.lat, lng: c.lng, ref: c }))];
        const trip2 = await osrmTripSafe(points2);

        if (trip2) {
          const ordered2 = trip2.waypoints
            .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
            .sort((a: any, b: any) => a.order - b.order)
            .map((x: any) => points2[x.inputIdx]);
          const sortedCustomers = ordered2.map((p: any, idx: number) => (idx === 0 ? star : (p.ref as Customer)));
          setOrderedCustomers(sortedCustomers);

          const restCoords: LatLng[] = trip2.trips[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          const merged = firstLegCoords.concat(restCoords.slice(1));
          setRouteCoords(merged);
          setRouteKm(firstLegKm + (trip2.trips[0].distance as number) / 1000);

          selectCustomer(star.id, true);
          fitPolylineBounds(merged);
          return;
        }

        // fallback
        const greedyPoints2: LatLng[] = [[rep.lat, rep.lng], [star.lat, star.lng], ...others.map((c) => [c.lat, c.lng] as LatLng)];
        const orderIdx2 = [0, 1].concat(greedyOrder(greedyPoints2.slice(1), 0).slice(1).map((i) => i + 1));
        const orderedLatLngs2 = orderIdx2.map((i) => greedyPoints2[i]);
        const orderedCusts2 = [star, ...orderIdx2.slice(2).map((i) => others[i - 2])];
        setOrderedCustomers(orderedCusts2);

        const geom2 = await buildGeometryFromOrder(orderedLatLngs2);
        setRouteCoords(geom2.coords);
        setRouteKm(geom2.km);

        selectCustomer(star.id, true);
        fitPolylineBounds(geom2.coords);
      }
    } finally {
      setLoading(false);
    }
  };

  // yıldız değişince otomatik optimize
  useEffect(() => {
    if (starredId !== null) handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId]);

  // rep filtresi değişince listeyi güncelle
  useEffect(() => {
    setOrderedCustomers(customersForRep);
  }, [customersForRep]);

  const center: LatLng = [rep.lat, rep.lng];

  return (
    <div className="relative w-full">
      {/* Üst bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          Rota Haritası
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
          </div>
          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-semibold ${loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"}`}
          >
            {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn />
        </div>
      </div>

      {/* Harita */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })}
              zIndexOffset={selectedId === c.id ? 2000 : 1000 - i}
              // REF’i event ile garanti şekilde Leaflet instance olarak yakala
              eventHandlers={{
                add: (e) => { markerRefs.current[c.id] = e.target as L.Marker; },
                remove: () => { delete markerRefs.current[c.id]; },
                click: () => selectCustomer(c.id, true),
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <b>{i + 1}. {c.name}</b>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStarredId((prev) => (prev === c.id ? null : c.id));
                      }}
                      aria-label={starredId === c.id ? "Yıldızı kaldır" : "İlk durak yap"}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Star className={`w-4 h-4 ${starredId === c.id ? "text-[#F5B301] fill-[#F5B301]" : "text-gray-400"}`} />
                    </button>
                  </div>

                  <div>{c.address}, {c.district}</div>
                  <div>Saat: {c.plannedTime}</div>
                  <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>{c.phone}</a></div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full text-center px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigasyonu Başlat</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>

        {/* Sağ panel */}
        <SidePanel
          panelOpen={panelOpen}
          setPanelOpen={setPanelOpen}
          customers={orderedCustomers}
          selectedId={selectedId}
          starredId={starredId}
          onSelect={(id) => selectCustomer(id, true)}
          onToggleStar={(id) => setStarredId((prev) => (prev === id ? null : id))}
        />

        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =======================
   Sağ Panel (ayırdım: daha okunaklı)
   ======================= */
const SidePanel: React.FC<{
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  customers: Customer[];
  selectedId: string | null;
  starredId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
}> = ({ panelOpen, setPanelOpen, customers, selectedId, starredId, onSelect, onToggleStar }) => {
  // swipe handler’ları üstte zaten var ama burada da kullanılabilir.
  return (
    <div
      className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${
        panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
      } flex`}
    >
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white"
        title={panelOpen ? "Paneli kapat" : "Paneli aç"}
      >
        {panelOpen ? (
          <Minimize2 className="w-4 h-4 -rotate-90" />
        ) : (
          <div className="flex flex-col items-center">
            <span className="rotate-90 text-[10px] font-bold tracking-wider">ZİYARET</span>
            <Minimize2 className="w-4 h-4 rotate-90" />
          </div>
        )}
      </button>

      <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[270px] max-w-[21.6rem] h-full">
        <div className="flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          <span className="font-semibold text-gray-700 text-base select-none">Ziyaret Sırası</span>
        </div>
        <div className="text-[11px] text-gray-600">
          ⭐ Bir müşteriyi yıldızlarsan rota önce o müşteriye gider; kalan duraklar en kısa şekilde planlanır. Yıldızı değiştirince rota otomatik güncellenir.
        </div>

        <SimpleBar style={{ maxHeight: "100%" }}>
          {customers.map((c, i) => {
            const selected = selectedId === c.id;
            const starred = starredId === c.id;
            return (
              <div
                key={c.id}
                id={`cust-row-${c.id}`}
                className={`flex items-center gap-2 p-2 rounded transition cursor-pointer ${
                  selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"
                }`}
                onClick={() => onSelect(c.id)}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white ${
                    starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"
                  }`}
                  title={`${i + 1}. müşteri`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {c.address}, {c.district}
                  </div>
                  <a
                    className="text-xs text-[#0099CB] underline"
                    href={`tel:${c.phone.replace(/(?!^\+)[^\d]/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.phone}
                  </a>
                </div>
                <button
                  className="ml-auto p-1.5 rounded-lg hover:bg-gray-100"
                  title={starred ? "İlk duraktan kaldır" : "İlk durak yap"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(c.id);
                  }}
                >
                  {starred ? (
                    <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" />
                  ) : (
                    <StarOff className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <span className="text-xs text-gray-700 font-semibold">{c.plannedTime}</span>
              </div>
            );
          })}
        </SimpleBar>
      </div>
    </div>
  );
};

/* =======================
   Tam ekran butonu
   ======================= */
const FullscreenBtn: React.FC = () => {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  return (
    <button
      onClick={async () => {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      }}
      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
    >
      {isFs ? (
        <>
          <Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat
        </>
      ) : (
        <>
          <Maximize2 className="w-4 h-4" /> Tam Ekran
        </>
      )}
    </button>
  );
};

export default RouteMap;
