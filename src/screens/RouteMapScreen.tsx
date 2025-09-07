// src/screens/RouteMapScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  Star,
  StarOff,
  Navigation,
} from "lucide-react";

/* ==== Tipler ==== */
export type Customer = {
  id: string;
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
  name: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* ==== Varsayılanlar ==== */
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };
const anadoluCustomers: Customer[] = [
  { id: "1", name: "Buse Aksoy", address: "Bağdat Cd. No:120", district: "Maltepe", plannedTime: "09:00", priority: "Düşük", tariff: "Mesken", meterNumber: "210000001", consumption: "270 kWh/ay", offerHistory: [], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km", lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01" },
  { id: "2", name: "Kaan Er", address: "Alemdağ Cd. No:22", district: "Ümraniye", plannedTime: "09:20", priority: "Orta", tariff: "Mesken", meterNumber: "210000002", consumption: "300 kWh/ay", offerHistory: [], status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km", lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02" },
  // ... diğerleri sende mevcut ...
];

/* ==== İkonlar ==== */
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
  return L.divIcon({
    className: "number-marker",
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

/* ==== Yardımcılar ==== */
async function osrmTrip(coords: string) {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");
  return data;
}
async function osrmRoute(from: LatLng, to: LatLng) {
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM route error: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("Route not found");
  return data;
}

/* ==== FitBounds Bileşeni ==== */
const FitBounds: React.FC<{ rep: SalesRep; customers: Customer[] }> = ({ rep, customers }) => {
  const map = useMap();
  useEffect(() => {
    const points: LatLng[] = [[rep.lat, rep.lng], ...customers.map(c => [c.lat, c.lng])];
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [rep, customers, map]);
  return null;
};

/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const highlightCustomer = (c: Customer) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (m) m.openPopup();
    if (mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], 14, { animate: true });
    }
  };

  async function handleOptimize() {
    try {
      setLoading(true);

      if (!starredId) {
        // normal OSRM trip
        const coords = [[rep.lng, rep.lat], ...baseCustomers.map(c => [c.lng, c.lat])]
          .map(([lng, lat]) => `${lng},${lat}`).join(";");
        const data = await osrmTrip(coords);
        const sortedCustomers = data.waypoints
          .map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index }))
          .sort((a, b) => a.order - b.order)
          .slice(1) // rep'i çıkar
          .map((x: any) => baseCustomers[x.idx - 1]);

        setOrderedCustomers(sortedCustomers);
        setRouteCoords(data.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));
        setRouteKm(data.trips[0].distance / 1000);
      } else {
        // yıldızlı müşteri ilk durak
        const star = baseCustomers.find(c => c.id === starredId)!;
        const others = baseCustomers.filter(c => c.id !== starredId);

        // rep -> star
        const dataRoute = await osrmRoute([rep.lat, rep.lng], [star.lat, star.lng]);
        const route1Coords = dataRoute.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
        const route1Km = dataRoute.routes[0].distance / 1000;

        // star -> diğerleri
        const coords2 = [[star.lng, star.lat], ...others.map(c => [c.lng, c.lat])]
          .map(([lng, lat]) => `${lng},${lat}`).join(";");
        const dataTrip2 = await osrmTrip(coords2);
        const ordered2 = dataTrip2.waypoints
          .map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index }))
          .sort((a, b) => a.order - b.order)
          .slice(1)
          .map((x: any) => others[x.idx - 1]);

        setOrderedCustomers([star, ...ordered2]);
        const restCoords = dataTrip2.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
        setRouteCoords([...route1Coords, ...restCoords]);
        setRouteKm(route1Km + dataTrip2.trips[0].distance / 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId]);

  return (
    <div className="relative w-full h-full">
      {/* Sticky üst bar */}
      <div className="absolute top-2 right-2 z-[1000] bg-white/80 py-1 px-2 rounded shadow flex items-center gap-2">
        <div className="text-xs text-gray-700">Toplam: {routeKm ? routeKm.toFixed(1) + " km" : "—"}</div>
        <button
          onClick={handleOptimize}
          disabled={loading}
          className={`px-2 py-1 text-xs rounded-lg font-semibold ${
            loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"
          }`}
        >
          {loading ? "..." : "Rota Oluştur"}
        </button>
        <FullscreenBtn />
      </div>

      {/* Harita */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          center={[rep.lat, rep.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds rep={rep} customers={orderedCustomers} />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })}
              ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
              eventHandlers={{ click: () => highlightCustomer(c) }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <b>{i + 1}. {c.name}</b>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStarredId(prev => prev === c.id ? null : c.id);
                      }}
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
                    className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
                  >
                    <Navigation className="w-4 h-4" /> Navigasyonu Başlat
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 6 }} />
          )}
        </MapContainer>

        {/* Sağ panel */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-[999] transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
          } flex`}
        >
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] text-white flex flex-col items-center justify-center"
          >
            {panelOpen ? <Minimize2 className="w-4 h-4 -rotate-90" /> : <span className="rotate-90 text-[10px]">ZİYARET</span>}
          </button>
          <div className="bg-white/95 rounded-l-xl shadow px-4 py-3 flex flex-col gap-3 min-w-[260px] h-full">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700">Ziyaret Sırası</span>
            </div>
            <div className="text-xs text-gray-600">⭐ Yıldızlı müşteri ilk durak olur.</div>
            <div className="overflow-auto pr-1">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded ${selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"}`}
                    onClick={() => highlightCustomer(c)}
                  >
                    <span className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white ${
                      starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.address}</div>
                      <a className="text-xs text-[#0099CB]" href={toTelHref(c.phone)} onClick={e => e.stopPropagation()}>{c.phone}</a>
                    </div>
                    <button
                      className="ml-auto p-1.5 rounded-lg hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStarredId(prev => prev === c.id ? null : c.id);
                      }}
                    >
                      {starred ? <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" /> : <StarOff className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-[2000]">
            <div className="rounded bg-white shadow px-4 py-2 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==== Fullscreen butonu ==== */
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
        const el = document.querySelector(".leaflet-container") as HTMLElement;
        if (!document.fullscreenElement && el) await el.requestFullscreen();
        else await document.exitFullscreen();
      }}
      className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-1"
    >
      {isFs ? (
        <>
          <Minimize2 className="w-3 h-3" /> Kapat
        </>
      ) : (
        <>
          <Maximize2 className="w-3 h-3" /> Tam Ekran
        </>
      )}
    </button>
  );
};

export default RouteMap;
