// 📍 RouteMap.tsx

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
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
} from "lucide-react";

// 👤 Tipler
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

// 🧭 Varsayılan konum
const defaultSalesRep: SalesRep = {
  name: "Satış Uzmanı",
  lat: 40.9368,
  lng: 29.1553,
};

// 🗺️ İkonlar
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png",
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
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;line-height:1;background:${bg};border-radius:50%;border:2px solid #fff;${pulse}transform:${highlight ? "scale(1.1)" : "scale(1)"};">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

// 🧠 Yardımcı fonksiyonlar
const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(km) + " km";

// 🎯 Ana bileşen
const RouteMap: React.FC<Props> = ({ customers = [], salesRep = defaultSalesRep }) => {
  const mapRef = useRef<L.Map | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef<HTMLButtonElement>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(customers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const center: LatLng = [salesRep.lat, salesRep.lng];

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  // 🌟 Scroll to top
  const scrollToTop = () => {
    if (panelRef.current) panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setOrderedCustomers(customers);
  }, [customers]);

  // 📌 MAP optimize & route hesapla (mock)
  const handleOptimize = async () => {
    setLoading(true);
    setTimeout(() => {
      setRouteCoords(orderedCustomers.map(c => [c.lat, c.lng]));
      setRouteKm(Math.random() * 10 + 5);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="relative w-full">
      {/* ÜST PANEL */}
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
            className={`px-4 py-2 rounded-lg font-semibold ${
              loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn />
        </div>
      </div>

      {/* HARİTA */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
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

          {/* Rehber */}
          <Marker position={[salesRep.lat, salesRep.lng]} icon={repIcon}>
            <Popup>
              <b>{salesRep.name}</b>
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
              eventHandlers={{
                click: () => {
                  setSelectedId(c.id);
                  const m = markerRefs.current[c.id];
                  if (m) m.openPopup();
                },
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
                    className="mt-2 flex items-center justify-center gap-2 w-full text-center px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigasyonu Başlat
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ROTA */}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 6 }} />
          )}
        </MapContainer>

        {/* SAĞ PANEL */}
        {panelOpen && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10"></div>
        )}
        <div
          className={`absolute top-4 right-0 bottom-4 z-20 transition-transform duration-500 ease-in-out ${
            panelOpen ? "translate-x-0" : "translate-x-[calc(100%-3rem)]"
          } flex`}
        >
          {/* AÇ/KAPA DÜĞMESİ */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="w-8 bg-[#0099CB] hover:bg-[#007DA1] text-white flex flex-col items-center justify-center"
            title={panelOpen ? "Paneli Kapat" : "Paneli Aç"}
          >
            {panelOpen ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>

          {/* PANEL İÇİ */}
          <div className="bg-white/95 rounded-l-xl shadow-md px-4 py-4 flex flex-col gap-3 w-[270px] max-w-sm h-full">
            <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              Ziyaret Sırası
            </div>
            <div className="text-xs text-gray-600">
              ⭐ Yıldızlı müşteri önce ziyaret edilir. Liste güncellenir.
            </div>

            <div ref={panelRef} className="overflow-y-auto pr-2 flex-1 space-y-2">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded transition ${
                      selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedId(c.id);
                      mapRef.current?.setView([c.lat, c.lng], 15, { animate: true });
                      markerRefs.current[c.id]?.openPopup();
                    }}
                  >
                    <span className={`w-7 h-7 text-xs font-bold rounded-full flex items-center justify-center text-white ${
                      starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.address}, {c.district}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStarredId(prev => prev === c.id ? null : c.id);
                      }}
                      className="ml-auto p-1 hover:bg-gray-100 rounded"
                    >
                      {starred
                        ? <Star className="w-4 h-4 text-[#F5B301] fill-[#F5B301]" />
                        : <StarOff className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              ref={scrollTopRef}
              onClick={scrollToTop}
              className="mt-auto px-3 py-2 text-xs text-[#0099CB] hover:underline flex items-center justify-center gap-1"
            >
              <ArrowUp className="w-4 h-4" />
              Yukarı Çık
            </button>
          </div>
        </div>

        {/* YÜKLENİYOR */}
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="rounded-lg bg-white shadow px-6 py-4 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🔲 Tam Ekran Butonu
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
      {isFs ? <><Minimize2 className="w-4 h-4" /> Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>}
    </button>
  );
};

export default RouteMap;
