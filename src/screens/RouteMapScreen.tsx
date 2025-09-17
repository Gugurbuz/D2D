import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { Star, StarOff, Navigation, Route as RouteIcon, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// YENİ: Gerekli kütüphaneler ve CSS'ler
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
interface Customer {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  lat: number;
  lng: number;
  plannedTime: string;
}
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
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState<StyleKey>(((import.meta.env.VITE_DEFAULT_MAP_STYLE as StyleKey) || "Google Maps") as StyleKey);

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mapRef = useRef<L.Map | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const highlightCustomer = (c: Customer) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (m) m.openPopup();
    if (mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], 14, { animate: true });
    }
    listItemRefs.current[c.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
    });
  };

  async function handleOptimize() {
    try {
      setLoading(true);
      // ... (Mevcut rota optimizasyon mantığı)
    } catch (e) {
      console.error(e);
      toast.error("Rota oluşturulamadı. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId]);

  const tile = TILE_STYLES[mapStyle];

  return (
    <div className="relative w-full h-full">
      <Toaster position="top-center" />

      {/* Harita ve Panelleri içeren ana sarmalayıcı */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/80 py-1 px-2 rounded-lg shadow-lg flex items-center gap-2">
          {/* ... Kontrol paneli butonları ... */}
        </div>

        <MapContainer center={[rep.lat, rep.lng]} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)} >
          <TileLayer url={tile.url} attribution={tile.attribution} subdomains={tile.subdomains as any} />
          <FitBounds rep={rep} customers={orderedCustomers} />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>
        
        <MarkerClusterGroup>
          {orderedCustomers.map((c, i) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })} ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }} eventHandlers={{ click: () => highlightCustomer(c) }} >
              <Popup>
                <div className="text-center p-1">
                    <b className="text-md block mb-2">{i + 1}. {c.name}</b>
                    <button
                        onClick={() => highlightCustomer(c)}
                        className="w-full px-3 py-1.5 text-sm rounded-md bg-[#0099CB] text-white font-semibold hover:bg-[#007ca8]"
                    >
                        Detayları Gör
                    </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 6 }} />
          )}
        </MapContainer>

        {/* Sağ panel */}
        <div className={`absolute top-4 right-0 bottom-4 z-[999] transition-transform duration-300 ${ panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]" } flex`} >
          {/* ... panel içeriği ... */}
          <div className="overflow-auto pr-1">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div
                      key={c.id}
                      ref={(el) => (listItemRefs.current[c.id] = el)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"}`}
                    onClick={() => highlightCustomer(c)}
                  >
                    {/* ... liste elemanı içeriği ... */}
                  </div>
                );
              })}
            </div>
        </div>
        
        {/* DÜZELTİLDİ: Yüklenme ekranı artık harita sarmalayıcısının içinde */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-[2000] backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-[#0099CB] animate-spin" />
            <div className="mt-4 rounded bg-white shadow px-4 py-2 text-md font-semibold text-gray-700">
              En uygun rota hesaplanıyor...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==== Fullscreen butonu ==== */
const FullscreenBtn: React.FC = () => { /* ... Fullscreen butonu ... */ };

export default RouteMap;