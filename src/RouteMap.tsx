// src/RouteMap.tsx

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
};

export type SalesRep = {
  name: string;
  // DEĞİŞİKLİK: Temsilcinin bölgesini belirlemek için district alanı eklendi.
  district: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* ==== Varsayılanlar ==== */
// DEĞİŞİKLİK: Varsayılan temsilciye bir bölge atandı.
const defaultSalesRep: SalesRep = { name: "Satış Uzmanı", district: "Maltepe", lat: 40.9368, lng: 29.1553 };
const anadoluCustomers: Customer[] = [
  // ... müşteri listesi aynı kalıyor, değişiklik yok ...
  { id: "1",  name: "Buse Aksoy",    address: "Bağdat Cd. No:120", district: "Maltepe",     plannedTime: "09:00", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000001", consumption: "270 kWh/ay",  offerHistory: ["2025-03: Dijital sözleşme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km",  lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01" },
  { id: "2",  name: "Kaan Er",       address: "Alemdağ Cd. No:22", district: "Ümraniye",    plannedTime: "09:20", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000002", consumption: "300 kWh/ay",  offerHistory: ["2024-08: %10 indirim"],      status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km",  lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02" },
  { id: "3",  name: "Canan Sezer",   address: "Finans Mrk. A1",    district: "Ataşehir",    plannedTime: "09:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000003", consumption: "1400 kWh/ay", offerHistory: ["2024-09: Kurumsal teklif"],  status: "Bekliyor", estimatedDuration: "50 dk", distance: "6.2 km",  lat: 40.9923, lng: 29.1274, phone: "0555 111 22 03" },
  { id: "4",  name: "Kübra Oral",    address: "İnönü Mh. No:18",    district: "Kadıköy",     plannedTime: "10:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000004", consumption: "310 kWh/ay",  offerHistory: ["2024-11: Sadakat indirimi"],  status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.1 km",  lat: 40.9857, lng: 29.0496, phone: "0555 111 22 04" },
  { id: "5",  name: "Ayça Erden",    address: "Koşuyolu Cd. 7",    district: "Kadıköy",     plannedTime: "10:20", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000005", consumption: "980 kWh/ay",  offerHistory: ["2024-10: %10 indirim"],      status: "Bekliyor", estimatedDuration: "35 dk", distance: "8.3 km",  lat: 41.0004, lng: 29.0498, phone: "0555 111 22 05" },
  { id: "6",  name: "Meral Kılıç",   address: "Çengelköy Sahil",   district: "Üsküdar",     plannedTime: "10:40", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000006", consumption: "260 kWh/ay",  offerHistory: ["2024-03: Hoş geldin"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "12.1 km", lat: 41.0573, lng: 29.0557, phone: "0555 111 22 06" },
  { id: "7",  name: "Tuğçe Polat",   address: "Kısıklı Cd. 15",    district: "Üsküdar",     plannedTime: "11:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000007", consumption: "290 kWh/ay",  offerHistory: ["2024-12: Sadakat"],          status: "Bekliyor", estimatedDuration: "25 dk", distance: "10.8 km", lat: 41.0333, lng: 29.0672, phone: "0555 111 22 07" },
  { id: "8",  name: "Selim Yurt",    address: "Atatürk Cd. No:5",  district: "Sancaktepe",  plannedTime: "11:20", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000008", consumption: "320 kWh/ay",  offerHistory: ["2025-03: Yeni teklif"],      status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.2 km", lat: 41.0152, lng: 29.2316, phone: "0555 111 22 08" },
  { id: "9",  name: "Zeynep Koç",    address: "Sarıgazi Mh. 23",   district: "Sancaktepe",  plannedTime: "11:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000009", consumption: "1120 kWh/ay", offerHistory: ["2024-08: Turizm indirimi"],  status: "Bekliyor", estimatedDuration: "45 dk", distance: "16.1 km", lat: 41.0074, lng: 29.2447, phone: "0555 111 22 09" },
  { id: "10", name: "Yasin Ateş",    address: "Şerifali Mh. 4",    district: "Ümraniye",    plannedTime: "12:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000010", consumption: "310 kWh/ay",  offerHistory: ["2024-07: Sadakat"],          status: "Bekliyor", estimatedDuration: "30 dk", distance: "11.1 km", lat: 41.0179, lng: 29.1376, phone: "0555 111 22 10" },
  { id: "11", name: "Derya Kılıç",   address: "Küçükyalı Sahil",   district: "Maltepe",     plannedTime: "12:20", priority: "Düşük",  tariff: "İş Yeri", meterNumber: "210000011", consumption: "900 kWh/ay",  offerHistory: ["2024-04: AVM tarifesi"],     status: "Bekliyor", estimatedDuration: "35 dk", distance: "2.2 km",  lat: 40.9488, lng: 29.1444, phone: "0555 111 22 11" },
  { id: "12", name: "Gizem Acar",    address: "İdealtepe No:11",   district: "Maltepe",     plannedTime: "12:40", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000012", consumption: "295 kWh/ay",  offerHistory: ["2025-01: Paket"],            status: "Bekliyor", estimatedDuration: "30 dk", distance: "3.0 km",  lat: 40.9497, lng: 29.1228, phone: "0555 111 22 12" },
  { id: "13", name: "Seda Karaca",   address: "Başak Cd. No:2",    district: "Kartal",      plannedTime: "13:10", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000013", consumption: "300 kWh/ay",  offerHistory: ["2024-02: Kombi kampanya"],  status: "Bekliyor", estimatedDuration: "30 dk", distance: "6.2 km",  lat: 40.9127, lng: 29.2137, phone: "0555 111 22 13" },
  { id: "14", name: "Tolga Kurt",    address: "Sahil Yolu No:88",  district: "Kartal",      plannedTime: "13:30", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000014", consumption: "295 kWh/ay",  offerHistory: ["2024-06: Sadakat paketi"],   status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.5 km",  lat: 40.9075, lng: 29.1947, phone: "0555 111 22 14" },
  { id: "15", name: "Melih Uçar",    address: "Velibaba Mh. 10",   district: "Pendik",      plannedTime: "14:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000015", consumption: "1350 kWh/ay", offerHistory: ["2024-01: Endüstriyel tarife"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "12.0 km", lat: 40.9009, lng: 29.2312, phone: "0555 111 22 15" },
  { id: "16", name: "İpek Gür",      address: "Esenyalı Mh. 17",   district: "Pendik",      plannedTime: "14:30", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000016", consumption: "280 kWh/ay",  offerHistory: ["2023-12: E-devlet onay"],    status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.8 km", lat: 40.8784, lng: 29.2743, phone: "0555 111 22 16" },
  { id: "17", name: "Kerem Efe",     address: "Barbaros Mh. 5",    district: "Tuzla",       plannedTime: "15:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000017", consumption: "310 kWh/ay",  offerHistory: ["2023-11: Online randevu"],   status: "Bekliyor", estimatedDuration: "30 dk", distance: "19.2 km", lat: 40.8380, lng: 29.3033, phone: "0555 111 22 17" },
  { id: "18", name: "Naz Acar",      address: "İstasyon Mh. 3",    district: "Tuzla",       plannedTime: "15:30", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000018", consumption: "920 kWh/ay",  offerHistory: ["2023-10: Ticari sabit"],     status: "Bekliyor", estimatedDuration: "40 dk", distance: "21.0 km", lat: 40.8228, lng: 29.3345, phone:  "0555 111 22 18" },
  { id: "19", name: "Mina Eren",     address: "Acarlar Mh. 2",     district: "Beykoz",      plannedTime: "16:00", priority: "Yüksek", tariff: "Mesken",  meterNumber: "210000019", consumption: "290 kWh/ay",  offerHistory: ["2025-02: Özel teklif"],      status: "Bekliyor", estimatedDuration: "30 dk", distance: "24.2 km", lat: 41.1459, lng: 29.1111, phone: "0555 111 22 19" },
  { id: "20", name: "Efe Çınar",     address: "Şahinbey Cd. 9",    district: "Sultanbeyli", plannedTime: "16:30", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000020", consumption: "300 kWh/ay",  offerHistory: ["2024-05: %8 indirim"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "16.8 km", lat: 40.9677, lng: 29.2622, phone: "0555 111 22 20" },
  { id: "21", name: "Elif Aydın",    address: "Merkez Mh. 1",      district: "Çekmeköy",    plannedTime: "17:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000021", consumption: "1120 kWh/ay", offerHistory: ["2024-08: Esnek paket"],     status: "Bekliyor", estimatedDuration: "45 dk", distance: "18.1 km", lat: 41.0546, lng: 29.2013, phone: "0555 111 22 21" },
  { id: "22", name: "Onur Demirel",  address: "Çamlık Mh. 6",      district: "Çekmeköy",    plannedTime: "17:30", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000022", consumption: "330 kWh/ay",  offerHistory: ["2024-05: Otomatik ödeme"],   status: "Bekliyor", estimatedDuration: "25 dk", distance: "19.0 km", lat: 41.0466, lng: 29.2233, phone: "0555 111 22 22" },
];

/* ==== İkonlar ==== */
// ... ikon tanımlamaları aynı kalıyor, değişiklik yok ...
const repIcon = new L.Icon({ iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -28], });
function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) { const highlight = !!opts?.highlight; const starred = !!opts?.starred; const bg = starred ? "#F5B301" : highlight ? "#FF6B00" : "#0099CB"; const pulse = highlight ? "box-shadow:0 0 0 6px rgba(255,107,0,.15);" : ""; return L.divIcon({ className: "number-marker", html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;line-height:1;background:${bg};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${pulse}transform:${highlight ? "scale(1.14)" : "scale(1)"};">${n}</div>`, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28], }); }

/* ==== Yardımcılar ==== */
// ... yardımcı fonksiyonlar aynı kalıyor, değişiklik yok ...
function haversineKm(a: LatLng, b: LatLng) { const R = 6371; const dLat = ((b[0] - a[0]) * Math.PI) / 180; const dLng = ((b[1] - a[1]) * Math.PI) / 180; const lat1 = (a[0] * Math.PI) / 180; const lat2 = (b[0] * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const fmtKm = (km: number | null) => km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/* ==== Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const allCustomers = customers && customers.length ? customers : anadoluCustomers;

  // YENİ EKLENDİ: Müşterileri satış temsilcisinin bölgesine (district) göre filtrele.
  const assignedCustomers = allCustomers.filter(
    (customer) => customer.district === rep.district
  );

  // DEĞİŞİKLİK: State'i filtrelenmiş müşteri listesiyle başlat.
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(assignedCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  // ... diğer state ve ref'ler aynı kalıyor ...
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => { if (touchStartX.current == null) return; const dx = e.changedTouches[0].clientX - touchStartX.current; if (dx > 50) setPanelOpen(true); if (dx < -50) setPanelOpen(false); touchStartX.current = null; };
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);
  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
  const highlightCustomer = (c: Customer, i: number, pan = true) => { setSelectedId(c.id); const m = markerRefs.current[c.id]; if (pan && mapRef.current) { mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true }); } if (m) m.openPopup(); const row = document.getElementById(`cust-row-${c.id}`); if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" }); };

  // ... osrmTrip ve osrmRoute fonksiyonları aynı kalıyor ...
 async function osrmTrip(coords: string) { const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found"); return data; }
 async function osrmRoute(from: LatLng, to: LatLng) { const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`; const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`; const res = await fetch(url); if (!res.ok) throw new Error(`OSRM route error: ${res.status}`); const data = await res.json(); if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("Route not found"); return data; }

  const handleOptimize = async () => {
    try {
      setLoading(true);
      // DEĞİŞİKLİK: Optimizasyon için `baseCustomers` yerine `assignedCustomers` kullan.
      if (!starredId) {
        const tripPoints = [
          { kind: "rep" as const, lat: rep.lat, lng: rep.lng },
          ...assignedCustomers.map(c => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
        ];
        const coords = tripPoints.map(p => `${p.lng},${p.lat}`).join(";");
        const data = await osrmTrip(coords);
        const orderedByTrip = data.waypoints
          .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
          .sort((a: any, b: any) => a.order - b.order)
          .map((x: any) => tripPoints[x.inputIdx]);
        const sortedCustomers = orderedByTrip.filter(p => p.kind === "cust").map(p => (p as any).ref as Customer);
        setOrderedCustomers(sortedCustomers);
        const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        setRouteCoords(latlngs);
        setRouteKm((data.trips[0].distance as number) / 1000);
        if (sortedCustomers[0]) highlightCustomer(sortedCustomers[0], 0, true);
      } else {
        // DEĞİŞİKLİK: Yıldızlı müşteri optimizasyonu için de `assignedCustomers` kullan.
        const star = assignedCustomers.find(c => c.id === starredId)!;
        const others = assignedCustomers.filter(c => c.id !== starredId);
        const dataRoute = await osrmRoute([rep.lat, rep.lng], [star.lat, star.lng]);
        const route1 = dataRoute.routes[0];
        const route1Coords: LatLng[] = route1.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const route1Km = (route1.distance as number) / 1000;
        const tripSeed = [{ lat: star.lat, lng: star.lng }, ...others.map(c => ({ lat: c.lat, lng: c.lng, ref: c }))];
        const coords2 = tripSeed.map((p) => `${p.lng},${p.lat}`).join(";");
        const dataTrip2 = await osrmTrip(coords2);
        const ordered2 = dataTrip2.waypoints
          .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
          .sort((a: any, b: any) => a.order - b.order)
          .map((x: any) => tripSeed[x.inputIdx]);
        const sortedCustomers = ordered2.map((p: any, idx: number) =>
          idx === 0 ? star : (p.ref as Customer)
        );
        setOrderedCustomers(sortedCustomers);
        const restCoords: LatLng[] = dataTrip2.trips[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const merged: LatLng[] = route1Coords.concat(restCoords.slice(1));
        setRouteCoords(merged);
        setRouteKm(route1Km + (dataTrip2.trips[0].distance as number) / 1000);
        highlightCustomer(star, 0, true);
      }
    } catch (e) {
      console.error(e);
      // DEĞİŞİKLİK: Hata durumunda rota çizimi için de filtrelenmiş listeyi kullan.
      const seq: LatLng[] = (() => {
        const startList = starredId
          ? [assignedCustomers.find(c => c.id === starredId)!, ...assignedCustomers.filter(c => c.id !== starredId)]
          : assignedCustomers;
        return [[rep.lat, rep.lng] as LatLng].concat(startList.map(c => [c.lat, c.lng] as LatLng));
      })();
      setRouteCoords(seq);
      let acc = 0; for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (starredId !== null) {
      handleOptimize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId]);

  // DEĞİŞİKLİK: Prop'lardan gelen veri değiştiğinde listeyi güncellemek için `assignedCustomers`'ı izle.
  useEffect(() => {
    setOrderedCustomers(assignedCustomers);
  }, [assignedCustomers]);

  const center: LatLng = [rep.lat, rep.lng];
  return (
    <div className="relative w-full">
      {/* ... JSX yapısının geri kalanı (harita, panel vb.) aynı kalıyor ... */}
      {/* Bu kısımda bir değişiklik yapmaya gerek yok, çünkü tüm render işlemleri */}
      {/* `orderedCustomers` state'i üzerinden yapılıyor ve bu state'i zaten */}
      {/* en başta filtrelenmiş veriyle doldurduk. */}
      <div className="mb-3 flex items-center justify-between"> <div className="flex items-center gap-2 text-gray-900 font-semibold"> <RouteIcon className="w-5 h-5 text-[#0099CB]" /> Rota Haritası </div> <div className="flex items-center gap-3"> <div className="text-sm text-gray-700"> Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b> </div> <button onClick={handleOptimize} disabled={loading} className={`px-4 py-2 rounded-lg font-semibold ${ loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90" }`} > {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"} </button> <FullscreenBtn /> </div> </div> <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl"> <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)} className="z-0" > <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" /> <Marker position={[rep.lat, rep.lng]} icon={repIcon}> <Popup><b>{rep.name}</b></Popup> </Marker> {/* Müşteriler (numaralı ikon + tel) */} {orderedCustomers.map((c, i) => ( <Marker key={c.id} position={[c.lat, c.lng]} icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })} zIndexOffset={1000 - i} ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }} eventHandlers={{ click: () => { setSelectedId(c.id); const m = markerRefs.current[c.id]; if (m) m.openPopup(); }}} > <Popup> <div className="space-y-1"> <div className="flex items-center gap-2"> <b>{i + 1}. {c.name}</b> <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStarredId(prev => (prev === c.id ? null : c.id)); }} aria-label={starredId === c.id ? "Yıldızı kaldır" : "Yıldızla"} className="p-1 rounded hover:bg-gray-100" > <Star className={`w-4 h-4 ${starredId === c.id ? "text-[#F5B301] fill-[#F5B301]" : "text-gray-400"}`} /> </button> </div> <div>{c.address}, {c.district}</div> <div>Saat: {c.plannedTime}</div> <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>{c.phone}</a></div> {/* ==== Navigasyon butonu ==== */} <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full text-center px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors" > <Navigation className="w-4 h-4" /> <span>Navigasyonu Başlat</span> </a> </div> </Popup> </Marker> ))} {routeCoords.length > 0 && ( <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} /> )} </MapContainer> {/* ... sağ panel aynı kalıyor, değişiklik yok ... */} <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${ panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]" } flex`} onTouchStart={(e)=>{ onTouchStart(e); }} onTouchEnd={(e)=>{ onTouchEnd(e); }} > <button onClick={() => setPanelOpen((o) => !o)} className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white" title={panelOpen ? "Paneli kapat" : "Paneli aç"} > {panelOpen ? ( <Minimize2 className="w-4 h-4 -rotate-90" /> ) : ( <div className="flex flex-col items-center"> <span className="rotate-90 text-[10px] font-bold tracking-wider">ZİYARET</span> <Minimize2 className="w-4 h-4 rotate-90" /> </div> )} </button> <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[270px] max-w-[21.6rem] h-full"> <div className="flex items-center gap-2"> <RouteIcon className="w-5 h-5 text-[#0099CB]" /> <span className="font-semibold text-gray-700 text-base select-none"> Ziyaret Sırası </span> </div> <div className="text-[11px] text-gray-600"> ⭐ Bir müşteriyi yıldızlarsan rota önce o müşteriye gider; kalan duraklar en kısa şekilde planlanır. Yıldızı değiştirince rota otomatik güncellenir. </div> <div className="max-h-full overflow-auto pr-1"> {orderedCustomers.map((c, i) => { const selected = selectedId === c.id; const starred = starredId === c.id; return ( <div key={c.id} id={`cust-row-${c.id}`} className={`flex items-center gap-2 p-2 rounded transition ${ selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50" }`} onClick={() => { setSelectedId(c.id); if (mapRef.current) { mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true }); } const m = markerRefs.current[c.id]; if (m) m.openPopup(); }} > <span className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white ${ starred ? "bg-[#F5B301]" : selected ? "bg-[#FF6B00]" : "bg-[#0099CB]" }`} title={`${i + 1}. müşteri`} > {i + 1} </span> <div className="min-w-0"> <div className="font-medium text-gray-900 truncate">{c.name}</div> <div className="text-xs text-gray-500 truncate">{c.address}, {c.district}</div> <a className="text-xs text-[#0099CB] underline" href={toTelHref(c.phone)} onClick={(e)=>e.stopPropagation()}> {c.phone} </a> </div> <button className="ml-auto p-1.5 rounded-lg hover:bg-gray-100" title={starred ? "İlk duraktan kaldır" : "İlk durak yap"} onClick={(e) => { e.stopPropagation(); setStarredId(prev => prev === c.id ? null : c.id); }} > {starred ? <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" /> : <StarOff className="w-5 h-5 text-gray-500" /> } </button> <span className="text-xs text-gray-700 font-semibold">{c.plannedTime}</span> </div> ); })} </div> </div> </div> {loading && ( <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10"> <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700"> Rota Hesaplanıyor… </div> </div> )} </div> </div>
  );
};

// ... FullscreenBtn bileşeni aynı kalıyor, değişiklik yok ...
const FullscreenBtn: React.FC = () => { const [isFs, setIsFs] = useState(false); useEffect(() => { const h = () => setIsFs(!!document.fullscreenElement); document.addEventListener("fullscreenchange", h); return () => document.removeEventListener("fullscreenchange", h); }, []); return ( <button onClick={async () => { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2" > {isFs ? <><Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>} </button> ); };

export default RouteMap;