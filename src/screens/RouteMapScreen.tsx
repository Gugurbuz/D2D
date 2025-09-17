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

// Diğer importlar ve tanımlamalar...
// ... (TILE_STYLES, Customer, SalesRep, anadoluCustomers, icon'lar vb. aynı kalacak) ...

/* ==== Ana Bileşen ==== */
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  // ... (Tüm state'ler ve diğer fonksiyonlar aynı kalacak) ...
  
  // YENİ: Özel küme ikonu oluşturma fonksiyonu
  const createClusterCustomIcon = function (cluster: L.MarkerCluster) {
    return L.divIcon({
      html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(33, 33, true),
    });
  };

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const highlightCustomer = (c: Customer) => { /* ... aynı fonksiyon ... */ };
  
  async function handleOptimize() { /* ... aynı fonksiyon ... */ }

  useEffect(() => { /* ... aynı useEffect ... */ }, [starredId]);

  const tile = TILE_STYLES[mapStyle];

  return (
    <div className="relative w-full h-full">
      <Toaster position="top-center" />

      {/* Harita ve Panelleri içeren ana sarmalayıcı */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        {/* ... Kontrol Paneli ... */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/80 py-1 px-2 rounded-lg shadow-lg flex items-center gap-2">
            {/* ... butonlar ... */}
        </div>

        <MapContainer center={[rep.lat, rep.lng]} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)} >
          <TileLayer url={tile.url} attribution={tile.attribution} subdomains={tile.subdomains as any} />
          <FitBounds rep={rep} customers={orderedCustomers} />

          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup><b>{rep.name}</b></Popup>
          </Marker>
        
          {/* GÜNCELLENDİ: MarkerClusterGroup'a iconCreateFunction prop'u eklendi */}
          <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
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

        {/* ... Sağ Panel ... */}
        <div className={`absolute top-4 right-0 bottom-4 z-[999] transition-transform duration-300 ${ panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]" } flex`} >
            {/* ... panel içeriği ... */}
        </div>
        
        {/* ... Yüklenme Ekranı ... */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-[2000] backdrop-blur-sm">
            {/* ... yüklenme içeriği ... */}
          </div>
        )}
      </div>
    </div>
  );
};

/* ==== Fullscreen butonu ==== */
const FullscreenBtn: React.FC = () => { /* ... Fullscreen butonu ... */ };

export default RouteMap;