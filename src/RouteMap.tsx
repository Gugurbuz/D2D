import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
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

  // ... Diğer fonksiyonlar (handleOptimize, highlightCustomer vb.) aynı kalacak ...
  const handleOptimize = async () => { /* ... fonksiyon içeriği aynı ... */ };
  const highlightCustomer = (c: Customer, i: number, pan = true) => { /* ... fonksiyon içeriği aynı ... */ };

  // ===== DÜZELTME 1: `useMemo` ile ikonlar sadece gerektiğinde yeniden oluşturuluyor =====
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

  // ===== DÜZELTME 2: `useCallback` ile marker tıklama fonksiyonu stabil hale getirildi =====
  const handleMarkerClick = useCallback((customer: Customer) => {
    setSelectedId(customer.id);
    const m = markerRefs.current[customer.id];
    if (m) m.openPopup();
    const row = document.getElementById(`cust-row-${customer.id}`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []); // Boş dizi, bu fonksiyonun sadece 1 kez oluşturulmasını sağlar.

  // Olay dinleyicilerini stabil hale getirmek için `useMemo` kullanıyoruz.
  const markerEventHandlers = useMemo(() => {
    const handlers: Record<string, { click: () => void }> = {};
    orderedCustomers.forEach((c) => {
        handlers[c.id] = {
            click: () => handleMarkerClick(c),
        };
    });
    return handlers;
  }, [orderedCustomers, handleMarkerClick]);


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
        <FullscreenBtn targetRef={mapWrapperRef} />
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
              // ===== DÜZELTME: Stabil ikon ve olay dinleyicileri kullanılıyor =====
              icon={customerIcons.get(c.id)!}
              eventHandlers={markerEventHandlers[c.id]}
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
        
        {/* ... Sağ Panel ve Loading overlay aynı ... */}
      </div>
    </div>
  );
};

/* ... FullscreenBtn bileşeni aynı ... */
const FullscreenBtn: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = ({ targetRef }) => { /* ... içerik aynı ... */ };

export default RouteMap;