// src/RouteMap.tsx (Google Maps entegrasyonlu ve performans odaklı versiyon)

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker, Polyline } from "@react-google-maps/api";
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
const anadoluCustomers: Customer[] = [ /* ... müşteri verisi aynı ... */ ];

/* ==== Yardımcılar ==== */
const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
const containerStyle = { width: "100%", height: "100%" };
const defaultCenter: LatLngLiteral = { lat: defaultSalesRep.lat, lng: defaultSalesRep.lng };

// ==================================================================
// ===== Yeni Yapı: Markerlar ve Popup'lar Google Maps'e Uyarlandı =====
// ==================================================================

// 1. Adım: Popup içeriğini Google Maps'e göre düzenleme (artık ayrı bir bileşen değil, doğrudan Popup içinde)
// Google Maps'te özel Popup içeriği için `InfoWindow` kullanılır. Bu kod, direkt butona basıldığı zaman açılacağı için gerek yok.

// 2. Adım: Marker'ın kendisini Google Maps'e göre düzenleme
const CustomerMarker: React.FC<{
  customer: Customer;
  index: number;
  selectedId: string | null;
  starredId: string | null;
  onClick: (id: string) => void;
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
    />
  );
});

/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLngLiteral[]>([]);
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
 
  // Google Maps API'sini yükle, **doğru çevre değişkeni kullanımıyla**.
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
        
        // Yıldızlı müşteri varsa onu en başa koyarız
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

  const highlightCustomer = (customerId: string, pan = true) => {
    setSelectedId(customerId);
    const customer = orderedCustomers.find(c => c.id === customerId);
    if (customer && mapRef.current && pan) {
      mapRef.current.panTo({ lat: customer.lat, lng: customer.lng });
      mapRef.current.setZoom(14);
    }
    const row = document.getElementById(`cust-row-${customerId}`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

export default RouteMap;