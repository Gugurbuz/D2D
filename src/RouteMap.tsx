import React, { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Customer = {
  id: string;
  name: string;
  address: string;
  district: string;
  plannedTime: string;
  priority: "Yüksek" | "Orta" | "Düşük";
  tariff: string;
  meterNumber: string;
  consumption: string;
  offerHistory: string[];
  status: "Bekliyor" | "Yolda" | "Tamamlandı";
  estimatedDuration: string;
  distance: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers: Customer[];
  onBack?: () => void;
}

// Satış uzmanı placeholder ikonu (logo)
const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

// Müşteri için numaralı divIcon
function numberIcon(n: number, highlight = false) {
  return L.divIcon({
    className: "number-marker",
    html: `
      <div style="
        width:28px;height:28px;display:flex;align-items:center;justify-content:center;
        font-weight:800;font-size:12px;color:#fff;line-height:1;
        background:${highlight ? "#FF6B00" : "#0099CB"};
        border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);
        transform:${highlight ? "scale(1.12)" : "scale(1)"};
      ">
        ${n}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(km) + " km";

const RouteMap: React.FC<Props> = ({ customers, onBack }) => {
  // Satış temsilcisi merkezini; müşterilerin ortalama konumuna göre bulalım (yaklaşık)
  const center: LatLng = [
    customers.reduce((s, c) => s + c.lat, 0) / customers.length,
    customers.reduce((s, c) => s + c.lng, 0) / customers.length,
  ];

  const [orderedCustomers, setOrderedCustomers] = useState(customers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const handleOptimize = async () => {
    // OSRM trip: tüm müşteri noktalarını verip en iyi sıralamayı iste
    const coords = customers.map((c) => `${c.lng},${c.lat}`).join(";");
    const url =
      `https://router.project-osrm.org/trip/v1/driving/${coords}` +
      `?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
      const data = await res.json();
      if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");

      // Sıralı müşteri listesi
      const waySorted = data.waypoints
        .map((wp: any, inputIdx: number) => ({
          inputIdx,
          order: wp.waypoint_index,
        }))
        .sort((a: any, b: any) => a.order - b.order)
        .map((x: any) => customers[x.inputIdx]);

      setOrderedCustomers(waySorted);

      // Çizilecek polyline
      const geom = data.trips[0].geometry;
      const latlngs: LatLng[] = geom.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(latlngs);

      // Mesafe (m → km)
      const totalMeters: number = data.trips[0].distance;
      setRouteKm(totalMeters / 1000);
    } catch (e) {
      console.error(e);
      // OSRM olmazsa Haversine ile kaba rota + mesafe
      const seq: LatLng[] = customers.map((c) => [c.lat, c.lng]);
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteKm(acc);
      setRouteCoords(seq);
      setOrderedCustomers(customers);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Üst bar */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Rota Haritası</h1>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-700">
              Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
            </div>
            <button
              onClick={handleOptimize}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                loading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#0099CB] text-white hover:opacity-90"
              }`}
            >
              {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
              >
                ← Geri
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Harita */}
          <div className="lg:col-span-3">
            <div className="h-[560px] w-full rounded-2xl overflow-hidden shadow">
              <MapContainer
                center={center}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                {/* (Opsiyonel) Temsilci marker'ı → merkez noktaya koyuyoruz */}
                <Marker position={center} icon={repIcon}>
                  <Popup>
                    <b>Satış Uzmanı</b>
                    <div>Güncel konum (yaklaşık merkez)</div>
                  </Popup>
                </Marker>

                {/* Müşteriler */}
                {orderedCustomers.map((c, i) => (
                  <Marker
                    key={c.id}
                    position={[c.lat, c.lng]}
                    icon={numberIcon(i + 1, c.id === selectedId)}
                    eventHandlers={{
                      click: () => setSelectedId(c.id),
                    }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <div>
                          <b>{i + 1}. {c.name}</b>
                        </div>
                        <div>{c.address}, {c.district}</div>
                        <div>Saat: {c.plannedTime}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Rota çizgisi */}
                {routeCoords.length > 0 && (
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: "#0099CB", weight: 7 }}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* Liste */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow p-4 max-h-[560px] overflow-auto">
              <h2 className="font-semibold text-gray-800 mb-2">Ziyaret Sırası</h2>
              <div className="space-y-2">
                {orderedCustomers.map((c, i) => {
                  const selected = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selected
                          ? "bg-[#0099CB]/10 border-[#0099CB]/30"
                          : "bg-white hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-sm font-bold ${
                            selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {c.name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {c.address}, {c.district}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-700 font-semibold">
                          {c.plannedTime}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-50">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
