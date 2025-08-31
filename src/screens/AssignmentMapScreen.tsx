import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// @ts-ignore
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

type LatLng = [number, number];

/* ------------------------------------------------
   Yardımcılar
------------------------------------------------ */
const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function osrmTrip(coords: string) {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");
  return data;
}

const REP_COLORS: Record<string, string> = {
  "rep-1": "#0ea5e9", // mavi
  "rep-2": "#22c55e", // yeşil
  "rep-3": "#f97316", // turuncu
  _default: "#9ca3af",
};
const REP_FILLS: Record<string, string> = {
  "rep-1": "rgba(14,165,233,.18)",
  "rep-2": "rgba(34,197,94,.18)",
  "rep-3": "rgba(249,115,22,.18)",
  _default: "rgba(156,163,175,.18)",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
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

/* ---- Konveks Hull (Monotone Chain) ---- */
function convexHull(points: LatLng[]): LatLng[] {
  if (points.length < 3) return points.slice();
  const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])); // sort by lng then lat
  const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
  const lower: LatLng[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: LatLng[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

/* ------------------------------------------------
   Bileşen
------------------------------------------------ */
const AssignmentMapScreen: React.FC<Props> = ({
  customers,
  assignments,
  setAssignments,
  allReps: reps,
  onBack,
}) => {
  const mapCenter: LatLng = [40.9368, 29.1553];

  const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // çizim için featureGroup (Leaflet.Draw fix)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  // optimize (auto-assign) sonucu alanlar
  const [regions, setRegions] = useState<Record<string, LatLng[]>>({}); // repId -> hull LatLng[]

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  const colorForCustomer = (c: Customer) => REP_COLORS[assignments[c.id] || "_default"] || REP_COLORS._default;

  /* ---- POLİGON: Created handler ---- */
  const handlePolygonCreated = async (poly: L.Polygon) => {
    if (polygonLayerRef.current && drawnItemsRef.current) {
      drawnItemsRef.current.removeLayer(polygonLayerRef.current);
    }
    polygonLayerRef.current = poly;
    drawnItemsRef.current?.addLayer(poly);

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map((p) => [p.lat, p.lng]) as LatLng[];
    const inside = customers.filter((c) => pointInPolygon([c.lat, c.lng], latlngs));
    const insideIds = inside.map((c) => c.id);
    setSelectedIds(insideIds);

    await computeRouteForSelection(inside);
  };

  /* ---- Rota hesapla (seçili rep + liste) ---- */
  const computeRouteForSelection = async (list: Customer[]) => {
    try {
      setLoading(true);
      setRouteCoords([]); setRouteKm(null);
      if (!list.length) return;

      const rep = reps.find((r) => r.id === selectedRepId) || reps[0];
      const start: LatLng = [rep.lat, rep.lng];

      const coords = [start, ...list.map((c) => [c.lat, c.lng] as LatLng)]
        .map((p) => `${p[1]},${p[0]}`).join(";");

      const data = await osrmTrip(coords);
      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(latlngs);
      setRouteKm((data.trips[0].distance as number) / 1000);
    } catch {
      // fallback
      const rep = reps.find((r) => r.id === selectedRepId) || reps[0];
      const seq = [[rep.lat, rep.lng] as LatLng, ...list.map((c) => [c.lat, c.lng] as LatLng)];
      let acc = 0; for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteCoords(seq); setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };

  /* ---- DrawControl (stabil) ---- */
  const DrawControl = () => {
    const map = useMap();
    useEffect(() => {
      const drawn = new L.FeatureGroup();
      drawnItemsRef.current = drawn;
      map.addLayer(drawn);

      const drawControl = new (L as any).Control.Draw({
        draw: {
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          // showArea:true bazı sürümlerde "type is not defined" hatası üretebiliyor → false
          polygon: { allowIntersection: false, showArea: false, drawError: { color: "#ff0000", message: "Hatalı çizim" } },
        },
        edit: {
          featureGroup: drawn,
          edit: false,
          remove: true,
        },
      });

      map.addControl(drawControl);

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        const layer = e.layer as L.Polygon;
        handlePolygonCreated(layer);
      });

      map.on((L as any).Draw.Event.DELETED, () => {
        polygonLayerRef.current = null;
        setSelectedIds([]);
        setRouteCoords([]); setRouteKm(null);
      });

      return () => {
        map.removeControl(drawControl);
        map.removeLayer(drawn);
        drawnItemsRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, customers, selectedRepId]);

    return null;
  };

  /* ---- OPTİMİZE ET: Kapasiteli K-Means benzeri auto-assign ---- */
  const handleOptimize = async () => {
    // kapasiteli atama (müşteri sayısı / rep sayısı ~ eşit)
    const K = reps.length || 1;
    if (!K) return;

    const target = Math.ceil(customers.length / K);
    // centroidler: rep konumları
    let centroids: LatLng[] = reps.map((r) => [r.lat, r.lng]);

    // müşterilerin koordinat listesi
    const pts: LatLng[] = customers.map((c) => [c.lat, c.lng]);

    // atamalar: her iterasyonda rep index
    let assign: number[] = new Array(customers.length).fill(-1);

    const iter = 8;
    for (let t = 0; t < iter; t++) {
      // boş kümeler
      const buckets: number[][] = Array.from({ length: K }, () => []);

      // en yakın centroid + kapasite kontrolü
      pts.forEach((p, i) => {
        const order = centroids
          .map((c, k) => ({ k, d: haversineKm(p, c) }))
          .sort((a, b) => a.d - b.d);

        let chosen = order[0].k;
        // kapasite doluysa sıradaki en yakın
        for (const cand of order) {
          if (buckets[cand.k].length < target) { chosen = cand.k; break; }
        }
        buckets[chosen].push(i);
        assign[i] = chosen;
      });

      // centroidleri güncelle (müşteri ortalaması)
      centroids = buckets.map((idxs, k) => {
        if (idxs.length === 0) return centroids[k];
        const s = idxs.reduce((acc, i) => [acc[0] + pts[i][0], acc[1] + pts[i][1]], [0, 0] as LatLng);
        return [s[0] / idxs.length, s[1] / idxs.length] as LatLng;
      });
    }

    // Sonuç: assignments güncelle
    const next: Record<string, string> = {};
    customers.forEach((c, i) => {
      const repId = reps[assign[i]]?.id || reps[0].id;
      next[c.id] = repId;
    });
    setAssignments((prev) => ({ ...prev, ...next }));

    // Bölge hull’larını çiz
    const perRepPoints: Record<string, LatLng[]> = {};
    reps.forEach((r) => (perRepPoints[r.id] = []));
    customers.forEach((c, i) => {
      const rid = next[c.id]!;
      perRepPoints[rid].push([c.lat, c.lng]);
    });

    const hulls: Record<string, LatLng[]> = {};
    reps.forEach((r) => {
      const pts = perRepPoints[r.id];
      hulls[r.id] = pts.length ? convexHull(pts.map((p) => [p[0], p[1]])) : [];
    });
    setRegions(hulls);

    setToast("Optimize atama tamamlandı.");
    setTimeout(() => setToast(null), 2000);
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
                // rep değişince seçime göre rota yenile
                if (selectedCustomers.length) computeRouteForSelection(selectedCustomers);
              }}
              className="border rounded-lg px-2 py-1"
            >
              {reps.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-700 hidden sm:flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>Seçilen: <b>{selectedIds.length}</b></span>
          </div>

          <div className="text-sm text-gray-700 hidden sm:flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></span>
          </div>

          {/* OPTİMİZE ET */}
          <button
            onClick={handleOptimize}
            className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90"
            title="Müşterileri ekip arasında en dengeli şekilde dağıt"
          >
            Optimize Et
          </button>
        </div>
      </div>

      {/* Harita + Sağ Panel */}
      <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
        <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <DrawControl />

          {/* Rep bölgeleri (optimize sonrası) */}
          {reps.map((r) => {
            const hull = regions[r.id];
            return hull && hull.length >= 3 ? (
              <Polygon
                key={`poly-${r.id}`}
                positions={hull as unknown as LatLngExpression[]}
                pathOptions={{ color: REP_COLORS[r.id] || "#444", fillColor: REP_FILLS[r.id] || "rgba(0,0,0,.1)", fillOpacity: 0.6, weight: 2 }}
              />
            ) : null;
          })}

          {/* Rep Marker'ları (başharf) */}
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

          {/* Müşteri Marker'ları */}
          {customers.map((c) => {
            const color = colorForCustomer(c);
            const highlighted = selectedIds.includes(c.id);
            return (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon(color, highlighted)}>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-gray-600">{c.address}, {c.district}</div>
                    <div className="text-sm">Saat: {c.plannedTime}</div>
                    <div className="text-sm">Tel: {c.phone}</div>
                    <div className="text-xs text-gray-500">
                      Atanan: <b>{assignments[c.id] ? (reps.find(r => r.id === assignments[c.id])?.name || assignments[c.id]) : "—"}</b>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setSelectedIds((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]))}
                        className="px-3 py-1.5 rounded bg-white border text-xs"
                      >
                        Seçime Ekle
                      </button>
                      <button
                        onClick={() => setAssignments((prev) => ({ ...prev, [c.id]: selectedRepId }))}
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

          {/* Seçim rotası */}
          {routeCoords.length > 1 && (
            <Polyline positions={routeCoords as LatLngExpression[]} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>

        {/* SAĞ PANEL */}
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
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-700 text-base select-none">Seçilenler</div>
              <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setSelectedIds([])} title="Seçimi temizle">Temizle</button>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div>Satış Uzmanı: <b>{reps.find(r => r.id === selectedRepId)?.name}</b></div>
              <div>Seçilen Müşteri: <b>{selectedIds.length}</b></div>
              <div>Rota (tahmini): <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></div>
              <div className="mt-1 text-[11px]">
                Not: Çokgenle seçim yapın veya popup’tan <b>Seçime Ekle</b> deyin. Atama için popup’taki <b>Bu Müşteriyi Ata</b> butonunu
                ya da üstteki <b>Optimize Et</b> ile otomatik dağıtımı kullanın.
              </div>
            </div>

            <div className="max-h-full overflow-auto pr-1 space-y-2">
              {selectedCustomers.length === 0 && (
                <div className="text-xs text-gray-500">Henüz seçim yok.</div>
              )}
              {selectedCustomers.map((c) => (
                <div key={c.id} className="p-2 rounded border bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                      <div className="text-xs text-gray-600 truncate max-w-[200px]">{c.address}, {c.district}</div>
                      <div className="text-xs text-gray-500">Tel: {c.phone}</div>
                    </div>
                    <button
                      onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== c.id))}
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
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-[900]">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-600">
        Poligon çizimi düzeltildi. Çokgen çizip müşterileri seçebilir, tek tek atayabilir ya da <b>Optimize Et</b> ile
        eşit ve çakışmayan bölgelere otomatik dağıtabilirsiniz.
      </div>

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
