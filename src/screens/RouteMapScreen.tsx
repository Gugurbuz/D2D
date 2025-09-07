// src/RouteMap.tsx
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

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* ==== Varsayılanlar ==== */
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };

// Buradaki müşteri datası aynı kalıyor (kısaltılmıştır)
const anadoluCustomers: Customer[] = [
  {
    id: "1",
    name: "Buse Aksoy",
    address: "Bağdat Cd. No:120",
    district: "Maltepe",
    plannedTime: "09:00",
    priority: "Düşük",
    tariff: "Mesken",
    meterNumber: "210000001",
    consumption: "270 kWh/ay",
    offerHistory: ["2025-03: Dijital sözleşme"],
    status: "Bekliyor",
    estimatedDuration: "25 dk",
    distance: "0.9 km",
    lat: 40.9359,
    lng: 29.1569,
    phone: "0555 111 22 01",
  },
  // ... diğerleri
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
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;line-height:1;background:${bg};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:${
      highlight ? "scale(1.14)" : "scale(1)"
    };">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

/* ==== Yardımcılar ==== */
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", {
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
  const [panelOpen, setPanelOpen] = useState(false);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);

  const center: LatLng = [rep.lat, rep.lng];

  return (
    <div className="relative w-full">
      {/* Sticky üst bar */}
      <div className="sticky top-0 z-20 bg-white py-2 mb-3 flex items-center justify-between shadow-sm">
        {/* Sol başlık */}
        <div className="flex items-center gap-2 text-gray-900 font-semibold pl-2 text-sm sm:text-base">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          <span className="truncate">Rota Haritası</span>
        </div>

        {/* Sağ aksiyonlar */}
        <div className="flex items-center gap-2 sm:gap-3 pr-2">
          {/* Mesafe */}
          <div className="text-xs sm:text-sm text-gray-700 flex items-center gap-1">
            <span className="sm:hidden">📏</span>
            <span>
              <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
            </span>
            <span className="hidden sm:inline">Toplam Mesafe</span>
          </div>

          {/* Optimize butonu */}
          <button
            onClick={() => alert("Optimize edilecek")}
            disabled={loading}
            className={`px-2 sm:px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
              loading
                ? "bg-gray-300 text-gray-600"
                : "bg-[#0099CB] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Hesaplanıyor…" : (
              <>
                <span className="hidden sm:inline">Rotayı Optimize Et</span>
                <span className="sm:hidden">Optimize</span>
              </>
            )}
          </button>

          {/* Fullscreen butonu */}
          <FullscreenBtn mapWrapperRef={mapWrapperRef} />
        </div>
      </div>

      {/* Harita kutusu */}
      <div
        ref={mapWrapperRef}
        className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl"
      >
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup>
              <b>{rep.name}</b>
            </Popup>
          </Marker>

          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: "#0099CB", weight: 7 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

/* ==== Fullscreen butonu ==== */
const FullscreenBtn: React.FC<{ mapWrapperRef: React.RefObject<HTMLDivElement> }> = ({
  mapWrapperRef,
}) => {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  return (
    <button
      onClick={async () => {
        if (!document.fullscreenElement && mapWrapperRef.current) {
          await mapWrapperRef.current.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      }}
      className="px-2 sm:px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
    >
      {isFs ? (
        <>
          <Minimize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Kapat</span>
        </>
      ) : (
        <>
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Tam Ekran</span>
        </>
      )}
    </button>
  );
};

export default RouteMap;
