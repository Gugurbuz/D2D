// src/screens/RouteMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Maximize2, Minimize2, Route as RouteIcon, Star, StarOff, Navigation } from "lucide-react";

import { optimizeRoute, LatLng } from "../lib/osrm";

/* =======================
   Tipler
   ======================= */
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
  lat: number | string;
  lng: number | string;
  phone: string;
};

export type SalesRep = {
  name: string;
  lat: number | string;
  lng: number | string;
};

interface Props {
  customers: Customer[]; // zorunlu
  salesRep: SalesRep;    // zorunlu
}

/* =======================
   Yardımcılar
   ======================= */
const toNum = (v: any) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/* =======================
   Ikonlar
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

/* =======================
   Ekran
   ======================= */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // 1) Rep'i ve müşterileri güvene al
  const safeRep = useMemo(() => {
    const lat = toNum(salesRep?.lat);
    const lng = toNum(salesRep?.lng);
    return lat != null && lng != null ? { ...salesRep, lat, lng } : null;
  }, [salesRep]);

  const validCustomers = useMemo(() => {
    return (customers || [])
      .map((c) => {
        const lat = toNum(c.lat);
        const lng = toNum(c.lng);
        if (lat == null || lng == null) return null;
        return { ...c, lat, lng } as Customer & { lat: number; lng: number };
      })
      .filter(Boolean) as Customer[];
  }, [customers]);

  // 2) State
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(validCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // 3) Inputs değişince sıfırla
  useEffect(() => {
    setOrderedCustomers(validCustomers);
    setRouteCoords([]);
    setRouteKm(null);
    setSelectedId(null);
    setStarredId(null);
  }, [validCustomers]);

  // 4) Merkez (rep -> ilk müşteri -> İstanbul)
  const center: LatLng = safeRep
    ? [safeRep.lat as number, safeRep.lng as number]
    : validCustomers.length
      ? [validCustomers[0].lat as number, validCustomers[0].lng as number]
      : [41.015137, 28.97953];

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const highlightCustomer = (c: Customer, pan = true) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (pan && mapRef.current) {
      mapRef.current.setView([c.lat as number, c.lng as number], Math.max(mapRef.current.getZoom(), 14), { animate: true });
    }
    if (m) m.openPopup();
    const row = document.getElementById(`cust-row-${c.id}`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // 5) Optimize
  const handleOptimize = async () => {
    if (!safeRep || validCustomers.length === 0) return;
    setLoading(true);
    try {
      const { orderedStops, polyline, distanceKm } = await optimizeRoute({
        rep: { lat: safeRep.lat as number, lng: safeRep.lng as number },
        stops: validCustomers,
        starredId,
      });
      setOrderedCustomers(orderedStops as Customer[]);
      setRouteCoords(polyline);
      setRouteKm(distanceKm);
      if (orderedStops[0]) {
        const first = orderedStops[0] as Customer;
        highlightCustomer(first, true);
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

  // Boş/Geçersiz durum
  if (!safeRep && validCustomers.length === 0) {
    return (
      <div className="p-6 rounded-xl border bg-white">
        <div className="text-gray-800 font-semibold">Rota Haritası</div>
        <div className="text-sm text-gray-600 mt-2">
          Geçerli konum veya müşteri bulunamadı. Lütfen <b>salesRep.lat/lng</b> ile
          <b> customers[].lat/lng</b> alanlarının sayısal olduğundan emin olun.
        </div>
      </div>
    );
  }

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
            disabled={loading || !safeRep || validCustomers.length === 0}
            className={`px-4 py-2 rounded-lg font-semibold ${
              loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn />
        </div>
      </div>

      {/* Harita */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          key={`${center[0]}-${center[1]}`} // güvenli remount
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          {safeRep && (
            <Marker position={[safeRep.lat as number, safeRep.lng as number]} icon={repIcon}>
              <Popup><b>{safeRep.name}</b></Popup>
            </Marker>
          )}

          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat as number, c.lng as number]}
              icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })}
              zIndexOffset={1000 - i}
              ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
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
          customers={orderedCustomers}
          selectedId={selectedId}
          starredId={starredId}
          onRowClick={(c) => {
            setSelectedId(c.id);
            if (mapRef.current) {
              mapRef.current.setView([c.lat as number, c.lng as number], Math.max(mapRef.current.getZoom(), 14), { animate: true });
            }
            const m = markerRefs.current[c.id];
            if (m) m.openPopup();
          }}
          onToggleStar={(id) => setStarredId((prev) => (prev === id ? null : id))}
          panelOpen={panelOpen}
          setPanelOpen={setPanelOpen}
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
   Sağ Panel
   ======================= */
const SidePanel: React.FC<{
  customers: Customer[];
  selectedId: string | null;
  starredId: string | null;
  onRowClick: (c: Customer) => void;
  onToggleStar: (id: string) => void;
  panelOpen: boolean;
  setPanelOpen: (b: boolean) => void;
}> = ({ customers, selectedId, starredId, onRowClick, onToggleStar, panelOpen, setPanelOpen }) => {
  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  // touch swipe
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };

  return (
    <div
      className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${
        panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
      } flex`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
                className={`flex items-center gap-2 p-2 rounded transition ${selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"}`}
                onClick={() => onRowClick(c)}
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
                  <div className="text-xs text-gray-500 truncate">{c.address}, {c.district}</div>
                  <a className="text-xs text-[#0099CB] underline" href={toTelHref(c.phone)} onClick={(e) => e.stopPropagation()}>
                    {c.phone}
                  </a>
                </div>
                <button
                  className="ml-auto p-1.5 rounded-lg hover:bg-gray-100"
                  title={starred ? "İlk duraktan kaldır" : "İlk durak yap"}
                  onClick={(e) => { e.stopPropagation(); onToggleStar(c.id); }}
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
