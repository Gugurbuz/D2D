import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import {
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  Star,
  StarOff,
  Navigation,
} from "lucide-react";

/* ==== Tipler ==== */
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
  salesRepId: string; // Müşterinin hangi satış uzmanına ait olduğunu belirtir
};

export type SalesRep = {
  id: string; // Satış uzmanını benzersiz kılar
  name: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* ==== Varsayılanlar (Örnek Veri) ==== */
const defaultSalesRep: SalesRep = { id: "rep1", name: "Satış Uzmanı (Varsayılan)", lat: 40.9368, lng: 29.1553 };

const allMockCustomers: Customer[] = [
  // rep1'e atanan müşteriler
  { id: "1",  name: "Buse Aksoy",   address: "Bağdat Cd. No:120", district: "Maltepe",     plannedTime: "09:00", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000001", consumption: "270 kWh/ay",  offerHistory: ["2025-03: Dijital sözleşme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km",  lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01", salesRepId: "rep1" },
  { id: "2",  name: "Kaan Er",      address: "Alemdağ Cd. No:22", district: "Ümraniye",    plannedTime: "09:20", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000002", consumption: "300 kWh/ay",  offerHistory: ["2024-08: %10 indirim"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km",  lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02", salesRepId: "rep1" },
  { id: "3",  name: "Canan Sezer",  address: "Finans Mrk. A1",   district: "Ataşehir",    plannedTime: "09:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000003", consumption: "1400 kWh/ay", offerHistory: ["2024-09: Kurumsal teklif"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "6.2 km",  lat: 40.9923, lng: 29.1274, phone: "0555 111 22 03", salesRepId: "rep1" },
  { id: "4",  name: "Kübra Oral",   address: "İnönü Mh. No:18",   district: "Kadıköy",     plannedTime: "10:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000004", consumption: "310 kWh/ay",  offerHistory: ["2024-11: Sadakat indirimi"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.1 km",  lat: 40.9857, lng: 29.0496, phone: "0555 111 22 04", salesRepId: "rep1" },
  { id: "5",  name: "Ayça Erden",   address: "Koşuyolu Cd. 7",   district: "Kadıköy",     plannedTime: "10:20", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000005", consumption: "980 kWh/ay",  offerHistory: ["2024-10: %10 indirim"],      status: "Bekliyor", estimatedDuration: "35 dk", distance: "8.3 km",  lat: 41.0004, lng: 29.0498, phone: "0555 111 22 05", salesRepId: "rep1" },
  
  // rep2'ye (başka bir satış uzmanı) atanan müşteriler
  { id: "12", name: "Gizem Acar",   address: "İdealtepe No:11",  district: "Maltepe",     plannedTime: "12:40", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000012", consumption: "295 kWh/ay",  offerHistory: ["2025-01: Paket"],            status: "Bekliyor", estimatedDuration: "30 dk", distance: "3.0 km",  lat: 40.9497, lng: 29.1228, phone: "0555 111 22 12", salesRepId: "rep2" },
  { id: "13", name: "Seda Karaca",  address: "Başak Cd. No:2",   district: "Kartal",      plannedTime: "13:10", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000013", consumption: "300 kWh/ay",  offerHistory: ["2024-02: Kombi kampanya"],   status: "Bekliyor", estimatedDuration: "30 dk", distance: "6.2 km",  lat: 40.9127, lng: 29.2137, phone: "0555 111 22 13", salesRepId: "rep2" },
  { id: "14", name: "Tolga Kurt",   address: "Sahil Yolu No:88", district: "Kartal",      plannedTime: "13:30", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000014", consumption: "295 kWh/ay",  offerHistory: ["2024-06: Sadakat paketi"],   status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.5 km",  lat: 40.9075, lng: 29.1947, phone: "0555 111 22 14", salesRepId: "rep2" },
  { id: "15", name: "Melih Uçar",   address: "Velibaba Mh. 10",  district: "Pendik",      plannedTime: "14:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000015", consumption: "1350 kWh/ay", offerHistory: ["2024-01: Endüstriyel tarife"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "12.0 km", lat: 40.9009, lng: 29.2312, phone: "0555 111 22 15", salesRepId: "rep2" },
  { id: "16", name: "İpek Gür",     address: "Esenyalı Mh. 17",  district: "Pendik",      plannedTime: "14:30", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000016", consumption: "280 kWh/ay",  offerHistory: ["2023-12: E-devlet onay"],    status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.8 km", lat: 40.8784, lng: 29.2743, phone: "0555 111 22 16", salesRepId: "rep2" },
];

/* ==== İkonlar ==== */
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -28],
});

function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) {
  const bg = opts?.starred ? "#F5B301" : opts?.highlight ? "#FF6B00" : "#0099CB";
  const pulse = opts?.highlight ? "box-shadow:0 0 0 6px rgba(255,107,0,.15);" : "";
  return L.divIcon({
    className: "number-marker",
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${pulse}transform:${opts?.highlight ? "scale(1.14)" : "scale(1)"};">${n}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
  });
}

/* ==== Yardımcılar ==== */
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";
const toCoordStr = (lat: number, lng: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
const makeRadiusesParam = (n: number, r = 1000) => new Array(n).fill(String(r)).join(";");

/* ==== Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;

  const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([]);
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>([]);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);
  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  // ANA FİLTRELEME MANTIĞI
  useEffect(() => {
    const allCustomers = customers && customers.length ? customers : allMockCustomers;
    const filtered = allCustomers.filter(c => c.salesRepId === rep.id);
    
    setAssignedCustomers(filtered);
    setOrderedCustomers(filtered); // Rota optimize edilene kadar varsayılan sıralama
    
    // Kullanıcı değiştiğinde haritayı ve rotayı sıfırla
    setRouteCoords([]);
    setRouteKm(null);
    setSelectedId(null);
    setStarredId(null);
  }, [rep.id, customers]); // `rep.id` veya `customers` prop'u değişince bu blok yeniden çalışır

  async function osrmTrip(coords: string, pointCount: number) {
    const radiuses = makeRadiusesParam(pointCount, 1000);
    const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=last&roundtrip=false&overview=full&geometries=geojson&radiuses=${radiuses}`;
    const res = await fetch(encodeURI(url));
    const data = await res.json();
    if (data.code !== "Ok" || !data.trips?.[0]) throw new Error(`Trip not found: ${data.code}`);
    return data;
  }

  async function osrmRoute(from: LatLng, to: LatLng) {
    const coords = `${toCoordStr(from[0], from[1])};${toCoordStr(to[0], to[1])}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(encodeURI(url));
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("Route not found");
    return data;
  }

  const handleOptimize = async () => {
    if (assignedCustomers.length === 0) return;
    try {
      setLoading(true);
      const customersToOptimize = assignedCustomers;

      if (!starredId) {
        const tripPoints = [
          { kind: "rep" as const, lat: rep.lat, lng: rep.lng },
          ...customersToOptimize.map((c) => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
        ];
        const coords = tripPoints.map((p) => toCoordStr(p.lat, p.lng)).join(";");
        const data = await osrmTrip(coords, tripPoints.length);
        const orderedByTrip = data.waypoints.map((wp: any) => tripPoints[wp.waypoint_index]).slice(1);
        const sortedCustomers = orderedByTrip.map((p: any) => p.ref as Customer);
        setOrderedCustomers(sortedCustomers);
        const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
        setRouteCoords(latlngs);
        setRouteKm(data.trips[0].distance / 1000);
        if (sortedCustomers[0]) setSelectedId(sortedCustomers[0].id);
      } else {
        const star = customersToOptimize.find((c) => c.id === starredId)!;
        const others = customersToOptimize.filter((c) => c.id !== starredId);
        const dataRoute = await osrmRoute([rep.lat, rep.lng], [star.lat, star.lng]);
        const route1Coords: LatLng[] = dataRoute.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
        let combinedCoords: LatLng[] = route1Coords;
        let combinedKm = dataRoute.routes[0].distance / 1000;
        let sortedCustomers = [star];

        if (others.length > 0) {
          const tripSeed = [{ lat: star.lat, lng: star.lng }, ...others.map((c) => ({ lat: c.lat, lng: c.lng, ref: c }))];
          const coords2 = tripSeed.map((p) => toCoordStr(p.lat, p.lng)).join(";");
          const dataTrip2 = await osrmTrip(coords2, tripSeed.length);
          const ordered2 = dataTrip2.waypoints.map((wp: any) => tripSeed[wp.waypoint_index]).slice(1);
          sortedCustomers = [star, ...ordered2.map((p: any) => p.ref as Customer)];
          const restCoords: LatLng[] = dataTrip2.trips[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
          combinedCoords = route1Coords.concat(restCoords.slice(1));
          combinedKm += dataTrip2.trips[0].distance / 1000;
        }
        setOrderedCustomers(sortedCustomers);
        setRouteCoords(combinedCoords);
        setRouteKm(combinedKm);
      }
    } catch (e) {
      console.error("Rota optimizasyonu hatası:", e);
      alert("Rota optimizasyon servisinde bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId, assignedCustomers]); // assignedCustomers değiştiğinde de optimizasyonu tetikle

  const center: LatLng = [rep.lat, rep.lng];

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          Rota Haritası ({orderedCustomers.length} Ziyaret)
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
          </div>
          <button onClick={handleOptimize} disabled={loading} className={`px-4 py-2 rounded-lg font-semibold ${loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"}`}>
            {loading ? "Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn />
        </div>
      </div>

      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)} className="z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b><br/>Başlangıç Noktası</Popup>
          </Marker>

          {orderedCustomers.map((c, i) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })} zIndexOffset={1000 - i} ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }} eventHandlers={{ click: () => setSelectedId(c.id) }}>
              <Popup>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <b>{i + 1}. {c.name}</b>
                    <button onClick={(e) => { e.stopPropagation(); setStarredId(prev => (prev === c.id ? null : c.id)); }} className="p-1 rounded hover:bg-gray-100">
                      <Star className={`w-4 h-4 ${starredId === c.id ? "text-[#F5B301] fill-[#F5B301]" : "text-gray-400"}`} />
                    </button>
                  </div>
                  <div>{c.address}, {c.district}</div>
                  <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>{c.phone}</a></div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-green-500 text-white font-semibold">
                    <Navigation className="w-4 h-4" /> Navigasyonu Başlat
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />}
        </MapContainer>

        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"} flex`}>
          <button onClick={() => setPanelOpen(o => !o)} className="w-6 bg-[#0099CB] hover:bg-[#007DA1] flex items-center justify-center text-white">
            {panelOpen ? <Minimize2 className="w-4 h-4 rotate-90" /> : <Maximize2 className="w-4 h-4 rotate-90" />}
          </button>
          <div className="bg-white/90 backdrop-blur-sm rounded-l-xl shadow-md px-4 py-4 flex flex-col gap-3 min-w-[320px] max-w-[21.6rem] h-full">
            <div className="font-semibold text-gray-700 text-base">Ziyaret Sırası</div>
            <div className="text-[11px] text-gray-600">⭐ Bir müşteriyi yıldızlayarak rotayı o müşteriden başlatabilirsiniz.</div>
            <SimpleBar style={{ maxHeight: "calc(100% - 4rem)" }}>
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div key={c.id} id={`cust-row-${c.id}`} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"}`} onClick={() => { setSelectedId(c.id); if (mapRef.current) mapRef.current.setView([c.lat, c.lng], 15, { animate: true }); }}>
                    <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center font-bold rounded-full text-white ${starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.address}, {c.district}</div>
                    </div>
                    <button className="ml-auto p-1.5 rounded-lg hover:bg-gray-200" onClick={(e) => { e.stopPropagation(); setStarredId(prev => (prev === c.id ? null : c.id)); }}>
                      {starred ? <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" /> : <StarOff className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                );
              })}
            </SimpleBar>
          </div>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="rounded-lg bg-white shadow-lg px-5 py-3 text-sm font-semibold text-gray-700">Rota Hesaplanıyor…</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Tam ekran butonu ----
const FullscreenBtn: React.FC = () => {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  return (
    <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">
      {isFs ? <><Minimize2 className="w-4 h-4" /> Küçült</> : <><Maximize2 className="w-4 h-4" /> Büyüt</>}
    </button>
  );
};

export default RouteMap;