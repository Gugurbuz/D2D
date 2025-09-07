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

/* ==== Tipler ve Varsayılan Veriler ==== */
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

const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };

const anadoluCustomers: Customer[] = [
  { id: '1', name: 'Buse Aksoy', address: 'Bağdat Cd. No:120', district: 'Maltepe', plannedTime: '09:00', priority: 'Düşük', tariff: 'Mesken', meterNumber: '210000001', consumption: '270 kWh/ay', offerHistory: ['2025-03: Dijital sözleşme'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '0.9 km', lat: 40.9359, lng: 29.1569, phone: '0555 111 22 01' },
  { id: '2', name: 'Kaan Er', address: 'Alemdağ Cd. No:22', district: 'Ümraniye', plannedTime: '09:20', priority: 'Orta', tariff: 'Mesken', meterNumber: '210000002', consumption: '300 kWh/ay', offerHistory: ['2024-08: %10 indirim'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '9.6 km', lat: 41.0165, lng: 29.1248, phone: '0555 111 22 02' },
  { id: '3', name: 'Canan Sezer', address: 'Finans Merkezi A1', district: 'Ataşehir', plannedTime: '09:40', priority: 'Yüksek', tariff: 'İş Yeri', meterNumber: '210000003', consumption: '1400 kWh/ay', offerHistory: ['2024-09: Kurumsal teklif'], status: 'Bekliyor', estimatedDuration: '50 dk', distance: '6.2 km', lat: 40.9923, lng: 29.1274, phone: '0555 111 22 03' },
  { id: '4', name: 'Kübra Oral', address: 'İnönü Mah. No:18', district: 'Kadıköy', plannedTime: '10:00', priority: 'Orta', tariff: 'Mesken', meterNumber: '210000004', consumption: '310 kWh/ay', offerHistory: ['2024-11: Sadakat indirimi'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '7.1 km', lat: 40.9857, lng: 29.0496, phone: '0555 111 22 04' },
  { id: '5', name: 'Ayça Erden', address: 'Koşuyolu Cd. No:7', district: 'Kadıköy', plannedTime: '10:20', priority: 'Yüksek', tariff: 'İş Yeri', meterNumber: '210000005', consumption: '980 kWh/ay', offerHistory: ['2024-10: %10 indirim'], status: 'Bekliyor', estimatedDuration: '35 dk', distance: '8.3 km', lat: 41.0004, lng: 29.0498, phone: '0555 111 22 05' },
  { id: '6', name: 'Meral Kılıç', address: 'Çengelköy Sahil', district: 'Üsküdar', plannedTime: '10:40', priority: 'Düşük', tariff: 'Mesken', meterNumber: '210000006', consumption: '260 kWh/ay', offerHistory: ['2024-03: Hoş geldin'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '12.1 km', lat: 41.0573, lng: 29.0557, phone: '0555 111 22 06' },
  { id: '7', name: 'Tuğçe Polat', address: 'Kısıklı Cd. No:15', district: 'Üsküdar', plannedTime: '11:00', priority: 'Orta', tariff: 'Mesken', meterNumber: '210000007', consumption: '290 kWh/ay', offerHistory: ['2024-12: Sadakat'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '10.8 km', lat: 41.0333, lng: 29.0672, phone: '0555 111 22 07' },
  { id: '8', name: 'Selim Yurt', address: 'Atatürk Cd. No:5', district: 'Sancaktepe', plannedTime: '11:20', priority: 'Orta', tariff: 'Mesken', meterNumber: '210000008', consumption: '320 kWh/ay', offerHistory: ['2025-03: Yeni teklif'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '14.2 km', lat: 41.0152, lng: 29.2316, phone: '0555 111 22 08' },
  { id: '9', name: 'Zeynep Koç', address: 'Sarıgazi Mah. 23', district: 'Sancaktepe', plannedTime: '11:40', priority: 'Yüksek', tariff: 'İş Yeri', meterNumber: '210000009', consumption: '1120 kWh/ay', offerHistory: ['2024-08: Turizm indirimi'], status: 'Bekliyor', estimatedDuration: '45 dk', distance: '16.1 km', lat: 41.0074, lng: 29.2447, phone: '0555 111 22 09' },
  { id: '10', name: 'Yasin Ateş', address: 'Şerifali Mah. No:4', district: 'Ümraniye', plannedTime: '12:00', priority: 'Orta', tariff: 'Mesken', meterNumber: '210000010', consumption: '310 kWh/ay', offerHistory: ['2024-07: Sadakat'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '11.1 km', lat: 41.0179, lng: 29.1376, phone: '0555 111 22 10' }
];

/* ==== İkonlar ve Yardımcılar ==== */
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
    className: 'number-marker',
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

// ==================================================================
// ===== Memoized Marker Components =====
// ==================================================================

const CustomerPopupContent: React.FC<{ 
  customer: Customer; 
  index: number; 
  starredId: string | null; 
}> = React.memo(({ customer, index, starredId }) => {
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
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      // OSRM API ile rota optimizasyonu
      const coords = [[rep.lng, rep.lat], ...baseCustomers.map(c => [c.lng, c.lat])]
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(';');
      
      const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`OSRM API error: ${response.status}`);
      
      const data = await response.json();
      if (data.code !== 'Ok' || !data.trips?.[0]) throw new Error('Route optimization failed');

      // Optimize edilmiş sırayı al
      const optimizedOrder = data.waypoints
        .map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index }))
        .sort((a, b) => a.order - b.order)
        .slice(1) // İlk waypoint satış temsilcisi, onu çıkar
        .map((x: any) => baseCustomers[x.idx - 1]);

      setOrderedCustomers(optimizedOrder);
      
      // Rota koordinatlarını al
      const routeCoordinates = data.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as LatLng
      );
      setRouteCoords(routeCoordinates);
      setRouteKm(data.trips[0].distance / 1000);
      
    } catch (error) {
      console.error('Route optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const highlightCustomer = (c: Customer, i: number, pan = true) => {
    setSelectedId(c.id);
    const marker = markerRefs.current[c.id];
    if (marker) {
      marker.openPopup();
    }
    if (pan && mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
    }
    
    // Scroll to customer row in panel
    const row = document.getElementById(`cust-row-${c.id}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

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
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          Rota Haritası
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Toplam: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
          </div>
          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`px-3 py-2 rounded-lg font-semibold ${
              loading ? 'bg-gray-300 text-gray-600' : 'bg-[#0099CB] text-white hover:opacity-90'
            }`}
          >
            {loading ? 'Hesaplanıyor...' : 'Optimize Et'}
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
        
        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-1.5rem)]'} flex`}>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white"
            title={panelOpen ? 'Paneli kapat' : 'Paneli aç'}
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
          
          <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[320px] max-w-sm h-full">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700">Ziyaret Sırası</span>
            </div>
            
            <div className="text-xs text-gray-600">
              ⭐ Yıldızlı müşteri ilk durak olur
            </div>
            
            <div className="flex-1 overflow-auto pr-1 space-y-2">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                
                return (
                  <div
                    key={c.id}
                    id={`cust-row-${c.id}`}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selected ? 'border-[#0099CB] bg-[#0099CB]/10' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => highlightCustomer(c, i)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 flex items-center justify-center font-bold text-xs rounded-full text-white ${
                        starred ? 'bg-[#F5B301]' : selected ? 'bg-[#FF6B00]' : 'bg-[#0099CB]'
                      }`}>
                        {i + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.address}</div>
                        <div className="text-xs text-gray-500">{c.plannedTime} • {c.priority}</div>
                      </div>
                      
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStarredId(prev => prev === c.id ? null : c.id);
                        }}
                        title={starred ? 'Yıldızı kaldır' : 'İlk durak yap'}
                      >
                        {starred ? (
                          <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-[2000]">
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm font-semibold text-gray-700">
              Rota hesaplanıyor...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FullscreenBtn: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = ({ targetRef }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await targetRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
      title={isFullscreen ? 'Tam ekranı kapat' : 'Tam ekran'}
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="w-4 h-4" />
          Tam Ekranı Kapat
        </>
      ) : (
        <>
          <Maximize2 className="w-4 h-4" />
          Tam Ekran
        </>
      )}
    </button>
  );
};

export default RouteMap;