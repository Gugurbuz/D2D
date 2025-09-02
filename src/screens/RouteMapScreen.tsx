import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker as StaticMarker, Popup, Polyline, LayerGroup } from "react-leaflet";
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

  // ===== YENİ YAPI: Marker'ları manuel olarak yöneteceğimiz katman grubu için ref =====
  const markersLayerGroupRef = useRef<L.LayerGroup>(null);

  const handleOptimize = async () => { /* ... fonksiyon içeriği aynı ... */ };
  const highlightCustomer = (c: Customer, i: number, pan = true) => { /* ... fonksiyon içeriği aynı ... */ };

  // =================================================================================
  // ===== ANA DEĞİŞİKLİK: Marker'ları `useEffect` içinde manuel olarak yönetiyoruz =====
  // =================================================================================
  useEffect(() => {
    const layerGroup = markersLayerGroupRef.current;
    if (!layerGroup) return;

    // 1. ADIM: Önceki tüm marker'ları haritadan temizle. Bu, hatayı önler.
    layerGroup.clearLayers();
    // Kendi referans objemizi de temizleyelim
    markerRefs.current = {};

    // 2. ADIM: Güncel `orderedCustomers` listesine göre marker'ları sıfırdan oluştur.
    orderedCustomers.forEach((customer, index) => {
      // İkonu güncel duruma göre oluştur
      const icon = numberIcon(index + 1, {
        highlight: selectedId === customer.id,
        starred: starredId === customer.id
      });

      // Leaflet marker'ını oluştur
      const marker = L.marker([customer.lat, customer.lng], { icon });

      // Popup içeriğini oluştur ve bağla
      const popupContent = `
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <b>${index + 1}. ${customer.name}</b>
            ${starredId === customer.id ? '<span class="text-[#F5B301] text-xs font-semibold">⭐ İlk Durak</span>' : ''}
          </div>
          <div>${customer.address}, ${customer.district}</div>
          <div>Saat: ${customer.plannedTime}</div>
          <div>Tel: <a class="text-[#0099CB] underline" href="${toTelHref(customer.phone)}">${customer.phone}</a></div>
        </div>
      `;
      marker.bindPopup(popupContent);
      
      // Tıklama olayını bağla
      marker.on('click', () => {
        setSelectedId(customer.id);
        const row = document.getElementById(`cust-row-${customer.id}`);
        if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      // Oluşturulan marker'ı katman grubuna (ve dolayısıyla haritaya) ekle
      marker.addTo(layerGroup);

      // Harici olarak erişebilmek için referansını sakla
      markerRefs.current[customer.id] = marker;
    });

  // Bu useEffect, marker'ların görünümünü etkileyen herhangi bir state değiştiğinde yeniden çalışır.
  }, [orderedCustomers, selectedId, starredId]);


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

          {/* Statik Marker'lar için react-leaflet kullanmaya devam edebiliriz, sorun çıkarmazlar. */}
          <StaticMarker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </StaticMarker>

          {/* ===== YENİ YAPI: Dinamik marker'lar artık bu katman grubu içinde manuel yönetilecek ===== */}
          <LayerGroup ref={markersLayerGroupRef} />

          {/* Rota çizgisi için react-leaflet kullanmaya devam edebiliriz. */}
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