// src/screens/RouteMap.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Star, StarOff, Navigation, Route as RouteIcon, Minimize2, Maximize2,
  Car, PersonStanding
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/* ============ ENERJISA RENKLERİ ============ */
const BRAND_YELLOW = '#F9C800';
const BRAND_NAVY = '#002D72';

/* ============ LOGO ============ */
const REP_LOGO_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5ivsG-_oXoQdlhlIlBOGUx-IdggvvOUvT8w&s';

const EnerjisaSwivelLogo: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <img
    src={REP_LOGO_URL}
    alt="Enerjisa"
    width={size}
    height={size}
    className="rounded-full"
    style={{
      animation: "swivel 1.8s ease-in-out infinite",
      boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
      border: `3px solid ${BRAND_YELLOW}`,
      background: "#fff",
      objectFit: "cover",
    }}
  />
);


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
// ... mevcut pulse-style bloğunun HEMEN ALTINA ekle:
if (typeof document !== 'undefined' && !document.getElementById('swivel-style')) {
  const style = document.createElement('style');
  style.id = 'swivel-style';
  style.innerHTML = `
    @keyframes swivel {
      0%   { transform: rotateY(0deg); }
      50%  { transform: rotateY(180deg) scale(1.05); }
      100% { transform: rotateY(360deg); }
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
  'Google Satellite': {
    url: `https://mts{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ['0', '1', '2', '3'],
    attribution: '© Google',
  },
  'Google Hybrid': {
    url: `https://mts{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ['0', '1', '2', '3'],
    attribution: '© Google',
  },
  'Google Terrain': {
    url: `https://mts{s}.google.com/vt/lyrs=t&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ['0', '1', '2', '3'],
    attribution: '© Google',
  },
  'Carto Light': {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '© OSM © CARTO',
  },
  'Carto Dark': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '© OSM © CARTO',
  },
  'Carto Voyager': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '© OSM © CARTO',
  },
} as const;

type StyleKey = keyof typeof TILE_STYLES;

/* ============ TYPES ============ */
type TravelMode = 'driving' | 'walking';

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
  lat: 39.9334,
  lng: 32.8597,
};
const anadoluCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    address: 'Kızılay Mahallesi, Atatürk Bulvarı No:15',
    district: 'Çankaya',
    phone: '+90 532 123 4567',
    lat: 39.9208,
    lng: 32.8541,
    plannedTime: '09:00',
  },
  {
    id: '2',
    name: 'Fatma Demir',
    address: 'Bahçelievler Mahallesi, 7. Cadde No:23',
    district: 'Çankaya',
    phone: '+90 533 987 6543',
    lat: 39.91,
    lng: 32.84,
    plannedTime: '10:30',
  },
];

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

function numberIcon(
  n: number,
  opts: { highlight?: boolean; starred?: boolean } = {}
) {
  const bg = opts.starred ? '#F5B301' : opts.highlight ? '#FF6B00' : '#0099CB';
  return L.divIcon({
    className: 'number-marker',
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

/* ============ OSRM HELPERS (PUBLIC) ============ */
const OSRM_BASE = 'https://router.project-osrm.org';

const cacheTrip = new Map<string, any>();
const cacheRoute = new Map<string, any>();
const tripKey = (profile: TravelMode, coords: string) => `${profile}|TRIP|${coords}`;
const routeKey = (profile: TravelMode, coords: string) => `${profile}|ROUTE|${coords}`;

async function osrmTrip(profile: TravelMode, coords: string, signal?: AbortSignal) {
  const k = tripKey(profile, coords);
  if (cacheTrip.has(k)) return cacheTrip.get(k);

  const url =
    `${OSRM_BASE}/trip/v1/${profile}/${coords}` +
    `?source=first&destination=any&roundtrip=false` +
    `&overview=false&steps=false&annotations=false`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.trips?.[0]) throw new Error('Trip not found');
  cacheTrip.set(k, data);
  return data;
}

async function osrmRoute(profile: TravelMode, orderedCoords: string, signal?: AbortSignal) {
  const k = routeKey(profile, orderedCoords);
  if (cacheRoute.has(k)) return cacheRoute.get(k);

  const url =
    `${OSRM_BASE}/route/v1/${profile}/${orderedCoords}` +
    `?overview=simplified&geometries=geojson&steps=false&annotations=false&skip_waypoints=true`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM route error: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('Route not found');
  cacheRoute.set(k, data);
  return data;
}

/* ============ HELPERS ============ */
const FitBounds: React.FC<{ rep: SalesRep; customers: Customer[] }> = ({ rep, customers }) => {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[rep.lat, rep.lng], ...customers.map((c) => [c.lat, c.lng])];
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
      {isFs ? (
        <>
          <Minimize2 className="w-3 h-3" /> Kapat
        </>
      ) : (
        <>
          <Maximize2 className="w-3 h-3" /> Tam Ekran
        </>
      )}
    </button>
  );
};

