import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L, { LeafletMouseEvent } from "leaflet";
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
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const handleOptimize = async () => { /* ... fonksiyon içeriği aynı ... */ };
  const highlightCustomer = (c: Customer, i: number, pan = true) => { /* ... fonksiyon içeriği aynı ... */ };

  // ===== DÜZELTME: Hızlı erişim için müşterileri bir Map objesinde tutuyoruz =====
  const customersMap = useMemo(() => {
    return new Map(orderedCustomers.map(c => [c.id, c]));
  }, [orderedCustomers]);

  // `useMemo` ile ikonlar sadece gerektiğinde yeniden oluşturuluyor
  const customerIcons = useMemo(() => {
    const iconMap = new Map<string, L.DivIcon>();
    orderedCustomers.forEach((c, i) => {
      iconMap.set(c.id, numberIcon(i + 1, { 
        highlight: selectedId === c.id, 
        starred: starredId === c.id 
      }));
    });
    return iconMap;
  }, [orderedCustomers, selectedId, starredId]);

  // ===== DÜZELTME: Tüm marker'lar için TEK ve STABİL bir tıklama fonksiyonu =====
  const handleMarkerClick = useCallback((e: LeafletMouseEvent) => {
    // Leaflet event'inden marker'ı ve ona eklediğimiz özel ID'yi alıyoruz
    const marker = e.target as L.Marker & { options: { customId: string }};
    const customerId = marker.options.customId;
    const customer = customersMap.get(customerId);

    if (customer) {
      setSelectedId(customer.id);
      marker.openPopup();
      const row = document.getElementById(`cust-row-${customer.id}`);
      if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [customersMap]); // Sadece customer listesi değiştiğinde yeniden oluşturulur

  // ===== DÜZELTME: Olay dinleyici objesini de stabil hale getiriyoruz =====
  const stableEventHandlers = useMemo(() => ({
    click: handleMarkerClick,
  }), [handleMarkerClick]);

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
      <div className="mb-3 flex items-center justify-between">
        {/* ... Üst bar içeriği aynı ... */}
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          Rota Haritası
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></div>
          <button onClick={handleOptimize} disabled={loading} className={`px-4 py-2 rounded-lg font-semibold ${loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"}`}>
            {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn targetRef={mapWrapperRef} />
        </div>
      </div>

      <div ref={mapWrapperRef} className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl fullscreen:bg-white">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              // ===== DÜZELTME: Tamamen stabil prop'lar kullanılıyor =====
              icon={customerIcons.get(c.id)!}
              eventHandlers={stableEventHandlers}
              options={{ customId: c.id }} // Marker'ı tanımak için özel ID ekliyoruz
              zIndexOffset={1000 - i}
              ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
            >
              <Popup>
                {/* ... Popup içeriği aynı ... */}
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>
        
        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${ panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]" } flex`}>
            {/* ... Sağ Panel içeriği aynı ... */}
        </div>
      </div>
    </div>
  );
};

const FullscreenBtn: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = ({ targetRef }) => {
    const [isFs, setIsFs] = useState(false);
  
    useEffect(() => {
      const handleFullscreenChange = () => setIsFs(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);
  
    const toggleFullscreen = async () => {
      if (!targetRef.current) return;
  
      if (!document.fullscreenElement) {
        await targetRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    };
  
    return (
      <button onClick={toggleFullscreen} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">
        {isFs ? <><Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>}
      </button>
    );
};

export default RouteMap;