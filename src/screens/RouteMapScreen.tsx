// src/screens/RouteMapScreen.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

// 1) CRITICAL: önce CSS, sonra JS (side-effect) import
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import "leaflet-sidebar-v2";

// (opsiyonel) default marker fix
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Demo data — senin customers'ız yoksa çalışsın
type Customer = {
  id: string;
  name: string;
  address: string;
  district?: string;
  plannedTime?: string;
  priority?: "Yüksek" | "Orta" | "Düşük";
  lat: number;
  lng: number;
};
type Props = { customers?: Customer[] };

const RouteMapScreen: React.FC<Props> = ({ customers }) => {
  const data: Customer[] = useMemo(
    () =>
      customers ?? [
        { id: "1", name: "Ali Veli", address: "Kadıköy", district: "Kadıköy", lat: 41.0, lng: 29.03 },
        { id: "2", name: "Ayşe Kaya", address: "Üsküdar", district: "Üsküdar", lat: 41.03, lng: 29.02 },
      ],
    [customers]
  );

  const mapRef = useRef<LeafletMap | null>(null);
  const sidebarRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const initDoneRef = useRef(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeIds, setRouteIds] = useState<string[]>([]);

  // 2) Sidebar init — ve Plan-B (zorla açma)
  useLayoutEffect(() => {
    const container = document.getElementById("sidebar");
    const pane = document.getElementById("panel");

    // PLAN-B: Eklenti çalışmasa bile içeriği görünür yap (teşhis için)
    if (container) container.classList.remove("collapsed");
    if (pane) pane.classList.add("active");

    if (!mapRef.current || initDoneRef.current) return;

    try {
      const sidebar = (L as any).control.sidebar({
        container: "sidebar",
        position: "left",
        autopan: true,
        closeButton: true,
      });
      sidebar.addTo(mapRef.current);
      requestAnimationFrame(() => sidebar.open("panel")); // zamanlama güvenli
      sidebarRef.current = sidebar;
      initDoneRef.current = true;
      // Konsola not düş
      console.log("[leaflet-sidebar] init OK");
    } catch (e) {
      console.warn("[leaflet-sidebar] init FAILED → Plan-B ile gösteriliyor.", e);
      // Plan-B zaten yukarıda görünür yaptı
    }
  }, []);

  // 3) İlk yüklemede fitBounds
  useEffect(() => {
    if (!mapRef.current || data.length === 0) return;
    const bounds = L.latLngBounds(data.map((c) => [c.lat, c.lng]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }, [data]);

  const registerMarker = (id: string, m: L.Marker | null) => {
    if (m) markersRef.current.set(id, m);
  };

  const focusOn = (c: Customer) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 16), {
      animate: true, duration: 0.6,
    });
    const mk = markersRef.current.get(c.id);
    if (mk) {
      mapRef.current.closePopup();
      mk.openPopup();
    }
  };

  const addToRoute = (id: string) => setRouteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeFromRoute = (id: string) => setRouteIds((prev) => prev.filter((x) => x !== id));

  const routePoints = useMemo(() => {
    const byId = new Map(data.map((c) => [c.id, c]));
    return routeIds.map((id) => byId.get(id)).filter(Boolean).map((c) => [c!.lat, c!.lng]) as [number, number][];
  }, [data, routeIds]);

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      {/* Sidebar container */}
      <div
        id="sidebar"
        className="leaflet-sidebar"
        style={{ zIndex: 1000, width: 360, maxWidth: "90vw" }}
      >
        <div className="leaflet-sidebar-tabs">
          <ul role="tablist">
            <li><a href="#panel" title="Panel"><i className="fa fa-bars" /></a></li>
          </ul>
        </div>

        <div className="leaflet-sidebar-content">
          {/* PANE ID tam eşleşmeli */}
          <div className="leaflet-sidebar-pane" id="panel">
            <h1 className="leaflet-sidebar-header">
              Panel
              <span className="leaflet-sidebar-close"><i className="fa fa-caret-left" /></span>
            </h1>

            {/* İçerik */}
            <div style={{ padding: "10px 12px", fontSize: 12, color: "#555" }}>
              <div className="mb-2">
                <b>Durum:</b> Sidebar içerik render edildi.
              </div>

              <div style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto", paddingRight: 4 }}>
                {data.map((c, i) => {
                  const inRoute = routeIds.includes(c.id);
                  const selected = selectedId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`border rounded-lg p-3 mb-2 ${selected ? "bg-sky-50 border-sky-300" : "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div onClick={() => { setSelectedId(c.id); focusOn(c); }} style={{ cursor: "pointer" }}>
                          <div className="font-bold">{i + 1}. {c.name}</div>
                          <div className="text-xs text-gray-600">
                            {c.address} {c.district ? `• ${c.district}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {inRoute ? (
                            <button className="px-2 py-1 border rounded" onClick={() => removeFromRoute(c.id)} title="Rotadan çıkar">
                              <i className="fa fa-minus" />
                            </button>
                          ) : (
                            <button className="px-2 py-1 border rounded" onClick={() => addToRoute(c.id)} title="Rotaya ekle">
                              <i className="fa fa-plus" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        {data.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} ref={(mk) => registerMarker(c.id, mk)}>
            <Popup>
              <div style={{ minWidth: 220 }}>
                <div className="font-bold mb-1">{c.name}</div>
                <div className="text-xs text-gray-600">
                  {c.address} {c.district ? `• ${c.district}` : ""}
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="px-2 py-1 border rounded" onClick={() => { setSelectedId(c.id); focusOn(c); }}>
                    <i className="fa fa-location-arrow" />
                  </button>
                  {routeIds.includes(c.id) ? (
                    <button className="px-2 py-1 border rounded" onClick={() => removeFromRoute(c.id)}>
                      <i className="fa fa-minus" />
                    </button>
                  ) : (
                    <button className="px-2 py-1 border rounded" onClick={() => addToRoute(c.id)}>
                      <i className="fa fa-plus" />
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {routePoints.length >= 2 && <Polyline positions={routePoints} weight={5} opacity={0.9} />}
      </MapContainer>
    </div>
  );
};

export default RouteMapScreen;
