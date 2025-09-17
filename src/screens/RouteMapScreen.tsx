import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { LatLngTuple } from 'leaflet';
import { Star, StarOff, Navigation, Route as RouteIcon, Minimize2, Maximize2, Car, PersonStanding } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/* ============ ENERJISA RENKLERİ ============ */
const BRAND_YELLOW = '#F9C800';
const BRAND_NAVY = '#002D72';

/* ============ LOGO ============ */
const REP_LOGO_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5ivsG-_oXoQdlhlIlBOGUx-IdggvvOUvT8w&s';

/* ============ PULSE CSS ============ */
if (typeof document !== 'undefined' && !document.getElementById('pulse-style')) {
  const style = document.createElement('style');
  style.id = 'pulse-style';
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.45; }
      50% { transform: scale(1.25); opacity: 0; }
      100% { transform: scale(0.9); opacity: 0.45; }
    }
    .pulse-ring {
      position: absolute;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: ${BRAND_YELLOW};
      animation: pulse 2.2s ease-out infinite;
    }
  `;
  document.head.appendChild(style);
}

/* =======================
   TILE STYLES (Switchable)
   ====================== */
const TILE_STYLES = {
  'Google Maps': {
    url: `https://mts{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ['0', '1', '2', '3'],
    attribution: '© Google',
  },
  'Carto Light': {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '© OSM © CARTO',
  },
} as const;

type StyleKey = keyof typeof TILE_STYLES;
type TravelMode = 'driving' | 'foot';

/* ============ TYPES ============ */
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
interface SalesRep {
  id: string;
  name: string;
  lat: number;
  lng: number;
}
interface Props {
  customers: Customer[];
  salesRep: SalesRep;
}

/* ============ DEFAULT DATA ============ */
const defaultSalesRep: SalesRep = {
  id: 'rep1',
  name: 'Satış Temsilcisi',
  lat: 40.9905, // Kadıköy merkez
  lng: 29.0275,
};

/* ============ ICONS ============ */
function createRepIcon(logoUrl: string) { /* ... icon tanımı ... */ }
function numberIcon(n: number, opts: { highlight?: boolean; starred?: boolean } = {}) { /* ... icon tanımı ... */ }


/* ============ OSRM HELPERS (GÜNCELLENDİ) ============ */
async function osrmTrip(coords: string, mode: TravelMode) {
  const url = `https://router.project-osrm.org/trip/v1/${mode}/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.trips?.[0]) throw new Error('Trip not found');
  return data;
}

async function osrmRoute(from: LatLngTuple, to: LatLngTuple, mode: TravelMode) {
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const url = `https://router.project-osrm.org/route/v1/${mode}/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM route error: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('Route not found');
  return data;
}

/* ============ HELPERS ============ */
const FitBounds: React.FC<{ rep: SalesRep; customers: Customer[] }> = ({ rep, customers }) => { /* ... */ };
const FullscreenBtn: React.FC = () => { /* ... */ };


