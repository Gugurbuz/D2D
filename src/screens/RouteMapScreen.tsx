// src/screens/RouteMapScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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
  status: "Bekliyor" | "Yolda" | "Tamamlandı";
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
const demoCustomers: Customer[] = [
  { id: "1", name: "Buse Aksoy", address: "Bağdat Cd. No:120", district: "Maltepe", plannedTime: "09:00", priority: "Düşük", tariff: "Mesken", status: "Bekliyor", lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01" },
  { id: "2", name: "Kaan Er", address: "Alemdağ Cd. No:22", district: "Ümraniye", plannedTime: "09:20", priority: "Orta", tariff: "Mesken", status: "Bekliyor", lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02" },
];

/* ==== İkonlar ==== */
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});
function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) {
  const bg = opts?.starred ? "#F5B301" : opts?.highlight ? "#FF6B00" : "#0099CB";
  return L.divIcon({
    className: "number-marker",
    html: `<div style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

/* ==== OSRM Helpers ==== */
async function osrmTrip(coords: string) {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.code !== "Ok") throw new Error("OSRM hata");
  return data;
}
const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/* ==== Component ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers?.length ? customers : demoCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);
  const touchStartX = useRef<number | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  /* === Rota oluştur === */
  async function handleOptimize() {
    try {
      setLoading(true);
      const coords = [[rep.lng, rep.lat], ...baseCustomers.map((c) => [c.lng, c.lat])].join(";");
      const data = await osrmTrip(coords);
      const trip = data.trips[0];

      const sorted = data.waypoints
        .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
        .slice(1) // rep'i çıkar
        .map((wp: any) => baseCustomers[wp.waypoint_index - 1]);

      setOrderedCustomers(sorted);
      setRouteCoords(trip.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));
      setRouteKm(trip.distance / 1000);

      if (mapRef.current) {
        const bounds = L.latLngBounds([[rep.lat, rep.lng], ...baseCustomers.map((c) => [c.lat, c.lng])]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (e) {
      console.error("OSRM rota hatası:", e);
    } finally {
      setLoading(false);
    }
  }

  /* === Panel swipe === */
  const onTouchStart = (e: React.TouchEvent) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
    if (mapRef.current) {
      const bounds = L.latLngBounds([[rep.lat, rep.lng], ...baseCustomers.map((c) => [c.lat, c.lng])]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [baseCustomers]);

  return (
    <div className="relative w-full">
      {/* Sticky üst bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur px-3 py-2 
                      flex items-center justify-end gap-3 
                      shadow-sm border-b rounded-bl-xl w-full md:w-1/3 ml-auto">
        <div className="text-xs text-gray-700">Toplam: <b>{fmtKm(routeKm)}</b></div>
        <button
          onClick={handleOptimize}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-lg font-semibold ${
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

          {/* Rep */}
          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {/* Müşteriler */}
          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })}
              ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
              eventHandlers={{ click: () => setSelectedId(c.id) }}
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
                  <div>Tel: <a href={toTelHref(c.phone)} className="text-[#0099CB] underline">{c.phone}</a></div>
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
          className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 
                     ${panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"} flex`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] text-white flex flex-col items-center justify-center"
          >
            {panelOpen ? <Minimize2 className="w-4 h-4 -rotate-90" /> : <RouteIcon className="w-4 h-4 rotate-90" />}
          </button>

          <div className="bg-white/90 rounded-l-xl shadow-md px-4 py-3 flex flex-col gap-2 min-w-[260px] h-full overflow-auto">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700">Ziyaret Sırası</span>
            </div>
            {orderedCustomers.map((c, i) => (
              <div key={c.id} className={`p-2 rounded cursor-pointer ${selectedId === c.id ? "bg-[#0099CB]/10" : "hover:bg-gray-50"}`}
                onClick={() => {
                  setSelectedId(c.id);
                  if (mapRef.current) mapRef.current.setView([c.lat, c.lng], 15, { animate: true });
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold text-white rounded-full ${starredId === c.id ? "bg-[#F5B301]" : "bg-[#0099CB]"}`}>
                    {i + 1}
                  </span>
                  <div className="ml-2 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 truncate">{c.address}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setStarredId(prev => prev === c.id ? null : c.id); }}
                  >
                    {starredId === c.id
                      ? <Star className="w-4 h-4 text-[#F5B301] fill-[#F5B301]" />
                      : <StarOff className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-20">
            <div className="bg-white px-4 py-2 rounded shadow font-medium text-sm">Rota Hesaplanıyor…</div>
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
      {isFs ? <><Minimize2 className="w-3 h-3" /> Kapat</> : <><Maximize2 className="w-3 h-3" /> Tam Ekran</>}
    </button>
  );
};

export default RouteMap;
