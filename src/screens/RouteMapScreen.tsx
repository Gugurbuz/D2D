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

/* ==== Varsayılanlar ==== */
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };
const anadoluCustomers: Customer[] = [
  // ... mevcut müşteri listesi (kısalttım) ...
];

/* ==== İkonlar ==== */
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});
function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) {
  const bg = opts?.starred ? "#F5B301" : opts?.highlight ? "#FF6B00" : "#0099CB";
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
    : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/* ==== OSRM ==== */
async function osrmTrip(coords: string) {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM trip error");
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Trip not found");
  return data;
}

/* ==== Bileşen ==== */
const RouteMap: React.FC<{ customers?: Customer[]; salesRep?: SalesRep }> = ({
  customers,
  salesRep,
}) => {
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

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  /* ==== Rota hesaplama ==== */
  const handleOptimize = async () => {
    try {
      setLoading(true);
      const points = [{ lat: rep.lat, lng: rep.lng }, ...baseCustomers];
      let coords = points.map((p: any) => `${p.lng},${p.lat}`).join(";");
      const data = await osrmTrip(coords);

      const sorted = data.waypoints
        .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
        .map((wp: any) => baseCustomers[wp.waypoint_index - 1]);

      // yıldızlı müşteri varsa ilk sıraya koy
      const final = starredId
        ? [baseCustomers.find((c) => c.id === starredId)!, ...sorted.filter((c) => c.id !== starredId)]
        : sorted;

      setOrderedCustomers(final);
      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(latlngs);
      setRouteKm(data.trips[0].distance / 1000);

      if (mapRef.current) {
        mapRef.current.fitBounds(latlngs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* Yıldız değişince yeniden hesapla */
  useEffect(() => {
    if (starredId) handleOptimize();
  }, [starredId]);

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
  }, [baseCustomers]);

  const center: LatLng = [rep.lat, rep.lng];
  const bounds: L.LatLngBoundsExpression = [
    [40.8, 29.0],
    [41.2, 29.4],
  ];

  return (
    <div className="relative w-full" id="map-wrapper">
      {/* Sticky üst bar */}
      <div className="sticky top-0 z-20 bg-white/80 py-2 px-3 
                      w-full md:w-1/3 md:ml-auto 
                      flex items-center justify-between 
                      shadow-sm border-b rounded-bl-xl">
        <div className="flex items-center gap-2">
          <RouteIcon className="w-4 h-4 text-[#0099CB]" />
          <div className="text-xs text-gray-700">Mesafe: {fmtKm(routeKm)}</div>
        </div>
        <div className="flex items-center gap-2">
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
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Satış uzmanı */}
          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup>
              <b>{rep.name}</b>
            </Popup>
          </Marker>

          {/* Müşteriler */}
          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, {
                highlight: selectedId === c.id,
                starred: starredId === c.id,
              })}
              ref={(ref: any) => {
                if (ref) markerRefs.current[c.id] = ref;
              }}
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
                        setStarredId((prev) => (prev === c.id ? null : c.id));
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starredId === c.id ? "text-[#F5B301] fill-[#F5B301]" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>
                  <div>{c.address}, {c.district}</div>
                  <div>Saat: {c.plannedTime}</div>
                  <div>
                    Tel: <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>{c.phone}</a>
                  </div>
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

        {/* Sağ panel (sürükleyerek aç/kapat) */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
          } flex`}
          onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx > 50) setPanelOpen(true);
            if (dx < -50) setPanelOpen(false);
            touchStartX.current = null;
          }}
        >
          {/* ... Panel içeriği buraya eklenebilir ... */}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-green-100 border border-green-300 px-5 py-3 text-sm font-semibold text-green-800 shadow">
              Rota hesaplanıyor…
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
        const el = document.getElementById("map-wrapper");
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
