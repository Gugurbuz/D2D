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
  // ... mevcut müşteri listesi (kısaltıldı) ...
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
const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(km) + " km";

/* ==== Fit bounds helper ==== */
const FitBounds: React.FC<{ coords: LatLng[] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
};

/* ==== RouteMap ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);
  const touchStartX = useRef<number | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  /* Swipe panel */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };

  /* Rota oluşturma */
  const handleOptimize = async () => {
    try {
      setLoading(true);
      let coords: string;
      let points: LatLng[] = [];

      if (starredId) {
        const star = baseCustomers.find((c) => c.id === starredId)!;
        const others = baseCustomers.filter((c) => c.id !== starredId);
        coords = `${rep.lng},${rep.lat};${star.lng},${star.lat};${others
          .map((c) => `${c.lng},${c.lat}`)
          .join(";")}`;
      } else {
        coords = `${rep.lng},${rep.lat};${baseCustomers.map((c) => `${c.lng},${c.lat}`).join(";")}`;
      }

      const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.trips[0]) {
        const ordered = data.waypoints
          .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
          .map((wp: any) => baseCustomers[wp.waypoint_index - 1])
          .filter(Boolean);
        setOrderedCustomers(ordered);
        const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        setRouteCoords(latlngs);
        setRouteKm(data.trips[0].distance / 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
  }, [baseCustomers]);

  return (
    <div className="relative w-full">
      {/* Sticky üst bar */}
      <div className="sticky top-0 z-20 bg-white/80 py-2 px-3 w-full md:w-1/3 md:ml-auto flex items-center justify-between shadow-sm border-b rounded-bl-xl">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-700">Toplam Mesafe: <b>{fmtKm(routeKm)}</b></div>
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
      </div>

      {/* Harita */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <FitBounds coords={[[rep.lat, rep.lng], ...baseCustomers.map((c) => [c.lat, c.lng])]} />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

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
                        setStarredId(prev => (prev === c.id ? null : c.id));
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
        <div
          className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
          } flex`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white"
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

          <div className="bg-white/90 rounded-l-xl shadow-md px-4 py-3 flex flex-col gap-3 min-w-[260px] h-full overflow-y-auto">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700 text-base">Ziyaret Sırası</span>
            </div>
            {orderedCustomers.map((c, i) => {
              const selected = selectedId === c.id;
              const starred = starredId === c.id;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                    selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedId(c.id);
                    if (mapRef.current) {
                      mapRef.current.setView([c.lat, c.lng], 15, { animate: true });
                    }
                  }}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center font-bold rounded-full text-white ${
                      starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 truncate">{c.address}, {c.district}</div>
                  </div>
                  <button
                    className="ml-auto p-1 rounded-lg hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStarredId(prev => prev === c.id ? null : c.id);
                    }}
                  >
                    {starred
                      ? <Star className="w-4 h-4 text-[#F5B301] fill-[#F5B301]" />
                      : <StarOff className="w-4 h-4 text-gray-500" />}
                  </button>
                  <span className="text-xs text-gray-700 font-semibold">{c.plannedTime}</span>
                </div>
              );
            })}
          </div>
        </div>
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
