// src/screens/RouteMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Maximize2, Minimize2, Route as RouteIcon, Star, StarOff, Navigation } from "lucide-react";

import { optimizeRoute, LatLng } from "../lib/osrm";

/* =======================
   Tipler
   ======================= */
export type Customer = {
  id: string;
  name: string;
  address: string;
  // ...diğer alanlar...
  lat: number | string;
  lng: number | string;
  phone: string;
};

// DEĞİŞTİRİLDİ: SalesRep tipi artık ID içerecek şekilde güncellendi.
// Projenizdeki SalesUser tipini de kullanabilirsiniz.
export type SalesRep = {
  id: string;
  name: string;
  lat: number | string;
  lng: number | string;
};

// DEĞİŞTİRİLDİ: Props'a 'assignments' eklendi.
interface Props {
  customers: Customer[];
  salesRep: SalesRep;
  assignments: Record<string, string | undefined>; // Hangi müşteri kime atanmış?
}

/* =======================
   Yardımcılar & Ikonlar (Değişiklik yok)
   ======================= */
const toNum = (v: any) => { /* ... */ };
const fmtKm = (km: number | null) => { /* ... */ };
const repIcon = new L.Icon({ /* ... */ });
function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) { /* ... */ }


/* =======================
   Ekran
   ======================= */
const RouteMap: React.FC<Props> = ({ customers, salesRep, assignments }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const safeRep = useMemo(() => {
    const lat = toNum(salesRep?.lat);
    const lng = toNum(salesRep?.lng);
    // DEĞİŞTİRİLDİ: salesRep.id'nin var olduğundan emin oluyoruz.
    if (lat != null && lng != null && salesRep?.id) {
      return { ...salesRep, lat, lng, id: salesRep.id };
    }
    return null;
  }, [salesRep]);


  // DEĞİŞTİRİLDİ: Müşteriler artık mevcut temsilciye atanmış olanlara göre filtreleniyor.
  const validCustomers = useMemo(() => {
    if (!safeRep) return []; // Eğer temsilci bilgisi yoksa boş dizi döndür.

    return (customers || [])
      .filter(c => assignments[c.id] === safeRep.id) // Sadece bu rep'e atananları al
      .map((c) => {
        const lat = toNum(c.lat);
        const lng = toNum(c.lng);
        if (lat == null || lng == null) return null;
        return { ...c, lat, lng } as Customer & { lat: number; lng: number };
      })
      .filter(Boolean) as (Customer & { lat: number; lng: number })[];
  }, [customers, assignments, safeRep]);


  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(validCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  // ...diğer state'ler aynı...

  // Inputs değişince sıfırla
  useEffect(() => {
    setOrderedCustomers(validCustomers);
    setRouteCoords([]);
    setRouteKm(null);
    setSelectedId(null);
    setStarredId(null);
  }, [validCustomers]);

  // ... (Geri kalan kodun tamamı aynı, herhangi bir değişiklik gerekmiyor)
  // ...
};

// ... (SidePanel, FullscreenBtn vb. diğer bileşenler aynı)

export default RouteMap;