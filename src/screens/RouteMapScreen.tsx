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
  salesRepId: string; // <-- YENİ ALAN
};

export type SalesRep = {
  id: string; // <-- YENİ ALAN
  name: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers?: Customer[];
  salesRep?: SalesRep;
}

/* ==== Varsayılanlar ==== */
const defaultSalesRep: SalesRep = { id: "rep1", name: "Satış Uzmanı (Varsayılan)", lat: 40.9368, lng: 29.1553 };

const anadoluCustomers: Customer[] = [
  // rep1'e atanan müşteriler
  { id: "1",  name: "Buse Aksoy",    address: "Bağdat Cd. No:120", district: "Maltepe",    plannedTime: "09:00", priority: "Düşük",  tariff: "Mesken", meterNumber: "210000001", consumption: "270 kWh/ay", offerHistory: ["2025-03: Dijital sözleşme"], status: "Bekliyor", estimatedDuration: "25 dk", distance: "0.9 km",  lat: 40.9359, lng: 29.1569, phone: "0555 111 22 01", salesRepId: "rep1" },
  { id: "2",  name: "Kaan Er",       address: "Alemdağ Cd. No:22", district: "Ümraniye",   plannedTime: "09:20", priority: "Orta",   tariff: "Mesken", meterNumber: "210000002", consumption: "300 kWh/ay", offerHistory: ["2024-08: %10 indirim"],     status: "Bekliyor", estimatedDuration: "25 dk", distance: "9.6 km",  lat: 41.0165, lng: 29.1248, phone: "0555 111 22 02", salesRepId: "rep1" },
  { id: "3",  name: "Canan Sezer",   address: "Finans Mrk. A1",   district: "Ataşehir",   plannedTime: "09:40", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000003", consumption: "1400 kWh/ay", offerHistory: ["2024-09: Kurumsal teklif"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "6.2 km",  lat: 40.9923, lng: 29.1274, phone: "0555 111 22 03", salesRepId: "rep1" },
  { id: "4",  name: "Kübra Oral",    address: "İnönü Mh. No:18",   district: "Kadıköy",    plannedTime: "10:00", priority: "Orta",   tariff: "Mesken", meterNumber: "210000004", consumption: "310 kWh/ay", offerHistory: ["2024-11: Sadakat indirimi"], status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.1 km",  lat: 40.9857, lng: 29.0496, phone: "0555 111 22 04", salesRepId: "rep1" },
  { id: "5",  name: "Ayça Erden",    address: "Koşuyolu Cd. 7",   district: "Kadıköy",    plannedTime: "10:20", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000005", consumption: "980 kWh/ay",  offerHistory: ["2024-10: %10 indirim"],     status: "Bekliyor", estimatedDuration: "35 dk", distance: "8.3 km",  lat: 41.0004, lng: 29.0498, phone: "0555 111 22 05", salesRepId: "rep1" },
  
  // rep2'ye (başka bir satış uzmanı) atanan müşteriler
  { id: "12", name: "Gizem Acar",    address: "İdealtepe No:11",  district: "Maltepe",    plannedTime: "12:40", priority: "Orta",   tariff: "Mesken", meterNumber: "210000012", consumption: "295 kWh/ay", offerHistory: ["2025-01: Paket"],           status: "Bekliyor", estimatedDuration: "30 dk", distance: "3.0 km",  lat: 40.9497, lng: 29.1228, phone: "0555 111 22 12", salesRepId: "rep2" },
  { id: "13", name: "Seda Karaca",   address: "Başak Cd. No:2",   district: "Kartal",     plannedTime: "13:10", priority: "Orta",   tariff: "Mesken", meterNumber: "210000013", consumption: "300 kWh/ay", offerHistory: ["2024-02: Kombi kampanya"],  status: "Bekliyor", estimatedDuration: "30 dk", distance: "6.2 km",  lat: 40.9127, lng: 29.2137, phone: "0555 111 22 13", salesRepId: "rep2" },
  { id: "14", name: "Tolga Kurt",    address: "Sahil Yolu No:88", district: "Kartal",     plannedTime: "13:30", priority: "Orta",   tariff: "Mesken", meterNumber: "210000014", consumption: "295 kWh/ay", offerHistory: ["2024-06: Sadakat paketi"],  status: "Bekliyor", estimatedDuration: "30 dk", distance: "7.5 km",  lat: 40.9075, lng: 29.1947, phone: "0555 111 22 14", salesRepId: "rep2" },
  { id: "15", name: "Melih Uçar",    address: "Velibaba Mh. 10",  district: "Pendik",     plannedTime: "14:00", priority: "Yüksek", tariff: "İş Yeri", meterNumber: "210000015", consumption: "1350 kWh/ay", offerHistory: ["2024-01: Endüstriyel tarife"], status: "Bekliyor", estimatedDuration: "50 dk", distance: "12.0 km", lat: 40.9009, lng: 29.2312, phone: "0555 111 22 15", salesRepId: "rep2" },
  { id: "16", name: "İpek Gür",      address: "Esenyalı Mh. 17",  district: "Pendik",     plannedTime: "14:30", priority: "Düşük",  tariff: "Mesken", meterNumber: "210000016", consumption: "280 kWh/ay", offerHistory: ["2023-12: E-devlet onay"],   status: "Bekliyor", estimatedDuration: "25 dk", distance: "14.8 km", lat: 40.8784, lng: 29.2743, phone: "0555 111 22 16", salesRepId: "rep2" },
];

/* ==== İkonlar ve Yardımcılar (Değişiklik yok) ==== */
// ... (numberIcon, haversineKm, toCoordStr vb. fonksiyonlar aynı kalır)
// ...

/* ==== Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  
  // Görüntülenecek (atanmış) müşterilerin listesi
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
  // ... (diğer ref ve yardımcı fonksiyonlar aynı)

  // ANA FİLTRELEME MANTIĞI
  useEffect(() => {
    const allCustomers = customers && customers.length ? customers : anadoluCustomers;
    const filtered = allCustomers.filter(c => c.salesRepId === rep.id);
    
    setAssignedCustomers(filtered);
    setOrderedCustomers(filtered); // Rota optimize edilene kadar varsayılan sıralama
    
    // State'i sıfırla
    setRouteCoords([]);
    setRouteKm(null);
    setSelectedId(null);
    setStarredId(null);

  }, [rep.id, customers]); // `rep.id` veya `customers` prop'u değişince bu blok yeniden çalışır


  const handleOptimize = async () => {
    if (assignedCustomers.length === 0) return; // Optimize edilecek müşteri yoksa çık

    try {
      setLoading(true);

      const customersToOptimize = assignedCustomers;

      if (!starredId) {
        // Repten başla, tüm müşteriler (bitiş: son nokta)
        const tripPoints = [
          { kind: "rep" as const, lat: rep.lat, lng: rep.lng },
          ...customersToOptimize.map((c) => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
        ];
        // ... (osrmTrip çağrısı ve sonrası aynı)

      } else {
        // Önce rep -> star rota, sonra star + diğerlerine trip
        const star = customersToOptimize.find((c) => c.id === starredId)!;
        const others = customersToOptimize.filter((c) => c.id !== starredId);

        // ... (osrmRoute ve osrmTrip çağrıları aynı)
      }
    } catch (e) {
      console.error(e);
      // Fallback mantığı aynı
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

  const center: LatLng = [rep.lat, rep.lng];

  return (
    // JSX içeriği tamamen aynı kalıyor, sadece `orderedCustomers` listesini kullanmaya devam ediyor.
    // Değişen tek şey, bu listenin artık filtrelenmiş olması.
    <div className="relative w-full">
        {/* ... (Başlık, Butonlar ve Harita JSX'i burada) */}
        {/* ... (Hiçbir değişiklik yapmanıza gerek yok) */}
    </div>
  );
};

// ... (FullscreenBtn bileşeni aynı kalır)

export default RouteMap;