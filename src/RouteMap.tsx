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
const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

// ==================================================================
// ===== YENİ YAPI: Her bir Marker kendi bileşenine ayrıldı =====
// ==================================================================

// 1. ADIM: Popup içeriğini kendi memoize edilmiş bileşenine ayırıyoruz.
const CustomerPopupContent: React.FC<{ customer: Customer; index: number; starredId: string | null; }> = React.memo(({ customer, index, starredId }) => {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <b>{index + 1}. {customer.name}</b>
                {starredId === customer.id && <span className="text-[#F5B301] text-xs font-semibold">⭐ İlk Durak</span>}
            </div>
            <div>{customer.address}, {customer.district}</div>
            <div>Saat: {customer.plannedTime}</div>
            <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(customer.phone)}>{customer.phone}</a></div>
        </div>
    );
});

// 2. ADIM: Marker'ın kendisini, tüm proplarıyla birlikte kendi memoize edilmiş bileşenine ayırıyoruz.
// Bu, hatanın ana çözümüdür.
const SingleCustomerMarker: React.FC<{
    customer: Customer;
    index: number;
    icon: L.DivIcon;
    eventHandlers: { click: (e: LeafletMouseEvent) => void };
    markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
    starredId: string | null;
}> = React.memo(({ customer, index, icon, eventHandlers, markerRefs, starredId }) => {
    return (
        <Marker
            position={[customer.lat, customer.lng]}
            icon={icon}
            eventHandlers={eventHandlers}
            options={{ customId: customer.id }}
            zIndexOffset={1000 - index}
            ref={(ref: L.Marker | null) => {
                if (ref) {
                    markerRefs.current[customer.id] = ref;
                }
            }}
        >
            <Popup>
                <CustomerPopupContent customer={customer} index={index} starredId={starredId} />
            </Popup>
        </Marker>
    );
});


/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  // ...diğer state'ler ve ref'ler aynı...
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const handleOptimize = async () => { /* ... fonksiyon içeriği aynı ... */ };
  const highlightCustomer = (c: Customer, i: number, pan = true) => { /* ... fonksiyon içeriği aynı ... */ };

  const customersMap = useMemo(() => new Map(orderedCustomers.map(c => [c.id, c])), [orderedCustomers]);

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

  const handleMarkerClick = useCallback((e: LeafletMouseEvent) => {
    const marker = e.target as L.Marker & { options: { customId: string }};
    const customerId = marker.options.customId;
    const customer = customersMap.get(customerId);

    if (customer) {
      setSelectedId(customer.id);
      marker.openPopup();
      const row = document.getElementById(`cust-row-${customer.id}`);
      if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [customersMap]);

  const stableEventHandlers = useMemo(() => ({ click: handleMarkerClick }), [handleMarkerClick]);

  useEffect(() => {
    if (starredId !== null) handleOptimize();
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

          {/* 3. ADIM: .map() döngüsü artık çok daha basit ve stabil. */}
          {orderedCustomers.map((customer, index) => (
            <SingleCustomerMarker
              key={customer.id}
              customer={customer}
              index={index}
              icon={customerIcons.get(customer.id)!}
              eventHandlers={stableEventHandlers}
              markerRefs={markerRefs}
              starredId={starredId}
            />
          ))}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>
        
        <div className={`absolute top-4 right-0 bottom-4 z-10 ... flex`}>
            {/* ... Sağ Panel içeriği aynı ... */}
        </div>
      </div>
    </div>
  );
};

const FullscreenBtn: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = ({ targetRef }) => { /* ... içerik aynı ... */ };

export default RouteMap;