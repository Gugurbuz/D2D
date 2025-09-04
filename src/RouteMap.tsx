// src/screens/RouteMapScreen.tsx

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import {
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  Star,
  StarOff,
  Navigation,
} from "lucide-react";

/* ==== Tipler ve Varsayılan Veriler ==== */
export type Customer = { id: string; name: string; address: string; district: string; plannedTime: string; priority: "Yüksek" | "Orta" | "Düşük"; tariff: string; meterNumber: string; consumption: string; offerHistory: string[]; status: "Bekliyor" | "Yolda" | "Tamamlandı"; estimatedDuration: string; distance: string; lat: number; lng: number; phone: string; };
export type SalesRep = { name: string; lat: number; lng: number; };
interface LatLngLiteral { lat: number; lng: number; }
interface Props { customers?: Customer[]; salesRep?: SalesRep; }
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", lat: 40.9368, lng: 29.1553 };
const anadoluCustomers: Customer[] = [ 
  { id: "1", name: "Buse Aksoy", address: "Bağdat Cd. No:120", district: "Maltepe", plannedTime: "09:00", priority: "Düşük", tariff: "Mesken", meterNumber: "210000001", consumption: "270 kWh/ay", offerHistory: ["2025-03: Dijital sözleşme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km", lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01" },
  { id: "2", name: "Kaan Er", address: "Alemdağ Cd. No:22", district: "Ümraniye", plannedTime: "09:20", priority: "Orta", tariff: "Mesken", meterNumber: "210000002", consumption: "300 kWh/ay", offerHistory: ["2024-08: %10 indirim"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km", lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02" },
  { id: "3", name: "Canan Sezer", address: "Finans Mrk. A1", district: "Ataşehir", plannedTime: "09:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000003", consumption: "1400 kWh/ay", offerHistory: ["2024-09: Kurumsal teklif"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "6.2 km", lat: 40.9923, lng: 29.1274, phone: "0555 111 22 03" },
  { id: "4", name: "Kübra Oral", address: "İnönü Mh. No:18", district: "Kadıköy", plannedTime: "10:00", priority: "Orta", tariff: "Mesken", meterNumber: "210000004", consumption: "310 kWh/ay", offerHistory: ["2024-11: Sadakat indirimi"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.1 km", lat: 40.9857, lng: 29.0496, phone: "0555 111 22 04" },
  { id: "5", name: "Ayça Erden", address: "Koşuyolu Cd. 7", district: "Kadıköy", plannedTime: "10:20", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000005", consumption: "980 kWh/ay", offerHistory: ["2024-10: %10 indirim"], status: "Bekliyor", estimatedDuration: "35 dk", distance: "8.3 km", lat: 41.0004, lng: 29.0498, phone: "0555 111 22 05" },
  { id: "6", name: "Meral Kılıç", address: "Çengelköy Sahil", district: "Üsküdar", plannedTime: "10:40", priority: "Düşük", tariff: "Mesken", meterNumber: "210000006", consumption: "260 kWh/ay", offerHistory: ["2024-03: Hoş geldin"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "12.1 km", lat: 41.0573, lng: 29.0557, phone: "0555 111 22 06" },
  { id: "7", name: "Tuğçe Polat", address: "Kısıklı Cd. 15", district: "Üsküdar", plannedTime: "11:00", priority: "Orta", tariff: "Mesken", meterNumber: "210000007", consumption: "290 kWh/ay", offerHistory: ["2024-12: Sadakat"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "10.8 km", lat: 41.0333, lng: 29.0672, phone: "0555 111 22 07" },
  { id: "8", name: "Selim Yurt", address: "Atatürk Cd. No:5", district: "Sancaktepe", plannedTime: "11:20", priority: "Orta", tariff: "Mesken", meterNumber: "210000008", consumption: "320 kWh/ay", offerHistory: ["2025-03: Yeni teklif"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.2 km", lat: 41.0152, lng: 29.2316, phone: "0555 111 22 08" },
  { id: "9", name: "Zeynep Koç", address: "Sarıgazi Mh. 23", district: "Sancaktepe", plannedTime: "11:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000009", consumption: "1120 kWh/ay", offerHistory: ["2024-08: Turizm indirimi"], status: "Bekliyor", estimatedDuration: "45 dk", distance: "16.1 km", lat: 41.0074, lng: 29.2447, phone: "0555 111 22 09" },
  { id: "10", name: "Yasin Ateş", address: "Şerifali Mh. 4", district: "Ümraniye", plannedTime: "12:00", priority: "Orta", tariff: "Mesken", meterNumber: "210000010", consumption: "310 kWh/ay", offerHistory: ["2024-07: Sadakat"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "11.1 km", lat: 41.0179, lng: 29.1376, phone: "0555 111 22 10" },
  { id: "11", name: "Derya Kılıç", address: "Küçükyalı Sahil", district: "Maltepe", plannedTime: "12:20", priority: "Düşük", tariff: "İş Yeri", meterNumber: "210000011", consumption: "900 kWh/ay", offerHistory: ["2024-04: AVM tarifesi"], status: "Bekliyor", estimatedDuration: "35 dk", distance: "2.2 km", lat: 40.9488, lng: 29.1444, phone: "0555 111 22 11" },
  { id: "12", name: "Gizem Acar", address: "İdealtepe No:11", district: "Maltepe", plannedTime: "12:40", priority: "Orta", tariff: "Mesken", meterNumber: "210000012", consumption: "295 kWh/ay", offerHistory: ["2025-01: Paket"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "3.0 km", lat: 40.9497, lng: 29.1228, phone: "0555 111 22 12" },
  { id: "13", name: "Seda Karaca", address: "Başak Cd. No:2", district: "Kartal", plannedTime: "13:10", priority: "Orta", tariff: "Mesken", meterNumber: "210000013", consumption: "300 kWh/ay", offerHistory: ["2024-02: Kombi kampanya"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "6.2 km", lat: 40.9127, lng: 29.2137, phone: "0555 111 22 13" },
  { id: "14", name: "Tolga Kurt", address: "Sahil Yolu No:88", district: "Kartal", plannedTime: "13:30", priority: "Orta", tariff: "Mesken", meterNumber: "210000014", consumption: "295 kWh/ay", offerHistory: ["2024-06: Sadakat paketi"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.5 km", lat: 40.9075, lng: 29.1947, phone: "0555 111 22 14" },
  { id: "15", name: "Melih Uçar", address: "Velibaba Mh. 10", district: "Pendik", plannedTime: "14:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000015", consumption: "1350 kWh/ay", offerHistory: ["2024-01: Endüstriyel tarife"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "12.0 km", lat: 40.9009, lng: 29.2312, phone: "0555 111 22 15" },
  { id: "16", name: "İpek Gür", address: "Esenyalı Mh. 17", district: "Pendik", plannedTime: "14:30", priority: "Düşük", tariff: "Mesken", meterNumber: "210000016", consumption: "280 kWh/ay", offerHistory: ["2023-12: E-devlet onay"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.8 km", lat: 40.8784, lng: 29.2743, phone: "0555 111 22 16" },
  { id: "17", name: "Kerem Efe", address: "Barbaros Mh. 5", district: "Tuzla", plannedTime: "15:00", priority: "Orta", tariff: "Mesken", meterNumber: "210000017", consumption: "310 kWh/ay", offerHistory: ["2023-11: Online randevu"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "19.2 km", lat: 40.8380, lng: 29.3033, phone: "0555 111 22 17" },
  { id: "18", name: "Naz Acar", address: "İstasyon Mh. 3", district: "Tuzla", plannedTime: "15:30", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000018", consumption: "920 kWh/ay", offerHistory: ["2023-10: Ticari sabit"], status: "Bekliyor", estimatedDuration: "40 dk", distance: "21.0 km", lat: 40.8228, lng: 29.3345, phone: "0555 111 22 18" },
  { id: "19", name: "Mina Eren", address: "Acarlar Mh. 2", district: "Beykoz", plannedTime: "16:00", priority: "Yüksek", tariff: "Mesken", meterNumber: "210000019", consumption: "290 kWh/ay", offerHistory: ["2025-02: Özel teklif"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "24.2 km", lat: 41.1459, lng: 29.1111, phone: "0555 111 22 19" },
  { id: "20", name: "Efe Çınar", address: "Şahinbey Cd. 9", district: "Sultanbeyli", plannedTime: "16:30", priority: "Orta", tariff: "Mesken", meterNumber: "210000020", consumption: "300 kWh/ay", offerHistory: ["2024-05: %8 indirim"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "16.8 km", lat: 40.9677, lng: 29.2622, phone: "0555 111 22 20" },
  { id: "21", name: "Elif Aydın", address: "Merkez Mh. 1", district: "Çekmeköy", plannedTime: "17:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000021", consumption: "1120 kWh/ay", offerHistory: ["2024-08: Esnek paket"], status: "Bekliyor", estimatedDuration: "45 dk", distance: "18.1 km", lat: 41.0546, lng: 29.2013, phone: "0555 111 22 21" },
  { id: "22", name: "Onur Demirel", address: "Çamlık Mh. 6", district: "Çekmeköy", plannedTime: "17:30", priority: "Orta", tariff: "Mesken", meterNumber: "210000022", consumption: "330 kWh/ay", offerHistory: ["2024-05: Otomatik ödeme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "19.0 km", lat: 41.0466, lng: 29.2233, phone: "0555 111 22 22" },
];

/* ==== Yardımcılar ==== */
const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
const containerStyle = { width: "100%", height: "100%" };
const defaultCenter: LatLngLiteral = { lat: defaultSalesRep.lat, lng: defaultSalesRep.lng };

const CustomerMarker: React.FC<{
  customer: Customer;
  index: number;
  selectedId: string | null;
  starredId: string | null;
  onClick: (id: string | null) => void;
}> = React.memo(({ customer, index, selectedId, starredId, onClick }) => {
  const isSelected = selectedId === customer.id;
  const isStarred = starredId === customer.id;

  const icon = useMemo(() => {
    const fillColor = isStarred ? "#F5B301" : isSelected ? "#FF6B00" : "#0099CB";
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 14,
      fillColor,
      fillOpacity: 1,
      strokeColor: "#fff",
      strokeWeight: 2,
    };
  }, [isSelected, isStarred]);

  const label = useMemo(() => ({
    text: `${index + 1}`,
    color: isStarred ? "#000" : "#fff",
    fontSize: "12px",
    fontWeight: "800",
  }), [index, isStarred]);

  return (
    <Marker
      position={{ lat: customer.lat, lng: customer.lng }}
      icon={icon}
      label={label}
      onClick={() => onClick(customer.id)}
      zIndex={isSelected ? 2000 : (isStarred ? 1500 : (1000 - index))}
    >
      {isSelected && (
        <InfoWindow onCloseClick={() => onClick(null)}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <b>{index + 1}. {customer.name}</b>
              {isStarred && <span className="text-[#F5B301] text-xs font-semibold">⭐ İlk Durak</span>}
            </div>
            <div>{customer.address}, {customer.district}</div>
            <div>Saat: {customer.plannedTime}</div>
            <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(customer.phone)}>{customer.phone}</a></div>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full text-center px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors">
              <Navigation className="w-4 h-4" />
              <span>Navigasyonu Başlat</span>
            </a>
          </div>
        </InfoWindow>
      )}
    </Marker>
  );
});


const FullscreenBtn: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = React.memo(({ targetRef }) => {
  const [isFs, setIsFs] = useState(false);
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await targetRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, [targetRef]);
  
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  
  return (
    <button onClick={toggleFullscreen} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">
      {isFs ? <><Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>}
    </button>
  );
});

/* ==== Ana Bileşen ==== */
const RouteMapScreen: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [selectedId, setSelectedId] = useState<string | null>(baseCustomers[0]?.id || null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ["geometry", "places"],
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    directionsService.current = new window.google.maps.DirectionsService();
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#0099CB",
        strokeWeight: 7,
      },
    });
    directionsRenderer.current.setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    if (directionsRenderer.current) directionsRenderer.current.setMap(null);
  }, []);

  const optimizeRoute = useCallback(async () => {
    if (!directionsService.current) return;
    setLoading(true);
    const allCustomers = [...baseCustomers];
    const origin = { lat: rep.lat, lng: rep.lng };
    
    const waypoints = (starredId
      ? [
          allCustomers.find((c) => c.id === starredId)!,
          ...allCustomers.filter((c) => c.id !== starredId),
        ]
      : allCustomers
    ).map((c) => ({
      location: { lat: c.lat, lng: c.lng },
      stopover: true,
    }));

    try {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination: waypoints[waypoints.length - 1].location,
        waypoints: waypoints.slice(0, waypoints.length - 1),
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      const response = await directionsService.current.route(request);
      if (response.status === "OK" && response.routes.length > 0) {
        const route = response.routes[0];
        const orderedIndexes = route.waypoint_order;
        
        const reorderedCustomers = orderedIndexes.map((index) => allCustomers[index]);
        
        if (starredId) {
          reorderedCustomers.unshift(allCustomers.find((c) => c.id === starredId)!);
        }
        setOrderedCustomers(reorderedCustomers);

        const totalDistance = route.legs.reduce((acc, leg) => acc + leg.distance!.value, 0);
        setRouteKm(totalDistance / 1000);
        directionsRenderer.current!.setDirections(response);
      } else {
        throw new Error("Rota bulunamadı");
      }
    } catch (error) {
      console.error("Rota optimizasyon hatası:", error);
      setRouteKm(null);
      if (directionsRenderer.current) directionsRenderer.current.setDirections({ routes: [] });
    } finally {
      setLoading(false);
    }
  }, [baseCustomers, starredId, rep.lat, rep.lng]);

  const highlightCustomer = (customerId: string | null) => {
    setSelectedId(customerId);
    if (customerId && mapRef.current) {
        const customer = orderedCustomers.find(c => c.id === customerId);
        if (customer) {
            mapRef.current.panTo({ lat: customer.lat, lng: customer.lng });
            mapRef.current.setZoom(14);
        }
        const row = document.getElementById(`cust-row-${customerId}`);
        if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };
  
  useEffect(() => {
    if (starredId !== null) optimizeRoute();
  }, [starredId, optimizeRoute]);

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
  }, [baseCustomers]);

  if (loadError) return <div>Harita yüklenirken bir hata oluştu.</div>;
  if (!isLoaded) return <div>Harita yükleniyor...</div>;

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" /> Rota Haritası
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
          </div>
          <button
            onClick={optimizeRoute}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-semibold ${
              loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn targetRef={mapWrapperRef} />
        </div>
      </div>

      <div ref={mapWrapperRef} className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={13}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
          options={{ disableDefaultUI: true, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, }}
        >
          <Marker
            position={{ lat: rep.lat, lng: rep.lng }}
            icon={{ url: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491", scaledSize: new window.google.maps.Size(32, 32), }}
          />

          {orderedCustomers.map((customer, index) => (
            <CustomerMarker
              key={customer.id}
              customer={customer}
              index={index}
              selectedId={selectedId}
              starredId={starredId}
              onClick={highlightCustomer}
            />
          ))}
        </GoogleMap>
        
        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${ panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]" } flex`}
          onTouchStart={(e) => onTouchStart(e)}
          onTouchEnd={(e) => onTouchEnd(e)}>
          <button onClick={() => setPanelOpen((o) => !o)} className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white" title={panelOpen ? "Paneli kapat" : "Paneli aç"}>
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
            <div className="max-h-full overflow-auto pr-1">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div key={c.id} id={`cust-row-${c.id}`} onClick={() => highlightCustomer(c.id)}
                    className={`flex items-center gap-2 p-2 rounded transition ${ selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50" }`}>
                    <span className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white ${ starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]" }`} title={`${i + 1}. müşteri`}>{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.address}, {c.district}</div>
                      <a className="text-xs text-[#0099CB] underline" href={toTelHref(c.phone)} onClick={(e) => e.stopPropagation()}>{c.phone}</a>
                    </div>
                    <button className="ml-auto p-1.5 rounded-lg hover:bg-gray-100" title={starred ? "İlk duraktan kaldır" : "İlk durak yap"}
                      onClick={(e) => { e.stopPropagation(); setStarredId(prev => prev === c.id ? null : c.id); }}>
                      {starred ? <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" /> : <StarOff className="w-5 h-5 text-gray-500" />}
                    </button>
                    <span className="text-xs text-gray-700 font-semibold">{c.plannedTime}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">Rota Hesaplanıyor…</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMapScreen;