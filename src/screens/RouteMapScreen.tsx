// src/screens/RouteMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

// Sidebar eklentisi
import "leaflet-sidebar-v2/css/leaflet-sidebar.css";
import "leaflet-sidebar-v2";

// Projendeki Customer tipini kullan
import { Customer } from "../RouteMap";
// İstersen mock veriyi bağla:
// import { mockCustomers } from "../data/mockCustomers";

// (Opsiyonel) varsayılan Leaflet marker ikon fix'i (Vite/React projelerinde gerekebilir)
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

type Props = {
  customers?: Customer[]; // dışarıdan da geçebilirsin
};

const RouteMapScreen: React.FC<Props> = ({ customers }) => {
  // Kendi verin yoksa boş dizi (veya mockCustomers)
  const data: Customer[] = useMemo(() => customers ?? [], [customers]);

  const mapRef = useRef<LeafletMap | null>(null);
  const sidebarRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [routeIds, setRouteIds] = useState<string[]>([]); // seçilen sıralı müşteri listesi

  // Sidebar'ı kur
  useEffect(() => {
    if (!mapRef.current) return;
    // @ts-ignore - plug-in global ekler
    const sidebar = L.control.sidebar({
      position: "left",
      autopan: true,
      closeButton: true,
      container: "sidebar",
    });
    sidebar.addTo(mapRef.current);
    sidebar.open("customers");
    sidebarRef.current = sidebar;
  }, []);

  // Müşteriye tıklayınca haritada flyTo + popup aç
  const focusCustomerOnMap = (cust: Customer) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([cust.lat, cust.lng], Math.max(mapRef.current.getZoom(), 16), {
      animate: true,
      duration: 0.6,
    });
    const mk = markersRef.current.get(cust.id);
    if (mk) {
      // önce diğer açık popup'ları kapat
      mapRef.current.closePopup();
      mk.openPopup();
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    focusCustomerOnMap(cust);
  };

  const toggleStar = (custId: string) => {
    setStarred((prev) => ({ ...prev, [custId]: !prev[custId] }));
  };

  const addToRoute = (custId: string) => {
    setRouteIds((prev) => (prev.includes(custId) ? prev : [...prev, custId]));
  };

  const removeFromRoute = (custId: string) => {
    setRouteIds((prev) => prev.filter((id) => id !== custId));
  };

  const clearRoute = () => setRouteIds([]);

  // Basit arama filtresi
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.district ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  // Route polyline noktaları (seçilmiş sıra)
  const routePoints = useMemo(() => {
    const idToCust = new Map(data.map((c) => [c.id, c]));
    return routeIds
      .map((id) => idToCust.get(id))
      .filter(Boolean)
      .map((c) => [c!.lat, c!.lng]) as [number, number][];
  }, [data, routeIds]);

  // Marker referanslarını kaydet
  const registerMarker = (custId: string, marker: L.Marker | null) => {
    if (!marker) return;
    markersRef.current.set(custId, marker);
  };

  // Z-index çakışmalarını hafif düzenleyen küçük stiller
  // (zoom butonları sidebar altında kalmasın, sidebar her zaman üstte olsun)
  const overlayStyle: React.CSSProperties = { display: "flex", height: "100vh", position: "relative" };

  return (
    <div style={overlayStyle}>
      {/* Sidebar container */}
      <div id="sidebar" className="leaflet-sidebar collapsed" style={{ zIndex: 900 }}>
        <div className="leaflet-sidebar-tabs">
          <ul role="tablist">
            <li>
              <a href="#customers" title="Müşteriler">
                <i className="fa fa-users" />
              </a>
            </li>
            <li>
              <a href="#route" title="Rota">
                <i className="fa fa-route" />
              </a>
            </li>
          </ul>
        </div>

        <div className="leaflet-sidebar-content">
          {/* MÜŞTERİLER */}
          <div className="leaflet-sidebar-pane" id="customers">
            <h1 className="leaflet-sidebar-header">
              Müşteriler
              <span className="leaflet-sidebar-close">
                <i className="fa fa-caret-left" />
              </span>
            </h1>

            <div style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara: isim / adres / ilçe"
                  className="border rounded px-3 py-2 w-full"
                />
                <button
                  className="px-3 py-2 border rounded"
                  onClick={() => setSearch("")}
                  title="Temizle"
                >
                  <i className="fa fa-xmark" />
                </button>
              </div>

              <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto", paddingRight: 4 }}>
                {filtered.map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  const isStar = !!starred[c.id];

                  return (
                    <div
                      key={c.id}
                      className="border rounded-lg p-10"
                      style={{
                        padding: 10,
                        marginBottom: 8,
                        borderColor: isSelected ? "#0ea5e9" : "#e5e7eb",
                        background: isSelected ? "#f0f9ff" : "#fff",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSelectCustomer(c)}
                        title="Haritada göster"
                      >
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>
                          {c.address} {c.district ? `• ${c.district}` : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                          Planlı Saat: {c.plannedTime ?? "-"} • Öncelik: {c.priority ?? "-"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={() => toggleStar(c.id)}
                          title={isStar ? "Yıldızı kaldır" : "Yıldızla"}
                        >
                          <i className={isStar ? "fa fa-star" : "fa-regular fa-star"} />
                        </button>
                        {routeIds.includes(c.id) ? (
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={() => removeFromRoute(c.id)}
                            title="Rotadan çıkar"
                          >
                            <i className="fa fa-minus" />
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={() => addToRoute(c.id)}
                            title="Rotaya ekle"
                          >
                            <i className="fa fa-plus" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!filtered.length && (
                  <div style={{ color: "#666", fontSize: 14 }}>Sonuç bulunamadı.</div>
                )}
              </div>
            </div>
          </div>

          {/* ROTA */}
          <div className="leaflet-sidebar-pane" id="route">
            <h1 className="leaflet-sidebar-header">
              Rota
              <span className="leaflet-sidebar-close">
                <i className="fa fa-caret-left" />
              </span>
            </h1>

            <div style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button className="px-3 py-2 border rounded" onClick={clearRoute}>
                  Temizle
                </button>
                <div style={{ fontSize: 13, color: "#555", alignSelf: "center" }}>
                  Seçili müşteri sayısı: {routeIds.length}
                </div>
              </div>

              <ol style={{ paddingLeft: 18, maxHeight: "calc(100vh - 220px)", overflow: "auto" }}>
                {routeIds.map((id, idx) => {
                  const c = data.find((x) => x.id === id);
                  if (!c) return null;
                  return (
                    <li key={id} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 8,
                          alignItems: "center",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          padding: 8,
                          background: "#fff",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {idx + 1}. {c.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#555" }}>
                            {c.address} {c.district ? `• ${c.district}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={() => handleSelectCustomer(c)}
                            title="Haritada göster"
                          >
                            <i className="fa fa-location-arrow" />
                          </button>
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={() => removeFromRoute(id)}
                            title="Rotadan çıkar"
                          >
                            <i className="fa fa-trash" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {!routeIds.length && (
                  <div style={{ color: "#666", fontSize: 14 }}>
                    Rotaya müşteri eklemek için “Müşteriler” sekmesinden <b>+</b> butonunu kullan.
                  </div>
                )}
              </ol>

              <div style={{ marginTop: 12, fontSize: 12, color: "#777" }}>
                Not: Buradaki polyline yalnızca seçili müşterileri sırayla bağlar. Gerçek rota
                (trafik/optimizasyon) için OSRM/Valhalla/Google Directions gibi bir servis çağırın.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Harita */}
      <MapContainer
        center={[41.015, 28.979]} // İstanbul civarı
        zoom={12}
        style={{ flex: 1, zIndex: 1 }} // sidebar üstte kalsın
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Markerlar */}
        {data.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            ref={(mk) => registerMarker(c.id, mk)}
            eventHandlers={{
              click: () => {
                setSelectedCustomerId(c.id);
              },
            }}
          >
            <Popup>
              <div style={{ minWidth: 220 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {c.address} {c.district ? `• ${c.district}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
                  Planlı Saat: {c.plannedTime ?? "-"} • Öncelik: {c.priority ?? "-"}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={() => toggleStar(c.id)}
                    title={starred[c.id] ? "Yıldızı kaldır" : "Yıldızla"}
                  >
                    <i className={starred[c.id] ? "fa fa-star" : "fa-regular fa-star"} />
                  </button>
                  {routeIds.includes(c.id) ? (
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() => removeFromRoute(c.id)}
                      title="Rotadan çıkar"
                    >
                      <i className="fa fa-minus" />
                    </button>
                  ) : (
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() => addToRoute(c.id)}
                      title="Rotaya ekle"
                    >
                      <i className="fa fa-plus" />
                    </button>
                  )}
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={() => handleSelectCustomer(c)}
                    title="Haritada odakla"
                  >
                    <i className="fa fa-location-arrow" />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Seçililere göre polyline (sıralı) */}
        {routePoints.length >= 2 && (
          <Polyline positions={routePoints} weight={5} opacity={0.9} />
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMapScreen;