/* ============ ANA BİLEŞEN (GÜNCELLENDİ) ============ */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLngTuple[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState<StyleKey>('Carto Light');
  const [travelMode, setTravelMode] = useState<TravelMode>('driving'); // YENİ: Ulaşım modu state'i

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;
  const highlightCustomer = (c: Customer) => { /* ... */ };

  async function handleOptimize() {
    try {
      setLoading(true);
      const startPoint: LatLngTuple = [rep.lat, rep.lng];

      if (!starredId) {
        const coords = [startPoint, ...baseCustomers.map((c) => [c.lat, c.lng] as LatLngTuple)]
          .map(([lat, lng]) => `${lng},${lat}`)
          .join(';');
        const data = await osrmTrip(coords, travelMode); // GÜNCELLENDİ: travelMode gönderiliyor

        const sortedCustomers = data.waypoints
          .map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index }))
          .sort((a: any, b: any) => a.order - b.order)
          .slice(1)
          .map((x: any) => baseCustomers[x.idx - 1]);

        setOrderedCustomers(sortedCustomers);
        setRouteCoords(data.trips[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as LatLngTuple));
        setRouteKm(data.trips[0].distance / 1000);
      } else {
        const star = baseCustomers.find((c) => c.id === starredId)!;
        const others = baseCustomers.filter((c) => c.id !== starredId);
        const starPoint: LatLngTuple = [star.lat, star.lng];

        const dataRoute = await osrmRoute(startPoint, starPoint, travelMode); // GÜNCELLENDİ
        const route1Coords = dataRoute.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as LatLngTuple);
        const route1Km = dataRoute.routes[0].distance / 1000;

        if (others.length > 0) {
          const coords2 = [starPoint, ...others.map((c) => [c.lat, c.lng] as LatLngTuple)]
            .map(([lat, lng]) => `${lng},${lat}`)
            .join(';');
          const dataTrip2 = await osrmTrip(coords2, travelMode); // GÜNCELLENDİ
          const ordered2 = dataTrip2.waypoints.map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index })).sort((a: any, b: any) => a.order - b.order).slice(1).map((x: any) => others[x.idx - 1]);
          setOrderedCustomers([star, ...ordered2]);
          const restCoords = dataTrip2.trips[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as LatLngTuple);
          setRouteCoords([...route1Coords, ...restCoords]);
          setRouteKm(route1Km + dataTrip2.trips[0].distance / 1000);
        } else {
            setOrderedCustomers([star]);
            setRouteCoords(route1Coords);
            setRouteKm(route1Km);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId, travelMode]); // YENİ: travelMode değişince de rotayı optimize et

  const tile = TILE_STYLES[mapStyle];
  const routeColor = travelMode === 'driving' ? BRAND_YELLOW : '#3b82f6'; // Yaya için Mavi Rota

  return (
    <div className="relative w-full h-full">
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        {/* ÜST KONTROL PANELİ (GÜNCELLENDİ) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/85 backdrop-blur py-1.5 px-2.5 rounded-lg shadow-lg flex items-center gap-3">
            {/* YENİ: Ulaşım Modu Seçici */}
            <div className="flex items-center p-0.5 bg-gray-200/70 rounded-md">
                <button
                    onClick={() => setTravelMode('driving')}
                    className={`p-1.5 text-xs rounded-sm transition-all ${travelMode === 'driving' ? 'bg-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-white/50'}`}
                    title="Araç Modu"
                >
                    <Car className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setTravelMode('foot')}
                    className={`p-1.5 text-xs rounded-sm transition-all ${travelMode === 'foot' ? 'bg-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-white/50'}`}
                    title="Yaya Modu"
                >
                    <PersonStanding className="w-4 h-4" />
                </button>
            </div>

            <div className="h-6 w-px bg-gray-200"></div> {/* Ayırıcı */}

          <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value as StyleKey)} className="px-2 py-1 text-xs border rounded-md bg-white">
            {Object.keys(TILE_STYLES).map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
          <div className="text-xs text-gray-700 font-medium">
            Toplam: {routeKm ? routeKm.toFixed(1) + ' km' : '—'}
          </div>
          <button onClick={handleOptimize} disabled={loading} className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${loading ? 'bg-gray-300' : 'bg-[#0099CB] text-white hover:bg-[#007ca8]'}`}>
            {loading ? '...' : 'Rota Oluştur'}
          </button>
          <FullscreenBtn />
        </div>

        <MapContainer center={[rep.lat, rep.lng]} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={(m) => (mapRef.current = m)}>
          <TileLayer key={mapStyle} url={tile.url} attribution={tile.attribution} subdomains={tile.subdomains as any} />
          <FitBounds rep={rep} customers={orderedCustomers} />
          <Marker position={[rep.lat, rep.lng]} icon={createRepIcon(REP_LOGO_URL)}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {orderedCustomers.map((c, i) => (<Marker key={c.id} position={[c.lat, c.lng]} icon={numberIcon(i + 1, {highlight: selectedId === c.id, starred: starredId === c.id})} ref={(ref: any) => { if (ref) (markerRefs.current as any)[c.id] = ref; }} eventHandlers={{ click: () => highlightCustomer(c) }}>
              <Popup>{/* ... Popup içeriği ... */}</Popup>
            </Marker>
          ))}

          {/* ROTA (GÜNCELLENDİ) */}
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} pathOptions={{ color: '#ffffff', weight: 10, opacity: 0.7 }} />
              <Polyline positions={routeCoords} pathOptions={{ color: routeColor, weight: 6, dashArray: travelMode === 'foot' ? '5, 10' : undefined }} />
            </>
          )}
        </MapContainer>
        {/* SAĞ ZİYARET PANELİ */}
        {/* ... Panel içeriği (değişiklik yok) ... */}
      </div>
    </div>
  );
};

export default RouteMap;
