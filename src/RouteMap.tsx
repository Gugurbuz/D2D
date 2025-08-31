import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, Route as RouteIcon, Star, StarOff } from "lucide-react";

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
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers?: Customer[];    // verilmezse aşağıdaki Anadolu listesi kullanılır
  salesRep?: SalesRep;       // verilmezse Maltepe merkezli default değer kullanılır
}

/* ==== Varsayılanlar (Anadolu Yakası – 22 müşteri) ==== */
const defaultSalesRep: SalesRep = {
  name: "Satış Uzmanı",
  lat: 40.9368, // Maltepe merkez
  lng: 29.1553,
};

const anadoluCustomers: Customer[] = [
  { id: "1",  name: "Buse Aksoy",    address: "Bağdat Cd.  No:120", district: "Maltepe",    plannedTime: "09:00", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000001", consumption: "270 kWh/ay",  offerHistory: ["2025-03: Dijital sözleşme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km",  lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01" },
  { id: "2",  name: "Kaan Er",       address: "Alemdağ Cd. No:22",  district: "Ümraniye",  plannedTime: "09:20", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000002", consumption: "300 kWh/ay",  offerHistory: ["2024-08: %10 indirim"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km",  lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02" },
  { id: "3",  name: "Canan Sezer",   address: "Finans Mrk. A1",     district: "Ataşehir",  plannedTime: "09:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000003", consumption: "1400 kWh/ay", offerHistory: ["2024-09: Kurumsal teklif"],  status: "Bekliyor", estimatedDuration: "50 dk", distance: "6.2 km",  lat: 40.9923, lng: 29.1274, phone: "0555 111 22 03" },
  { id: "4",  name: "Kübra Oral",    address: "İnönü Mh. No:18",    district: "Kadıköy",   plannedTime: "10:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000004", consumption: "310 kWh/ay",  offerHistory: ["2024-11: Sadakat indirimi"],  status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.1 km",  lat: 40.9857, lng: 29.0496, phone: "0555 111 22 04" },
  { id: "5",  name: "Ayça Erden",    address: "Koşuyolu Cd. 7",     district: "Kadıköy",   plannedTime: "10:20", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000005", consumption: "980 kWh/ay",  offerHistory: ["2024-10: %10 indirim"],       status: "Bekliyor", estimatedDuration: "35 dk", distance: "8.3 km",  lat: 41.0004, lng: 29.0498, phone: "0555 111 22 05" },
  { id: "6",  name: "Meral Kılıç",   address: "Çengelköy Sahil",    district: "Üsküdar",  plannedTime: "10:40", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000006", consumption: "260 kWh/ay",  offerHistory: ["2024-03: Hoş geldin"],        status: "Bekliyor", estimatedDuration: "25 dk", distance: "12.1 km", lat: 41.0573, lng: 29.0557, phone: "0555 111 22 06" },
  { id: "7",  name: "Tuğçe Polat",   address: "Kısıklı Cd. 15",     district: "Üsküdar",  plannedTime: "11:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000007", consumption: "290 kWh/ay",  offerHistory: ["2024-12: Sadakat"],           status: "Bekliyor", estimatedDuration: "25 dk", distance: "10.8 km", lat: 41.0333, lng: 29.0672, phone: "0555 111 22 07" },
  { id: "8",  name: "Selim Yurt",    address: "Atatürk Cd. No:5",   district: "Sancaktepe", plannedTime: "11:20", priority: "Orta",  tariff: "Mesken",  meterNumber: "210000008", consumption: "320 kWh/ay",  offerHistory: ["2025-03: Yeni teklif"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.2 km", lat: 41.0152, lng: 29.2316, phone: "0555 111 22 08" },
  { id: "9",  name: "Zeynep Koç",    address: "Sarıgazi Mh. 23",    district: "Sancaktepe", plannedTime: "11:40", priority: "Yüksek",tariff: "İş Yeri", meterNumber: "210000009", consumption: "1120 kWh/ay",offerHistory: ["2024-08: Turizm indirimi"],   status: "Bekliyor", estimatedDuration: "45 dk", distance: "16.1 km", lat: 41.0074, lng: 29.2447, phone: "0555 111 22 09" },
  { id: "10", name: "Yasin Ateş",    address: "Şerifali Mh. 4",     district: "Ümraniye",  plannedTime: "12:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000010", consumption: "310 kWh/ay",  offerHistory: ["2024-07: Sadakat"],           status: "Bekliyor", estimatedDuration: "30 dk", distance: "11.1 km", lat: 41.0179, lng: 29.1376, phone: "0555 111 22 10" },
  { id: "11", name: "Derya Kılıç",   address: "Küçükyalı Sahil",    district: "Maltepe",   plannedTime: "12:20", priority: "Düşük",  tariff: "İş Yeri", meterNumber: "210000011", consumption: "900 kWh/ay",  offerHistory: ["2024-04: AVM tarifesi"],      status: "Bekliyor", estimatedDuration: "35 dk", distance: "2.2 km",  lat: 40.9488, lng: 29.1444, phone: "0555 111 22 11" },
  { id: "12", name: "Gizem Acar",    address: "İdealtepe No:11",    district: "Maltepe",   plannedTime: "12:40", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000012", consumption: "295 kWh/ay",  offerHistory: ["2025-01: Paket"],             status: "Bekliyor", estimatedDuration: "30 dk", distance: "3.0 km",  lat: 40.9497, lng: 29.1228, phone: "0555 111 22 12" },
  { id: "13", name: "Seda Karaca",   address: "Başak Cd. No:2",     district: "Kartal",    plannedTime: "13:10", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000013", consumption: "300 kWh/ay",  offerHistory: ["2024-02: Kombi kampanya"],    status: "Bekliyor", estimatedDuration: "30 dk", distance: "6.2 km",  lat: 40.9127, lng: 29.2137, phone: "0555 111 22 13" },
  { id: "14", name: "Tolga Kurt",    address: "Sahil Yolu No:88",   district: "Kartal",    plannedTime: "13:30", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000014", consumption: "295 kWh/ay",  offerHistory: ["2024-06: Sadakat paketi"],    status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.5 km",  lat: 40.9075, lng: 29.1947, phone: "0555 111 22 14" },
  { id: "15", name: "Melih Uçar",    address: "Velibaba Mh. 10",    district: "Pendik",    plannedTime: "14:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000015", consumption: "1350 kWh/ay", offerHistory: ["2024-01: Endüstriyel tarife"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "12.0 km", lat: 40.9009, lng: 29.2312, phone: "0555 111 22 15" },
  { id: "16", name: "İpek Gür",      address: "Esenyalı Mh. 17",    district: "Pendik",    plannedTime: "14:30", priority: "Düşük",  tariff: "Mesken",  meterNumber: "210000016", consumption: "280 kWh/ay",  offerHistory: ["2023-12: E-devlet onay"],     status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.8 km", lat: 40.8784, lng: 29.2743, phone: "0555 111 22 16" },
  { id: "17", name: "Kerem Efe",     address: "Barbaros Mh. 5",     district: "Tuzla",     plannedTime: "15:00", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000017", consumption: "310 kWh/ay",  offerHistory: ["2023-11: Online randevu"],    status: "Bekliyor", estimatedDuration: "30 dk", distance: "19.2 km", lat: 40.8380, lng: 29.3033, phone: "0555 111 22 17" },
  { id: "18", name: "Naz Acar",      address: "İstasyon Mh. 3",     district: "Tuzla",     plannedTime: "15:30", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000018", consumption: "920 kWh/ay",  offerHistory: ["2023-10: Ticari sabit"],      status: "Bekliyor", estimatedDuration: "40 dk", distance: "21.0 km", lat: 40.8228, lng: 29.3345, phone: "0555 111 22 18" },
  { id: "19", name: "Mina Eren",     address: "Acarlar Mh. 2",      district: "Beykoz",    plannedTime: "16:00", priority: "Yüksek", tariff: "Mesken",  meterNumber: "210000019", consumption: "290 kWh/ay",  offerHistory: ["2025-02: Özel teklif"],       status: "Bekliyor", estimatedDuration: "30 dk", distance: "24.2 km", lat: 41.1459, lng: 29.1111, phone: "0555 111 22 19" },
  { id: "20", name: "Efe Çınar",     address: "Şahinbey Cd. 9",     district: "Sultanbeyli", plannedTime: "16:30", priority: "Orta", tariff: "Mesken", meterNumber: "210000020", consumption: "300 kWh/ay",  offerHistory: ["2024-05: %8 indirim"],       status: "Bekliyor", estimatedDuration: "25 dk", distance: "16.8 km", lat: 40.9677, lng: 29.2622, phone: "0555 111 22 20" },
  { id: "21", name: "Elif Aydın",    address: "Merkez Mh. 1",       district: "Çekmeköy",  plannedTime: "17:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000021", consumption: "1120 kWh/ay", offerHistory: ["2024-08: Esnek paket"],     status: "Bekliyor", estimatedDuration: "45 dk", distance: "18.1 km", lat: 41.0546, lng: 29.2013, phone: "0555 111 22 21" },
  { id: "22", name: "Onur Demirel",  address: "Çamlık Mh. 6",       district: "Çekmeköy",  plannedTime: "17:30", priority: "Orta",   tariff: "Mesken",  meterNumber: "210000022", consumption: "330 kWh/ay",  offerHistory: ["2024-05: Otomatik ödeme"],    status: "Bekliyor", estimatedDuration: "25 dk", distance: "19.0 km", lat: 41.0466, lng: 29.2233, phone: "0555 111 22 22" },
];

/* ==== İkonlar ==== */
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

function numberIcon(n: number, highlight = false) {
  return L.divIcon({
    className: "number-marker",
    html: `
      <div style="
        width:28px;height:28px;display:flex;align-items:center;justify-content:center;
        font-weight:800;font-size:12px;color:#fff;line-height:1;
        background:${highlight ? "#FF6B00" : "#0099CB"};
        border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);
        transform:${highlight ? "scale(1.14)" : "scale(1)"};
      ">
        ${n}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

/* ==== Yardımcılar ==== */
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/* ==== Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null); // ⭐ ilk durak

  // Sağ panel (swipe ile aç/kapa; kulakçık var)
  const [panelOpen, setPanelOpen] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);   // sağa kaydır → aç
    if (dx < -50) setPanelOpen(false); // sola kaydır → kapat
    touchStartX.current = null;
  };

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  // Fullscreen
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFullscreen = async () => {
    const el = wrapperRef.current; if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen();
    else await document.exitFullscreen();
  };

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  // Marker/list karşılıklı vurgu
  const highlightCustomer = (c: Customer, i: number, pan = true) => {
    setSelectedId(c.id);
    const m
