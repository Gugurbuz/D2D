// src/screens/RouteMapScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Maximize2,
  Minimize2,
  Star,
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
export type SalesRep = { name: string; lat: number; lng: number };
type LatLng = [number, number];

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* ==== Varsayılanlar ==== */
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };
const anadoluCustomers: Customer[] = [
  // ... müşteri listesi burada ...
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
  km == null ? "—" : new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(km) + " km";

/* ==== Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const highlightCustomer = (c: Customer) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (m) m.openPopup();
    if (mapRef.current) mapRef.current.setView([c.lat, c.lng], 14, { animate: true });
  };

  /* ==== OSRM TRIP ==== */
  async function handleOptimize() {
    try {
      setLoading(true);
      const tripPoints = [
        { kind: "rep" as const, lat: rep.lat, lng: rep.lng },
        ...baseCustomers.map((c) => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
      ];
      const coords = tripPoints.map((p) => `${p.lng},${p.lat}`).join(";");

      const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("OSRM trip not found");

      const orderedByTrip = data.waypoints
        .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
        .sort((a: any, b: any) => a.order - b.order)
        .map((x: any) => tripPoints[x.inputIdx]);

      const sortedCustomers = orderedByTrip.filter((p) => p.kind === "cust").map((p) => (p as any).ref as Customer);
      setOrderedCustomers(sortedCustomers);

      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      setRouteCoords(latlngs);
      setRouteKm((data.trips[0].distance as number) / 1000);

      if (mapRef.current) {
        const bounds = L.geoJSON(data.trips[0].geometry).getBounds();
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }

      if (sortedCustomers[0]) highlightCustomer(sortedCustomers[0]);
    } catch (e) {
      console.error("OSRM rota hatası:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
    if (mapRef.current) {
      const bounds = L.latLngBounds([[rep.lat, rep.lng], ...baseCustomers.map(c => [c.lat, c.lng] as LatLng)]);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [baseCustomers]);

  return (
    <div className="relative w-full">
      {/* Sticky üst bar */}
      <div
        className="absolute top-2 right-2 z-20 bg-white/90 px-3 py-2
                   rounded-lg shadow-md border flex items-center gap-2"
      >
        <div className="text-xs text-gray-700">Mesafe: {fmtKm(routeKm)}</div>
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
                  <b>{i + 1}. {c.name}</b>
                  <div>{c.address}, {c.district}</div>
                  <div>Saat: {c.plannedTime}</div>
                  <div>Tel: <a href={toTelHref(c.phone)} className="text-[#0099CB] underline">{c.phone}</a></div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigasyonu Başlat
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />}
        </MapContainer>
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
      className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-gray-50 flex items-center gap-1"
    >
      {isFs ? <><Minimize2 className="w-3 h-3" /> Kapat</> : <><Maximize2 className="w-3 h-3" /> Tam Ekran</>}
    </button>
  );
};

export default RouteMap;
