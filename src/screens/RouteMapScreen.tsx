import React, { useState, useEffect, useRef, useMemo } from 'react';
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
function createRepIcon(logoUrl: string) {
    return L.divIcon({
        className: 'rep-marker',
        html: `
          <div style="position: relative; display:flex; align-items:center; justify-content:center;">
            <div class="pulse-ring"></div>
            <div style="
              width:42px;height:42px;display:flex;align-items:center;justify-content:center;
              background:#ffffff;border-radius:50%;border:3px solid ${BRAND_YELLOW};
              box-shadow:0 2px 10px rgba(0,0,0,0.25);position:relative;z-index:2;
            ">
              <img src="${logoUrl}" alt="Rep" style="width:30px;height:30px;border-radius:50%;object-fit:cover"/>
            </div>
          </div>
        `,
        iconSize: [54, 54],
        iconAnchor: [27, 54],
        popupAnchor: [0, -46],
      });
}
function numberIcon(n: number, opts: { highlight?: boolean; starred?: boolean } = {}) {
    const bg = opts.starred ? '#F5B301' : opts.highlight ? '#FF6B00' : '#0099CB';
    return L.divIcon({
        className: 'number-marker',
        html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;">${n}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });
}


/* ============ OSRM HELPERS ============ */
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
const FitBounds: React.FC<{ rep: SalesRep; customers: Customer[] }> = ({ rep, customers }) => {
    const map = useMap();
    useEffect(() => {
        if (!customers || customers.length === 0) return;
        const points: LatLngTuple[] = [[rep.lat, rep.lng], ...customers.map((c) => [c.lat, c.lng])];
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [rep, customers, map]);
    return null;
};
const FullscreenBtn: React.FC = () => {
    const [isFs, setIsFs] = useState(false);
    useEffect(() => {
        const h = () => setIsFs(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);
    return (
        <button
            onClick={async () => {
                const el = document.querySelector('.leaflet-container')?.parentElement;
                if (!el) return;
                if (!document.fullscreenElement) await el.requestFullscreen();
                else await document.exitFullscreen();
            }}
            className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-1"
        >
            {isFs ? <><Minimize2 className="w-3 h-3" /> Kapat</> : <><Maximize2 className="w-3 h-3" /> Tam Ekran</>}
        </button>
    );
};


/* ============ ANA BİLEŞEN ============ */
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
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;
  const highlightCustomer = (c: Customer) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (m) m.openPopup();
    if (mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], 14, { animate: true });
    }
  };

  async function handleOptimize() {
    try {
      setLoading(true);
      const startPoint: LatLngTuple = [rep.lat, rep.lng];

      if (!starredId) {
        const coords = [startPoint, ...baseCustomers.map((c) => [c.lat, c.lng] as LatLngTuple)]
          .map(([lat, lng]) => `${lng},${lat}`)
          .join(';');
        const data = await osrmTrip(coords, travelMode);

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

        const dataRoute = await osrmRoute(startPoint, starPoint, travelMode);
        const route1Coords = dataRoute.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as LatLngTuple);
        const route1Km = dataRoute.routes[0].distance / 1000;

        if (others.length > 0) {
          const coords2 = [starPoint, ...others.map((c) => [c.lat, c.lng] as LatLngTuple)]
            .map(([lat, lng]) => `${lng},${lat}`)
            .join(';');
          const dataTrip2 = await osrmTrip(coords2, travelMode);
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
  }, [starredId, travelMode]);

  // DÜZELTME: İkonlar useMemo ile sarmalandı
  const repIcon = useMemo(() => createRepIcon(REP_LOGO_URL), []);

  const customerIcons = useMemo(() => {
    return orderedCustomers.map((c, i) => {
        return numberIcon(i + 1, {
            highlight: selectedId === c.id,
            starred: starredId === c.id,
        });
    });
  }, [orderedCustomers, selectedId, starredId]);

  const tile = TILE_STYLES[mapStyle];
  const routeColor = travelMode === 'driving' ? BRAND_YELLOW : '#3b82f6';

  return (
    <div className="relative w-full h-full">
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        {/* ÜST KONTROL PANELİ */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/85 backdrop-blur py-1.5 px-2.5 rounded-lg shadow-lg flex items-center gap-3">
            <div className="flex items-center p-0.5 bg-gray-200/70 rounded-md">
                <button onClick={() => setTravelMode('driving')} className={`p-1.5 text-xs rounded-sm transition-all ${travelMode === 'driving' ? 'bg-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-white/50'}`} title="Araç Modu">
                    <Car className="w-4 h-4" />
                </button>
                <button onClick={() => setTravelMode('foot')} className={`p-1.5 text-xs rounded-sm transition-all ${travelMode === 'foot' ? 'bg-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-white/50'}`} title="Yaya Modu">
                    <PersonStanding className="w-4 h-4" />
                </button>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
          <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value as StyleKey)} className="px-2 py-1 text-xs border rounded-md bg-white">
            {Object.keys(TILE_STYLES).map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
          <div className="text-xs text-gray-700 font-medium">Toplam: {routeKm ? routeKm.toFixed(1) + ' km' : '—'}</div>
          <button onClick={handleOptimize} disabled={loading} className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${loading ? 'bg-gray-300' : 'bg-[#0099CB] text-white hover:bg-[#007ca8]'}`}>
            {loading ? '...' : 'Rota Oluştur'}
          </button>
          <FullscreenBtn />
        </div>

        <MapContainer center={[rep.lat, rep.lng]} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={(m) => (mapRef.current = m)}>
          <TileLayer key={mapStyle} url={tile.url} attribution={tile.attribution} subdomains={tile.subdomains as any} />
          <FitBounds rep={rep} customers={orderedCustomers} />
          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {orderedCustomers.map((c, i) => (<Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcons[i]} ref={(ref: any) => { if (ref) (markerRefs.current as any)[c.id] = ref; }} eventHandlers={{ click: () => highlightCustomer(c) }}>
            <Popup>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <b>{i + 1}. {c.name}</b>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStarredId((prev) => (prev === c.id ? null : c.id)); }} className="p-1 rounded hover:bg-gray-100">
                            <Star className={`w-4 h-4 ${starredId === c.id ? 'text-[#F5B301] fill-[#F5B301]' : 'text-gray-400'}`} />
                        </button>
                    </div>
                    <div>{c.address}, {c.district}</div>
                    <div>Saat: {c.plannedTime}</div>
                    <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>{c.phone}</a></div>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600">
                        <Navigation className="w-4 h-4" /> Navigasyonu Başlat
                    </a>
                </div>
            </Popup>
            </Marker>
          ))}

          {/* ROTA */}
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

