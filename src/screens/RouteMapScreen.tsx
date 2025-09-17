import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { Star, StarOff, Navigation, Route as RouteIcon, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import MarkerClusterGroup from 'react-leaflet-markercluster';
import toast, { Toaster } from 'react-hot-toast';

// NOT: Bu iki CSS dosyasını ana App.tsx veya main.tsx dosyanıza ekleyin
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

/* =======================
   TILE STYLES (Switchable)
   ======================= */
const TILE_STYLES = {
  "Google Maps": {
    url: `https://mts{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0","1","2","3"],
    attribution: "© Google",
  },
  "Carto Light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a","b","c","d"],
    attribution: "© OSM © CARTO",
  },
} as const;
type StyleKey = keyof typeof TILE_STYLES;

// Tipler ve diğer tanımlamalar...
interface Customer { id: string; name: string; address: string; district: string; phone: string; lat: number; lng: number; plannedTime: string; }
interface SalesRep { id: string; name: string; lat: number; lng: number; }
interface Props { customers: Customer[]; salesRep: SalesRep; }
const defaultSalesRep: SalesRep = { id: "rep1", name: "Satış Temsilcisi", lat: 39.9334, lng: 32.8597 };
const anadoluCustomers: Customer[] = [ /* ... Müşteri verileri ... */ ];

// Icon'lar...
const repIcon = L.divIcon({ /* ... icon tanımı ... */ });
function numberIcon(n: number, opts: { highlight?: boolean; starred?: boolean } = {}) { /* ... icon tanımı ... */ }

/* ==== OSRM yardımcıları ==== */
async function osrmTrip(coords: string) { /* ... OSRM fonksiyonu ... */ }
async function osrmRoute(from: LatLng, to: LatLng) { /* ... OSRM fonksiyonu ... */ }

/* ==== FitBounds ==== */
const FitBounds: React.FC<{ rep: SalesRep; customers: Customer[] }> = ({ rep, customers }) => { /* ... Fitbounds bileşeni ... */ };


/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // HATA ALINAN SATIR: Bu satırın eksik olmadığından emin olun
  const [starredId, setStarredId] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState<StyleKey>(((import.meta.env.VITE_DEFAULT_MAP_STYLE as StyleKey) || "Google Maps") as StyleKey);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mapRef = useRef<L.Map | null>(null);

  const createClusterCustomIcon = function (cluster: L.MarkerCluster) {
    return L.divIcon({
      html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(33, 33, true),
    });
  };
  
  // ... (Diğer tüm fonksiyonlar highlightCustomer, handleOptimize vb. burada yer alacak) ...
  
  return (
    <div className="relative w-full h-full">
      {/* ... (Bileşenin geri kalan JSX kodu) ... */}
    </div>
  );
};

/* ==== Fullscreen butonu ==== */
const FullscreenBtn: React.FC = () => { /* ... Fullscreen butonu ... */ };

export default RouteMap;