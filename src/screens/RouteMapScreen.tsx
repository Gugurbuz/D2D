// src/screens/RouteMapScreen.tsx

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import "leaflet-sidebar-v2";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Marker icon (global ayar) — sadece 1 kez yapılmalı
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// TypeScript'e sidebar fonksiyonunu tanıt
declare module "leaflet" {
  namespace control {
    function sidebar(options: any): any;
  }
}

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

type Props = {
  customers?: Customer[];
};

const RouteMapScreen: React.FC<Props> = ({ customers }) => {
  const data: Customer[] =
    customers ??
    [
      {
        id: "1",
        name: "Ali Veli",
        address: "Kadıköy",
        district: "Kadıköy",
        lat: 41.0,
        lng: 29.03,
      },
      {
        id: "2",
        name: "Ayşe Kaya",
        address: "Üsküdar",
        district: "Üsküdar",
        lat: 41.03,
        lng: 29.02,
      },
    ];

  const mapRef = useRef<LeafletMap | null>(null);
  const sidebarRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const initDoneRef = useRef(false);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [starred, setStarred] = useState<Record<string, boolean>>({});

  // SSR koruması
  const isBrowser = typeof window !== "undefined";

  useLayoutEffect(() => {
    if (!isBrowser || !mapRef.current || initDoneRef.current) return;

    if (typeof (L.control as any).sidebar !== "function") {
      console.warn("Sidebar plugin not found.");
      return;
    }

    const sidebar = L.control.sidebar({
      container: "sidebar",
      position: "left",
      autopan: true,
      closeButton: true,
    });

    sidebar.addTo(mapRef.current);
    requestAnimationFrame(() => sidebar.open("panel"));
    sidebarRef.current = sidebar;
    initDoneRef.current = true;
  }, [isBrowser]);

  useEffect(() => {
    if (!mapRef.current || data.length === 0) return;
    const bounds = L.latLngBounds(data.map((c) => [c.lat, c.lng]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }, [data]);

  const registerMarker = (id: string, marker: L.Marker | null) => {
    if (marker) {
      markersRef.current.set(id, marker);
    }
  };

  const focusOn = (c: Customer) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 16), {
      animate: true,
      duration: 0.6,
    });

    const marker = markersRef.current.get(c.id);
    if (marker) {
      mapRef.current.closePopup();
      marker.openPopup();
    }
  };

  const addToRoute = (id: string) =>
    setRouteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const removeFromRoute = (id: string) =>
    setRouteIds((prev) => prev.filter((x) => x !== id));

  const clearRoute = () => setRouteIds([]);

  const toggleStar = (id: string) =>
    setStarred((prev) => ({ ...prev, [id]: !prev[id] }));

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

  const routePoints = useMemo(() => {
    const byId = new Map(data.map((c) => [c.id, c]));
    return routeIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((c) => [c!.lat, c!.lng]) as [number, number][];
  }, [data, routeIds]);

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      {/* Toggle button */}
      <button
        onClick={() =>
          sidebarRef.current?.toggle?.() || sidebarRef.current?.open?.("panel")
        }
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 1100,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,.12)",
          cursor: "pointer",
        }}
      >
        Panel
      </button>

      {/* Sidebar */}
      <div
        id="sidebar"
        className="leaflet-sidebar collapsed"
        style={{ zIndex: 1000, width: 360, maxWidth: "90vw" }}
      >
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
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara: isim / adres / ilçe"
                  style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} title="Temizle">
                    <i className="fa fa-xmark" />
                  </button>
                )}
              </div>

              <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                Seçili: {selectedId ?? "—"} • Rota: {routeIds.length} müşteri
                <button
                  style={{ marginLeft: 8, padding: "2px 6px", border: "1px solid #ccc", borderRadius: 4 }}
                  onClick={clearRoute}
                >
                  Rotayı Temizle
                </button>
              </div>

              <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto", paddingRight: 4 }}>
                {filtered.map((c, i) => {
                  const selected = selectedId === c.id;
                  const inRoute = routeIds.includes(c.id);
                  const isStar = !!starred[c.id];

                  return (
                    <div
                      key={c.id}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 8,
                        marginBottom: 8,
                        backgroundColor: selected ? "#e0f2fe" : "#fff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedId(c.id);
                            focusOn(c);
                          }}
                        >
                          <strong>{i + 1}. {c.name}</strong>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {c.address} {c.district ? `• ${c.district}` : ""}
                          </div>
                          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                            Planlı: {c.plannedTime ?? "-"} • Öncelik: {c.priority ?? "-"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => toggleStar(c.id)} title="Yıldız">
                            <i className={isStar ? "fa fa-star" : "fa-regular fa-star"} />
                          </button>
                          <button
                            onClick={() =>
                              inRoute ? removeFromRoute(c.id) : addToRoute(c.id)
                            }
                            title={inRoute ? "Rotadan çıkar" : "Rotaya ekle"}
                          >
                            <i className={inRoute ? "fa fa-minus" : "fa fa-plus"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!filtered.length && (
                  <div style={{ fontSize: 13, color: "#888" }}>Sonuç bulunamadı.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAP */}
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

        {data.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            eventHandlers={{
              add: (e) => registerMarker(c.id, e.target as L.Marker),
            }}
          >
            <Popup>
              <div style={{ minWidth: 220 }}>
                <strong>{c.name}</strong>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {c.address} {c.district ? `• ${c.district}` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => { setSelectedId(c.id); focusOn(c); }}>
                    <i className="fa fa-location-arrow" />
                  </button>
                  <button
                    onClick={() =>
                      routeIds.includes(c.id)
                        ? removeFromRoute(c.id)
                        : addToRoute(c.id)
                    }
                  >
                    <i className={routeIds.includes(c.id) ? "fa fa-minus" : "fa fa-plus"} />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {routePoints.length >= 2 && (
          <Polyline positions={routePoints} weight={5} opacity={0.9} />
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMapScreen;
