// src/screens/RouteMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-sidebar-v2/css/leaflet-sidebar.css";
import "leaflet-sidebar-v2";

import { Customer } from "../RouteMap";

// (Opsiyonel) Vite/React'te default marker ikon düzeltmesi:
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/* Basit Accordion bileşeni */
type AccordionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};
const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <button
        className="w-full flex items-center justify-between px-3 py-2 font-semibold bg-gray-100 rounded-t-lg"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="text-left">{title}</div>
        <i className={`fa fa-chevron-${open ? "up" : "down"} text-sm`} />
      </button>
      {open && <div className="px-3 py-3 bg-white rounded-b-lg">{children}</div>}
    </div>
  );
};

type Props = {
  customers?: Customer[]; // dışarıdan gelebilir; yoksa boş dizi kullanılır
};

const RouteMapScreen: React.FC<Props> = ({ customers }) => {
  const data: Customer[] = useMemo(() => customers ?? [], [customers]);

  const mapRef = useRef<LeafletMap | null>(null);
  const sidebarRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [routeIds, setRouteIds] = useState<string[]>([]);

  // Leaflet Sidebar init
  useEffect(() => {
    if (!mapRef.current) return;
    const sidebar = L.control.sidebar({
      container: "sidebar",
      position: "left",
      autopan: true,
      closeButton: true,
    });
    sidebar.addTo(mapRef.current);
    sidebar.open("panel"); // içerik pane'i
    sidebarRef.current = sidebar;
  }, []);

  // İlk açılışta tüm noktaları kapsa
  useEffect(() => {
    if (!mapRef.current || data.length === 0) return;
    const bounds = L.latLngBounds(data.map((c) => [c.lat, c.lng]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }, [data]);

  // Yardımcılar
  const registerMarker = (id: string, m: L.Marker | null) => {
    if (m) markersRef.current.set(id, m);
  };

  const focusCustomerOnMap = (cust: Customer) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([cust.lat, cust.lng], Math.max(mapRef.current.getZoom(), 16), {
      animate: true,
      duration: 0.6,
    });
    const mk = markersRef.current.get(cust.id);
    if (mk) {
      mapRef.current.closePopup();
      mk.openPopup();
    }
  };

  const onSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    focusCustomerOnMap(c);
  };

  const onToggleStar = (id: string) => {
    setStarred((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onAddToRoute = (id: string) =>
    setRouteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const onRemoveFromRoute = (id: string) =>
    setRouteIds((prev) => prev.filter((x) => x !== id));
  const onClearRoute = () => setRouteIds([]);

  // Arama filtresi
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.district ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  // Seçilmiş müşterilerden polyline
  const routePoints = useMemo(() => {
    const idToCust = new Map(data.map((c) => [c.id, c]));
    return routeIds
      .map((id) => idToCust.get(id))
      .filter(Boolean)
      .map((c) => [c!.lat, c!.lng]) as [number, number][];
  }, [data, routeIds]);

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      {/* Leaflet Sidebar */}
      <div id="sidebar" className="leaflet-sidebar collapsed" style={{ zIndex: 900 }}>
        <div className="leaflet-sidebar-tabs">
          <ul role="tablist">
            <li>
              <a href="#panel" title="Panel">
                <i className="fa fa-bars" />
              </a>
            </li>
          </ul>
        </div>

        <div className="leaflet-sidebar-content">
          <div className="leaflet-sidebar-pane" id="panel">
            <h1 className="leaflet-sidebar-header">
              Panel
              <span className="leaflet-sidebar-close">
                <i className="fa fa-caret-left" />
              </span>
            </h1>

            <div style={{ padding: "10px 12px" }}>
              {/* Arama + Özet */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara: isim / adres / ilçe"
                  className="border rounded px-3 py-2 w-full"
                />
                {search && (
                  <button className="px-3 py-2 border rounded" onClick={() => setSearch("")}>
                    <i className="fa fa-xmark" />
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-600 mb-3">
                Seçili: {selectedCustomerId ?? "—"} • Rota: {routeIds.length} müşteri
                <button
                  className="ml-3 px-2 py-1 border rounded"
                  onClick={onClearRoute}
                  title="Rotayı temizle"
                >
                  Temizle
                </button>
              </div>

              {/* Müşteri listesi (accordion kartlar) */}
              <div style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto", paddingRight: 4 }}>
                {filtered.map((c) => {
                  const selected = selectedCustomerId === c.id;
                  const inRoute = routeIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      className={`mb-2 ${selected ? "ring-1 ring-sky-300 rounded-lg" : ""}`}
                    >
                      <Accordion
                        title={
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold">{c.name}</div>
                              <div className="text-xs text-gray-600">
                                {c.address} {c.district ? `• ${c.district}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                className="px-2 py-1 border rounded"
                                title={starred[c.id] ? "Yıldızı kaldır" : "Yıldızla"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStar(c.id);
                                }}
                              >
                                <i className={starred[c.id] ? "fa fa-star" : "fa-regular fa-star"} />
                              </button>
                              {inRoute ? (
                                <button
                                  className="px-2 py-1 border rounded"
                                  title="Rotadan çıkar"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveFromRoute(c.id);
                                  }}
                                >
                                  <i className="fa fa-minus" />
                                </button>
                              ) : (
                                <button
                                  className="px-2 py-1 border rounded"
                                  title="Rotaya ekle"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToRoute(c.id);
                                  }}
                                >
                                  <i className="fa fa-plus" />
                                </button>
                              )}
                            </div>
                          </div>
                        }
                        defaultOpen={false}
                      >
                        {/* Accordion içeriği (detaylar) */}
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>
                            <span className="font-semibold">Planlı Saat:</span>{" "}
                            {c.plannedTime ?? "-"}
                          </div>
                          <div>
                            <span className="font-semibold">Öncelik:</span>{" "}
                            {c.priority ?? "-"}
                          </div>
                          {c.tariff && (
                            <div>
                              <span className="font-semibold">Tarife:</span> {c.tariff}
                            </div>
                          )}
                          {c.meterNumber && (
                            <div>
                              <span className="font-semibold">Sayaç No:</span> {c.meterNumber}
                            </div>
                          )}
                          {c.consumption && (
                            <div>
                              <span className="font-semibold">Tüketim:</span> {c.consumption}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            className="px-3 py-2 border rounded"
                            onClick={() => onSelectCustomer(c)}
                            title="Haritada göster"
                          >
                            <i className="fa fa-location-arrow mr-1" />
                            Haritada Göster
                          </button>
                          <button
                            className="px-3 py-2 border rounded"
                            onClick={() => onAddToRoute(c.id)}
                            disabled={inRoute}
                            title="Rotaya ekle"
                          >
                            <i className="fa fa-route mr-1" />
                            Rotaya Ekle
                          </button>
                        </div>
                      </Accordion>
                    </div>
                  );
                })}

                {!filtered.length && (
                  <div className="text-sm text-gray-600">Sonuç bulunamadı.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Harita */}
      <MapContainer
        center={[41.015, 28.979]}
        zoom={12}
        style={{ flex: 1, zIndex: 1 }}
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Markerlar */}
        {data.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            ref={(mk) => registerMarker(c.id, mk)}
            eventHandlers={{ click: () => setSelectedCustomerId(c.id) }}
          >
            <Popup>
              <div style={{ minWidth: 220 }}>
                <div className="font-bold mb-1">{c.name}</div>
                <div className="text-xs text-gray-600">
                  {c.address} {c.district ? `• ${c.district}` : ""}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Planlı: {c.plannedTime ?? "-"} • Öncelik: {c.priority ?? "-"}
                </div>

                <div className="flex gap-2 mt-2">
                  <button className="px-2 py-1 border rounded" onClick={() => onToggleStar(c.id)}>
                    <i className={starred[c.id] ? "fa fa-star" : "fa-regular fa-star"} />
                  </button>
                  {routeIds.includes(c.id) ? (
                    <button className="px-2 py-1 border rounded" onClick={() => onRemoveFromRoute(c.id)}>
                      <i className="fa fa-minus" />
                    </button>
                  ) : (
                    <button className="px-2 py-1 border rounded" onClick={() => onAddToRoute(c.id)}>
                      <i className="fa fa-plus" />
                    </button>
                  )}
                  <button className="px-2 py-1 border rounded" onClick={() => onSelectCustomer(c)}>
                    <i className="fa fa-location-arrow" />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Seçili müşterilere göre polyline (varsayılan renk) */}
        {routePoints.length >= 2 && <Polyline positions={routePoints} weight={5} opacity={0.9} />}
      </MapContainer>
    </div>
  );
};

export default RouteMapScreen;
