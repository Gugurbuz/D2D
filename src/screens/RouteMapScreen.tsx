// src/screens/RouteMapScreen.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

// ÖNEMLİ: önce CSS, sonra JS (side-effect) import
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import "leaflet-sidebar-v2";

// (opsiyonel) default marker fix (Vite/React)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Projendeki tipinle uyumlu basit Customer tipi (kendi tipini import edebilirsin)
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
  // Demo veri (dışarıdan customers gelmezse boş kalmasın)
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
  const initDoneRef = useRef(false); // StrictMode tekrarlı init koruması

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [starred, setStarred] = useState<Record<string, boolean>>({});

  // Leaflet Sidebar init (Plan-B hack YOK)
  useLayoutEffect(() => {
    if (!mapRef.current || initDoneRef.current) return;
    const sidebar = (L as any).control.sidebar({
      container: "sidebar",
      position: "left",
      autopan: true,
      closeButton: true,
    });
    sidebar.addTo(mapRef.current);
    requestAnimationFrame(() => sidebar.open("panel")); // açılışta panel açık
    sidebarRef.current = sidebar;
    initDoneRef.current = true;
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

  const focusOn = (c: Customer) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 16), {
      animate: true,
      duration: 0.6,
    });
    const mk = markersRef.current.get(c.id);
    if (mk) {
      mapRef.current.closePopup();
      mk.openPopup();
    }
  };

  const addToRoute = (id: string) => setRouteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeFromRoute = (id: string) => setRouteIds((prev) => prev.filter((x) => x !== id));
  const clearRoute = () => setRouteIds([]);

  const toggleStar = (id: string) => setStarred((p) => ({ ...p, [id]: !p[id] }));

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

  // Polyline noktaları (rota sırasına göre)
  const routePoints = useMemo(() => {
    const byId = new Map(data.map((c) => [c.id, c]));
    return routeIds.map((id) => byId.get(id)).filter(Boolean).map((c) => [c!.lat, c!.lng]) as [number, number][];
  }, [data, routeIds]);

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      {/* Aç/Kapa butonu (haritanın üstüne) */}
      <button
        onClick={() => sidebarRef.current?.toggle?.() || sidebarRef.current?.open?.("panel")}
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
        title="Paneli Aç/Kapat"
      >
        Panel
      </button>

      {/* LEAFLET SIDEBAR CONTAINER — collapsed (eklenti yönetsin) */}
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
          {/* PANE ID = 'panel' */}
          <div className="leaflet-sidebar-pane" id="panel">
            <h1 className="leaflet-sidebar-header">
              Panel
              <span className="leaflet-sidebar-close">
                <i className="fa fa-caret-left" />
              </span>
            </h1>

            {/* İçerik */}
            <div style={{ padding: "10px 12px" }}>
              {/* Arama + özet */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara: isim / adres / ilçe"
                  className="border rounded px-3 py-2 w-full"
                />
                {search && (
                  <button className="px-3 py-2 border rounded" onClick={() => setSearch("")} title="Temizle">
                    <i className="fa fa-xmark" />
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-600 mb-3">
                Seçili: {selectedId ?? "—"} • Rota: {routeIds.length} müşteri
                <button className="ml-3 px-2 py-1 border rounded" onClick={clearRoute}>
                  Rotayı Temizle
                </button>
              </div>

              {/* Müşteriler */}
              <div style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto", paddingRight: 4 }}>
                {filtered.map((c, i) => {
                  const selected = selectedId === c.id;
                  const inRoute = routeIds.includes(c.id);
                  const isStar = !!starred[c.id];

                  return (
                    <div
                      key={c.id}
                      className={`border rounded-lg p-3 mb-2 ${selected ? "bg-sky-50 border-sky-300" : "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedId(c.id);
                            focusOn(c);
                          }}
                          title="Haritada odakla"
                        >
                          <div className="font-bold">{i + 1}. {c.name}</div>
                          <div className="text-xs text-gray-600">
                            {c.address} {c.district ? `• ${c.district}` : ""}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Planlı: {c.plannedTime ?? "-"} • Öncelik: {c.priority ?? "-"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="px-2 py-1 border rounded" onClick={() => toggleStar(c.id)} title={isStar ? "Yıldızı kaldır" : "Yıldızla"}>
                            <i className={isStar ? "fa fa-star" : "fa-regular fa-star"} />
                          </button>

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

                {!filtered.length && <div className="text-sm text-gray-600">Sonuç bulunamadı.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HARİTA */}
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
