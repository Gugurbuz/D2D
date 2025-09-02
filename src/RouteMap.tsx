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
} from "lucide-react";

/* ==== Tipler ve Varsayılan Veriler (Değişiklik yok) ==== */
export type Customer = { id: string; name: string; address: string; district: string; plannedTime: string; priority: "Yüksek" | "Orta" | "Düşük"; tariff: string; meterNumber: string; consumption: string; offerHistory: string[]; status: "Bekliyor" | "Yolda" | "Tamamlandı"; estimatedDuration: string; distance: string; lat: number; lng: number; phone: string; };
export type SalesRep = { name: string; lat: number; lng: number; };
type LatLng = [number, number];
interface Props { customers?: Customer[]; salesRep?: SalesRep; }
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };
const anadoluCustomers: Customer[] = [ /* ... müşteri verisi aynı ... */ ];

/* ==== İkonlar ve Yardımcılar (Değişiklik yok) ==== */
const repIcon = new L.Icon({ iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -28], });
function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) { /* ... ikon fonksiyonu aynı ... */ }
function haversineKm(a: LatLng, b: LatLng) { /* ... haversine fonksiyonu aynı ... */ }
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/* ==== Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  // ... state'ler ve diğer fonksiyonlar aynı ...
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // 1. ADIM: Harita sarmalayıcısı için bir ref oluşturuldu
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // ... Diğer tüm fonksiyonlar (handleOptimize, highlightCustomer vb.) aynı kalacak ...
  const handleOptimize = async () => { /* ... fonksiyon içeriği aynı ... */ };
  const highlightCustomer = (c: Customer, i: number, pan = true) => { /* ... fonksiyon içeriği aynı ... */ };

  useEffect(() => {
    if (starredId !== null) {
      handleOptimize();
    }
  }, [starredId]);

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
  }, [baseCustomers]);

  const center: LatLng = [rep.lat, rep.lng];

  return (
    <div className="relative w-full">
      {/* Üst başlık + aksiyonlar */}
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
          {/* 3. ADIM: Ref, butona prop olarak gönderildi */}
          <FullscreenBtn targetRef={mapWrapperRef} />
        </div>
      </div>

      {/* 2. ADIM: Ref, tam ekran yapılacak olan div'e eklendi ve stil iyileştirmesi yapıldı */}
      <div
        ref={mapWrapperRef}
        className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl fullscreen:bg-white"
      >
        {/* Harita */}
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

          {/* Satış Uzmanı */}
          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {/* Müşteriler */}
          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })}
              zIndexOffset={1000 - i}
              ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
              eventHandlers={{ click: () => highlightCustomer(c, i, false) }}
            >
              <Popup>
                {/* ... Popup içeriği aynı ... */}
              </Popup>
            </Marker>
          ))}

          {/* Rota çizgisi */}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>

        {/* SAĞ PANEL */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
          } flex`}
        >
            {/* ... Panel içeriği aynı ... */}
        </div>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            {/* ... Loading içeriği aynı ... */}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. ADIM: FullscreenBtn bileşeni, prop olarak gelen ref'i kullanacak şekilde güncellendi
const FullscreenBtn: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = ({ targetRef }) => {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    // Prop olarak gelen ref'in 'current' değeri var mı diye kontrol et (güvenlik için)
    if (!targetRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      // Artık tüm sayfayı değil, sadece ref'i verilen elementi tam ekran yap
      await targetRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
    >
      {isFs ? <><Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>}
    </button>
  );
};

export default RouteMap;