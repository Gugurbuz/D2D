import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// @ts-ignore - types opsiyonel
import "leaflet-draw";
import {
  ArrowLeft,
  Route as RouteIcon,
  Ruler,
  Users,
  XCircle,
  Info,
  Minimize2,
} from "lucide-react";
import { Customer } from "../RouteMap";
import { Rep } from "../types";

/* ------------------------------------------------
   Tipler & Props
------------------------------------------------ */
type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<
    React.SetStateAction<Record<string, string | undefined>>
  >;
  allReps: Rep[];
  onBack: () => void;
};

/* ------------------------------------------------
   Ufak yardımcılar
------------------------------------------------ */
type LatLng = [number, number];

const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(km) + " km";

/** Basit point-in-polygon (ray casting) */
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Haversine fallback */
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

/** OSRM helpers */
async function osrmTrip(coords: string) {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");
  return data;
}

/* ------------------------------------------------
   Marker stilleri (rep rengine göre customer marker)
------------------------------------------------ */
const REP_COLORS: Record<string, string> = {
  "rep-1": "#0ea5e9", // mavi
  "rep-2": "#22c55e", // yeşil
  "rep-3": "#f97316", // turuncu
  _default: "#9ca3af", // gri (atanmamış)
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const s = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return s.toUpperCase();
}

function repIconFor(rep: Rep) {
  const bg = REP_COLORS[rep.id] || "#111827";
  return L.divIcon({
    className: "rep-marker",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:30px;height:30px;border-radius:50%;
        background:${bg};color:#fff;border:2px solid #fff;
        font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25);
      ">${initials(rep.name)}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -24],
  });
}

