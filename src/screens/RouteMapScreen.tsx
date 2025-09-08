// src/screens/RouteMapScreen.tsx  (veya RouteMap.tsx)

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { Star, StarOff, Navigation, Route as RouteIcon, Minimize2, Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// CSS
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';

// JS plugin (routing) statik
import 'leaflet-routing-machine';

/* =======================
   TILE STYLES
   ======================= */
const TILE_STYLES = {
  "Google Maps": {
    url: `https://mts{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0","1","2","3"],
    attribution: "&copy; Google",
  },
  "Google Satellite": {
    url: `https://mts{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0","1","2","3"],
    attribution: "&copy; Google",
  },
  "Google Hybrid": {
    url: `https://mts{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0","1","2","3"],
    attribution: "&copy; Google",
  },
  "Google Terrain": {
    url: `https://mts{s}.google.com/vt/lyrs=t&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0","1","2","3"],
    attribution: "&copy; Google",
  },
  "Carto Light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a","b","c","d"],
    attribution: "&copy; OSM &copy; CARTO",
  },
  "Carto Dark": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a","b","c","d"],
    attribution: "&copy; OSM &copy; CARTO",
  },
  "Carto Voyager": {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a","b","c","d"],
    attribution: "&copy; OSM &copy; CARTO",
  },
} as const;

type StyleKey = keyof typeof TILE_STYLES;

// Types
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

// Default data
const defaultSalesRep: SalesRep = {
  id: "rep1",
  name: "Satış Temsilcisi",
  lat: 39.9334,
  lng: 32.8597
};

const anadoluCustomers: Customer[] = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    address: "Kızılay Mahallesi, Atatürk Bulvarı No:15",
    district: "Çankaya",
    phone: "+90 532 123 4567",
    lat: 39.9208,
    lng: 32.8541,
    plannedTime: "09:00"
  },
  {
    id: "2",
    name: "Fatma Demir",
    address: "Bahçelievler Mahallesi, 7. Cadde No:23",
    district: "Çankaya",
    phone: "+90 533 987 6543",
    lat: 39.9100,
    lng: 32.8400,
    plannedTime: "10:30"
  }
];

// Icons
const repIcon = L.divIcon({
  className: "rep-marker",
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;background:#FF6B00;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏢</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function numberIcon(n: number, opts: { highlight?: boolean; starred?: boolean } = {}) {
  const bg = opts.starred ? "#F5B301" : opts.highlight ? "#FF6B00" : "#0099CB";
  return L.divIcon({
    className: "number-marker",
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;background:${bg};border-radius:50%;border:2px solid #fff;">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

/* ==== RoutingMachine ==== */
const RoutingMachine: React.FC<{ rep: SalesRep; customers: Customer[] }> = ({ rep, customers }) => {
  const map = useMap();
  const controlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    const waypoints = [
      L.latLng(rep.lat, rep.lng),
      ...customers.map(c => L.latLng(c.lat, c.lng)),
    ];

    if (controlRef.current) {
      map.removeControl(controlRef.current);
      controlRef.current = null;
    }

    // @ts-ignore
    const ctrl = L.Routing.control({
      waypoints,
      position: 'topleft',
      router: new (L.Routing as any).OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
      }),
      lineOptions: {
        styles: [{ color: '#0099CB', weight: 6 }],
      },
      show: false,
      collapsible: true,
      addWaypoints: false,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
    });

    ctrl.addTo(map);
    controlRef.current = ctrl;

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, rep, customers]);

  return null;
};

/* ==== Güvenli LocateControl ==== */
const LocateControl: React.FC = () => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await import('leaflet.locatecontrol/dist/L.Control.Locate.min.js');
        if (!mounted) return;

        // @ts-ignore
        const lc = (L.control as any).locate({
          position: 'topleft',
          strings: { title: 'Konumumu bul' },
          flyTo: true,
          setView: 'untilPan',
          cacheLocation: true,
          drawCircle: true,
          showCompass: true,
        });
        lc.addTo(map);
        controlRef.current = lc;
      } catch (e) {
        console.error('LocateControl yüklenemedi:', e);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (controlRef.current) {
          map.removeControl(controlRef.current);
          controlRef.current = null;
        }
      } catch { /* ignore */ }
    };
  }, [map]);

  return null;
};

/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : anadoluCustomers;
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [mapStyle, setMapStyle] = useState<StyleKey>("Google Maps");

  const markerRefs = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const highlightCustomer = (c: Customer) => {
    const m = markerRefs.current[c.id];
    if (m) m.openPopup();
    if (mapRef.current) mapRef.current.setView([c.lat, c.lng], 14, { animate: true });
  };

  const tile = TILE_STYLES[mapStyle];

  return (
    <div className="relative w-full h-full">
      {/* Stil seçici */}
      <div className="absolute top-2 right-2 z-[1000] bg-white/80 py-1 px-2 rounded shadow">
        <select
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value as StyleKey)}
          className="px-2 py-1 text-xs border rounded"
        >
          {Object.keys(TILE_STYLES).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <MapContainer
        center={[rep.lat, rep.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer
          url={tile.url}
          attribution={tile.attribution}
          // @ts-ignore
          subdomains={tile.subdomains}
        />

        {/* Locate + Routing */}
        <LocateControl />
        <RoutingMachine rep={rep} customers={orderedCustomers} />

        <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
          <Popup><b>{rep.name}</b></Popup>
        </Marker>

        {orderedCustomers.map((c, i) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={numberIcon(i + 1)}
            ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
            eventHandlers={{ click: () => highlightCustomer(c) }}
          >
            <Popup>
              <div>
                <b>{i + 1}. {c.name}</b>
                <div>{c.address}</div>
                <div>Tel: <a href={toTelHref(c.phone)}>{c.phone}</a></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