function formatMinutes(sec: number | null) {
  if (!sec && sec !== 0) return '—';
  const min = Math.round(sec / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
}

/* ============ ANA BİLEŞEN ============ */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;

  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeSec, setRouteSec] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [mapStyle, setMapStyle] = useState<StyleKey>('Carto Light');

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  // Abort + debounce
  const inFlight = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;

  const highlightCustomer = (c: Customer) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (m) m.openPopup();
    if (mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], 14, { animate: true });
    }
  };

  function scheduleOptimize() {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { void handleOptimize(); }, 250);
  }

  async function handleOptimize() {
    try {
      setLoading(true);

      if (inFlight.current) inFlight.current.abort();
      inFlight.current = new AbortController();

      // 1) SIRALAMA — küçük payload
      if (!starredId) {
        // rep + hepsi
        const coordsTrip = [[rep.lng, rep.lat], ...baseCustomers.map(c => [c.lng, c.lat])]
          .map(([lng, lat]) => `${lng},${lat}`).join(';');

        const trip = await osrmTrip(travelMode, coordsTrip, inFlight.current.signal);

        const order = trip.waypoints
          .map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index }))
          .sort((a: any, b: any) => a.order - b.order);

        const sortedCustomers = order.slice(1).map(x => baseCustomers[x.idx - 1]); // first = rep
        setOrderedCustomers(sortedCustomers);

        // 2) TEK ROUTE — geometri+mesafe+süre
        const orderedCoords = [[rep.lng, rep.lat], ...sortedCustomers.map(c => [c.lng, c.lat])]
          .map(([lng, lat]) => `${lng},${lat}`).join(';');

        const route = await osrmRoute(travelMode, orderedCoords, inFlight.current.signal);
        const r0 = route.routes[0];
        setRouteKm(r0.distance / 1000);
        setRouteSec(r0.duration);
        setRouteCoords(r0.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));
      } else {
        // yıldızlı ilk durak: rep -> star -> optimize(others)
        const star = baseCustomers.find(c => c.id === starredId)!;
        const others = baseCustomers.filter(c => c.id !== starredId);

        // star + others için trip → star sonrası sıralama
        const coordsTrip = [[star.lng, star.lat], ...others.map(c => [c.lng, c.lat])]
          .map(([lng, lat]) => `${lng},${lat}`).join(';');

        const trip2 = await osrmTrip(travelMode, coordsTrip, inFlight.current.signal);

        const order2 = trip2.waypoints
          .map((wp: any, idx: number) => ({ idx, order: wp.waypoint_index }))
          .sort((a: any, b: any) => a.order - b.order);

        const orderedAfterStar = order2.slice(1).map(x => others[x.idx - 1]);
        const finalCustomers = [star, ...orderedAfterStar];
        setOrderedCustomers(finalCustomers);

        // tek route: rep -> star -> orderedAfterStar
        const orderedCoords =
          [[rep.lng, rep.lat], [star.lng, star.lat], ...orderedAfterStar.map(c => [c.lng, c.lat])]
            .map(([lng, lat]) => `${lng},${lat}`).join(';');

        const route = await osrmRoute(travelMode, orderedCoords, inFlight.current.signal);
        const r0 = route.routes[0];
        setRouteKm(r0.distance / 1000);
        setRouteSec(r0.duration);
        setRouteCoords(r0.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ilk yük + değişimler
  useEffect(() => {
    scheduleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredId, travelMode]);

  const tile = TILE_STYLES[mapStyle];
  const gmapsTravel = travelMode === 'walking' ? 'walking' : 'driving';

  // görsel fark: yaya rotası daha ince çizgi
  const lineWeight = travelMode === 'walking' ? 4 : 6;
  const lineShadow = travelMode === 'walking' ? 8 : 10;

  return (
    <div className="relative w-full h-full">
      {/* HARİTA KARTI */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        {/* ÜST KONTROL PANELİ */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/85 backdrop-blur py-1.5 px-2.5 rounded-lg shadow-lg flex items-center gap-2">
          {/* Harita stili */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as StyleKey)}
            className="px-2 py-1 text-xs border rounded-md bg-white"
            title="Harita stili"
          >
            {Object.keys(TILE_STYLES).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* Ulaşım modu: ikon butonları */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-600">Ulaşım:</span>
            <div className="flex rounded-md border bg-white/70 backdrop-blur p-0.5">
              <button
                onClick={() => setTravelMode('driving')}
                aria-pressed={travelMode === 'driving'}
                className={`p-1.5 text-xs rounded-sm transition-all ${
                  travelMode === 'driving'
                    ? 'bg-white shadow-md'
                    : 'bg-transparent text-gray-500 hover:bg-white/50'
                }`}
                title="Araç Modu"
              >
                <Car className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTravelMode('walking')}
                aria-pressed={travelMode === 'walking'}
                className={`p-1.5 text-xs rounded-sm transition-all ${
                  travelMode === 'walking'
                    ? 'bg-white shadow-md'
                    : 'bg-transparent text-gray-500 hover:bg-white/50'
                }`}
                title="Yaya Modu"
              >
                <PersonStanding className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-700 font-medium">
            Toplam: {routeKm ? `${routeKm.toFixed(1)} km` : '—'} • {formatMinutes(routeSec)}
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
              loading ? 'bg-gray-300 text-gray-600 cursor-wait' : 'bg-[#0099CB] text-white hover:bg-[#007ca8]'
            }`}
          >
            {loading ? 'Hesaplanıyor...' : 'Rota Oluştur'}
          </button>
          <FullscreenBtn />
        </div>

        <MapContainer
          center={[rep.lat, rep.lng]}
          zoom={travelMode === 'walking' ? 14 : 13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(m) => (mapRef.current = m)}
        >
          <TileLayer
            key={mapStyle}
            url={tile.url}
            attribution={tile.attribution}
            // @ts-ignore
            subdomains={tile.subdomains}
            eventHandlers={{ tileerror: (e) => console.warn('Tile error:', e) }}
          />

          <FitBounds rep={rep} customers={orderedCustomers} />

          {/* Satışçı marker */}
          <Marker position={[rep.lat, rep.lng]} icon={createRepIcon(REP_LOGO_URL)}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {/* Müşteri markerları */}
          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, { highlight: selectedId === c.id, starred: starredId === c.id })}
              ref={(ref: any) => { if (ref) (markerRefs.current as any)[c.id] = ref; }}
              eventHandlers={{ click: () => highlightCustomer(c) }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <b>{i + 1}. {c.name}</b>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setStarredId((prev) => (prev === c.id ? null : c.id));
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Star className={`w-4 h-4 ${starredId === c.id ? 'text-[#F5B301] fill-[#F5B301]' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  <div>{c.address}, {c.district}</div>
                  <div>Saat: {c.plannedTime}</div>
                  <div>Tel: <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>{c.phone}</a></div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=${gmapsTravel}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
                  >
                    <Navigation className="w-4 h-4" /> Navigasyonu Başlat
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ROTA: çift çizgi */}
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} pathOptions={{ color: '#ffffff', weight: lineShadow, opacity: 0.7 }} />
              <Polyline positions={routeCoords} pathOptions={{ color: BRAND_YELLOW, weight: lineWeight }} />
            </>
          )}
        </MapContainer>

        {/* SAĞ ZİYARET PANELİ */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-[999] transition-transform duration-300 ${
            panelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-1.5rem)]'
          } flex`}
        >
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] text-white flex flex-col items-center justify-center rounded-l-md"
          >
            {panelOpen ? (
              <Minimize2 className="w-4 h-4 -rotate-90" />
            ) : (
              <span className="rotate-90 text-[10px] font-bold tracking-wider">ZİYARET</span>
            )}
          </button>
          <div className="bg-white/95 rounded-l-xl shadow px-4 py-3 flex flex-col gap-3 min-w-[260px] h-full">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700">Ziyaret Sırası</span>
            </div>
            <div className="text-xs text-gray-600">⭐ Yıldızlı müşteri ilk durak olur.</div>
            <div className="overflow-auto pr-1">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selected ? 'bg-[#0099CB]/10' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => highlightCustomer(c)}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white text-sm shrink-0 ${
                        starred ? 'bg-[#F5B301]' : selected ? 'bg-[#FF6B00]' : 'bg-[#0099CB]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.address}</div>
                      <a
                        className="text-xs text-[#0099CB]"
                        href={toTelHref(c.phone)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.phone}
                      </a>
                    </div>
                    <button
                      className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 shrink-0"
                      onClick={(e) => { e.stopPropagation(); setStarredId((prev) => (prev === c.id ? null : c.id)); }}
                    >
                      {starred ? (
                        <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" />
                      ) : (
                        <StarOff className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

   {/* LOADING OVERLAY */}
{loading && (
  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-[2000]">
    <div className="rounded-2xl bg-white/95 border border-gray-100 shadow-xl px-6 py-5 flex flex-col items-center gap-3">
      <EnerjisaSwivelLogo size={64} />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">Rota hesaplanıyor…</span>
        <img
          src={REP_LOGO_URL}
          alt="Enerjisa"
          width={18}
          height={18}
          className="rounded-full"
          style={{ border: `2px solid ${BRAND_YELLOW}`, background: "#fff" }}
        />
      </div>
      <p className="text-[11px] text-gray-500">Noktalar optimize ediliyor, lütfen bekleyin.</p>
    </div>
  </div>
)}


export default RouteMap;