function customerIcon(color: string, highlighted = false) {
  const ring = highlighted ? "box-shadow:0 0 0 6px rgba(0,0,0,.08);" : "";
  return L.divIcon({
    className: "cust-marker",
    html: `
      <div style="
        width:22px;height:22px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,.25);${ring}
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -18],
  });
}

/* ------------------------------------------------
   Ana Bileşen
------------------------------------------------ */
const AssignmentMapScreen: React.FC<Props> = ({
  customers,
  assignments,
  setAssignments,
  allReps: reps,
  onBack,
}) => {
  const mapCenter: LatLng = [40.9368, 29.1553]; // Maltepe civarı
  const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");

  // çizilen çokgen
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // rota
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // sağ panel
  const [panelOpen, setPanelOpen] = useState(true);

  // toast
  const [toast, setToast] = useState<string | null>(null);

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  // mevcut atamalara göre marker rengi
  const colorForCustomer = (c: Customer) => {
    const rid = assignments[c.id];
    return REP_COLORS[rid || "_default"] || REP_COLORS._default;
  };

  // Çokgen çizildiğinde
  const handlePolygonCreated = async (poly: L.Polygon) => {
    // Öncekini kaldır
    if (polygonLayerRef.current) polygonLayerRef.current.remove();
    polygonLayerRef.current = poly;

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map((p) => [p.lat, p.lng]) as LatLng[];

    // poligon içindeki müşteriler → sadece seçime ekle (OTOMATİK ATAMA YOK)
    const inside = customers.filter((c) => pointInPolygon([c.lat, c.lng], latlngs));
    const insideIds = inside.map((c) => c.id);
    setSelectedIds(insideIds);

    // otomatik rota (bilgi amaçlı)
    await computeRouteForSelection(inside);
  };

  // Rota hesaplama (seçilenler için)
  const computeRouteForSelection = async (list: Customer[]) => {
    try {
      setLoading(true);
      setRouteCoords([]);
      setRouteKm(null);

      if (!list.length) return;

      const rep = reps.find((r) => r.id === selectedRepId) || reps[0];
      const start: LatLng = [rep.lat, rep.lng];

      const coords = [start, ...list.map((c) => [c.lat, c.lng] as LatLng)]
        .map((p) => `${p[1]},${p[0]}`)
        .join(";");

      const data = await osrmTrip(coords);
      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(latlngs);
      setRouteKm((data.trips[0].distance as number) / 1000);
    } catch {
      // Fallback: sırayla haversine
      const rep = reps.find((r) => r.id === selectedRepId) || reps[0];
      const seq = [[rep.lat, rep.lng] as LatLng, ...list.map((c) => [c.lat, c.lng] as LatLng)];
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteCoords(seq);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };

  // Draw control ekle
  const DrawControl = () => {
    const map = useMap();
    useEffect(() => {
      const drawControl = new (L as any).Control.Draw({
        draw: {
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: { color: "#ff0000", message: "<strong>Hata:</strong> Çokgen kendiyle kesişemez" },
          },
        },
        edit: {
          featureGroup: new L.FeatureGroup(),
          edit: false,
          remove: true,
        },
      });

      map.addControl(drawControl);

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        const layer = e.layer as L.Polygon;
        map.addLayer(layer);
        handlePolygonCreated(layer);
      });

      map.on((L as any).Draw.Event.DELETED, () => {
        polygonLayerRef.current = null;
        setSelectedIds([]);
        setRouteCoords([]);
        setRouteKm(null);
      });

      return () => {
        map.removeControl(drawControl);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, customers, selectedRepId]);

    return null;
  };

  return (
    <div className="p-4">
      {/* Üst bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <div className="flex items-center gap-2 ml-2">
            <RouteIcon className="w-5 h-5 text-[#0099CB]" />
            Haritadan Görev Atama
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Satış Uzmanı:</span>
            <select
              value={selectedRepId}
              onChange={(e) => {
                setSelectedRepId(e.target.value);
                // rep değişince mevcut seçim için rotayı tekrar hesapla
                computeRouteForSelection(selectedCustomers);
              }}
              className="border rounded-lg px-2 py-1"
            >
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-700 hidden sm:flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>
              Seçilen: <b>{selectedIds.length}</b>
            </span>
          </div>

          <div className="text-sm text-gray-700 hidden sm:flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>
              Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Harita + Sağ Panel */}
      <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
        <MapContainer
          center={mapCenter as LatLngExpression}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <DrawControl />

          {/* Rep Marker'ları (baş harfler) */}
          {reps.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={repIconFor(r)}>
              <Popup>
                <div className="space-y-1">
                  <b>{r.name}</b>
                  <div>ID: {r.id}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Müşteri Marker'ları (atanan renkle) */}
          {customers.map((c) => {
            const color = colorForCustomer(c);
            const highlighted = selectedIds.includes(c.id);
            return (
              <Marker
                key={c.id}
                position={[c.lat, c.lng]}
                icon={customerIcon(color, highlighted)}
              >
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-gray-600">
                      {c.address}, {c.district}
                    </div>
                    <div className="text-sm">Saat: {c.plannedTime}</div>
                    <div className="text-sm">Tel: {c.phone}</div>
                    <div className="text-xs text-gray-500">
                      Atanan:{" "}
                      <b>
                        {assignments[c.id]
                          ? reps.find((r) => r.id === assignments[c.id])?.name || assignments[c.id]
                          : "—"}
                      </b>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          setSelectedIds((prev) =>
                            prev.includes(c.id) ? prev : [...prev, c.id]
                          )
                        }
                        className="px-3 py-1.5 rounded bg-white border text-xs"
                      >
                        Seçime Ekle
                      </button>
                      <button
                        onClick={() =>
                          setAssignments((prev) => ({ ...prev, [c.id]: selectedRepId }))
                        }
                        className="px-3 py-1.5 rounded bg-[#0099CB] text-white text-xs"
                      >
                        Bu Müşteriyi Ata
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Rota çizgisi (seçilen çokgen için) */}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords as LatLngExpression[]} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>

        {/* SAĞ PANEL – z-index YÜKSEK */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-[1000] transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-[calc(100%-1.5rem)]"
          } flex`}
        >
          {/* Toggle Bar */}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white"
            title={panelOpen ? "Paneli kapat" : "Paneli aç"}
          >
            {panelOpen ? (
              <Minimize2 className="w-4 h-4 -rotate-90" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="rotate-90 text-[10px] font-bold tracking-wider">SEÇİM</span>
                <Minimize2 className="w-4 h-4 rotate-90" />
              </div>
            )}
          </button>

          {/* Panel İçeriği */}
          <div className="bg-white/95 backdrop-blur rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[300px] max-w-sm h-full">
            {/* Başlık */}
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-700 text-base select-none flex items-center gap-2">
                Seçilenler
              </div>
              <button
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedIds([])}
                title="Seçimi temizle"
              >
                Temizle
              </button>
            </div>

            {/* Bilgi satırı */}
            <div className="text-xs text-gray-600 space-y-1">
              <div>Satış Uzmanı: <b>{reps.find(r=>r.id===selectedRepId)?.name}</b></div>
              <div>Seçilen Müşteri: <b>{selectedIds.length}</b></div>
              <div>Rota (tahmini): <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></div>
              <div className="mt-1 text-[11px]">
                Not: Çokgen çizdikten sonra yalnızca seçime eklenir. Atama yapmak için alttaki butonu kullanın.
              </div>
            </div>

            {/* Liste – scroll */}
            <div className="max-h-full overflow-auto pr-1 space-y-2">
              {selectedCustomers.length === 0 && (
                <div className="text-xs text-gray-500">Henüz seçim yok. Haritada bir alan çizin ya da popup’tan “Seçime Ekle” deyin.</div>
              )}
              {selectedCustomers.map((c) => (
                <div key={c.id} className="p-2 rounded border bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                      <div className="text-xs text-gray-600 truncate max-w-[200px]">
                        {c.address}, {c.district}
                      </div>
                      <div className="text-xs text-gray-500">Tel: {c.phone}</div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedIds((prev) => prev.filter((id) => id !== c.id))
                      }
                      className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      title="Seçimden çıkar"
                      aria-label="Seçimden çıkar"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Atama Butonu */}
            <div className="pt-2 border-t">
              <button
                onClick={() => {
                  if (!selectedCustomers.length) return;
                  setAssignments((prev) => {
                    const n = { ...prev };
                    selectedIds.forEach((id) => (n[id] = selectedRepId));
                    return n;
                  });
                  setToast(`${selectedCustomers.length} müşteri ${reps.find(r=>r.id===selectedRepId)?.name} adına atandı.`);
                }}
                disabled={selectedCustomers.length === 0}
                className={`w-full px-4 py-2 rounded-lg font-semibold ${
                  selectedCustomers.length
                    ? "bg-[#0099CB] text-white hover:opacity-90"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Atama Yap
              </button>
            </div>
          </div>
        </div>

        {/* Loading Overlay – haritanın üstünde, panelin altında */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-[900]">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>

      {/* Alt bilgi */}
      <div className="mt-2 text-xs text-gray-600">
        Haritada çokgen çizerek müşterileri seçin. Seçilenler otomatik atanmaz;
        sağ panelde <b>Atama Yap</b> butonuyla atayın. Rota, seçili satış uzmanının konumundan hesaplanır.
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[1100]">
          <div className="bg-white rounded-xl shadow-lg border px-4 py-3 text-sm text-gray-800">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentMapScreen;
