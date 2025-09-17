import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Star, StarOff, Navigation, Route as RouteIcon, Minimize2, Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/* ============ ENERJISA RENKLERİ ============ */
const BRAND_YELLOW = '#F9C800';

/* ============ LOGO ============ */
const REP_LOGO_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5ivsG-_oXoQdlhlIlBOGUx-IdggvvOUvT8w&s";

/* Pulsing animasyon CSS’ini head’e ekle */
if (typeof document !== "undefined" && !document.getElementById("pulse-style")) {
  const style = document.createElement("style");
  style.id = "pulse-style";
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 0; }
      100% { transform: scale(1); opacity: 0.8; }
    }
    .pulse-ring {
      position: absolute;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: ${BRAND_YELLOW};
      opacity: 0.4;
      animation: pulse 2s infinite;
    }
  `;
  document.head.appendChild(style);
}

/* Satışçı ikonu (görsel + halo + pulse) */
function createRepIcon(logoUrl: string) {
  return L.divIcon({
    className: "rep-marker",
    html: `
      <div style="position: relative; display:flex; align-items:center; justify-content:center;">
        <div class="pulse-ring"></div>
        <div style="
          width:38px;height:38px;display:flex;align-items:center;justify-content:center;
          background:#ffffff;border-radius:50%;border:3px solid ${BRAND_YELLOW};
          box-shadow:0 2px 10px rgba(0,0,0,0.25);position:relative;z-index:2;
        ">
          <img src="${logoUrl}" alt="Rep" style="width:28px;height:28px;border-radius:50%;object-fit:cover"/>
        </div>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 46],
    popupAnchor: [0, -40],
  });
}

/* Müşteri marker ikonu */
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

/* ==== FitBounds ==== */
const FitBounds: React.FC<{ rep: any; customers: any[] }> = ({ rep, customers }) => {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[rep.lat, rep.lng], ...customers.map(c => [c.lat, c.lng])];
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [rep, customers, map]);
  return null;
};

/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<any> = ({ customers, salesRep }) => {
  const rep = salesRep || { id: "rep1", name: "Satış Temsilcisi", lat: 39.9334, lng: 32.8597 };
  const baseCustomers = customers && customers.length ? customers : [];

  const [orderedCustomers, setOrderedCustomers] = useState(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  return (
    <div className="relative w-full h-full">
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer center={[rep.lat, rep.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <FitBounds rep={rep} customers={orderedCustomers} />

          {/* Satışçı marker */}
          <Marker position={[rep.lat, rep.lng]} icon={createRepIcon(REP_LOGO_URL)}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>

          {/* Müşteriler */}
          {orderedCustomers.map((c, i) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={numberIcon(i + 1)} />
          ))}

          {/* Rota */}
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.6 }} />
              <Polyline positions={routeCoords} pathOptions={{ color: BRAND_YELLOW, weight: 6 }} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteMap;
