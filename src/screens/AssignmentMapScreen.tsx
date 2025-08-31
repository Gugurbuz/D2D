// src/screens/AssignmentMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon as RLPolygon,
  useMap,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// @ts-ignore - leaflet.draw tipleri opsiyonel
import "leaflet-draw";
import {
  ArrowLeft,
  Route as RouteIcon,
  Ruler,
  Users,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
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

function toRad(v: number) {
  return (v * Math.PI) / 180;
}
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Basit point-in-polygon (ray casting) */
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    const intersect =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Greedy rota uzunluğu (rep’ten başlayarak en yakın komşu) */
function greedyRouteKm(start: LatLng, pts: LatLng[]) {
  if (pts.length === 0) return 0;
  const left = pts.slice();
  let curr = start;
  let total = 0;
  while (left.length) {
    let bestIdx = 0;
    let best = Infinity;
    for (let i = 0; i < left.length; i++) {
      const d = haversineKm(curr, left[i]);
      if (d < best) {
        best = d;
        bestIdx = i;
      }
    }
    total += best;
    curr = left[bestIdx];
    left.splice(bestIdx, 1);
  }
  return total;
}

/** OSRM helpers (hazırsa kullan, değilse greedy) */
async function osrmTrip(coords: string) {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");
  return data;
}

/* ------------------------------------------------
   Marker ve renkler
------------------------------------------------ */
const REP_COLORS: Record<string, string> = {
  "rep-1": "#0ea5e9", // mavi
  "rep-2": "#22c55e", // yeşil
  "rep-3": "#f97316", // turuncu
  _default: "#9ca3af", // gri (atanmamış)
};

function hexToRgba(hex: string, alpha = 0.15) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "S";
}

function repIconWithInitials(text: string) {
  return L.divIcon({
    className: "rep-marker",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:28px;height:28px;border-radius:50%;
        background:#111827;color:#fff;border:2px solid #fff;
        font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.25);
      ">${text}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -22],
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
   Geometri: convex hull (Andrew monotone chain)
------------------------------------------------ */
type Pt = { x: number; y: number; ref?: LatLng };

function convexHull(points: LatLng[]): LatLng[] {
  if (points.length < 3) {
    // tek nokta/çift nokta → küçük üçgen alanı üretelim
    const p = points[0];
    if (!p) return [];
    const d = 0.001; // ~100m
    return [
      [p[0] + d, p[1]],
      [p[0], p[1] + d],
      [p[0] - d, p[1] - d],
    ];
  }
  const pts: Pt[] = points.map(([lat, lng]) => ({ x: lng, y: lat }));
  pts.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  const hull = lower.slice(0, lower.length - 1).concat(upper.slice(0, upper.length - 1));
  return hull.map((p) => [p.y, p.x]); // [lat,lng]
}

/* ------------------------------------------------
   Balanced k-means (kapasiteli benzeri)
------------------------------------------------ */
type AutoResult = {
  assign: Record<string, string>; // customerId -> repId
  hulls: Record<string, LatLng[]>; // repId -> polygon
  kmByRep: Record<string, number>; // repId -> approx km
};

function autoDistribute(customers: Customer[], reps: Rep[]): AutoResult {
  const k = reps.length;
  const N = customers.length;
  const capacity = Math.ceil(N / k); // hedef yük
  const alpha = 1.2; // yük cezası katsayısı

  // başlangıç merkezleri: rep konumları
  let centers: LatLng[] = reps.map((r) => [r.lat, r.lng]);

  let assignIdx = new Array<number>(N).fill(0);

  for (let iter = 0; iter < 8; iter++) {
    const counts = new Array<number>(k).fill(0);

    // ata
    for (let i = 0; i < N; i++) {
      const p: LatLng = [customers[i].lat, customers[i].lng];
      let best = Infinity;
      let bestJ = 0;
      for (let j = 0; j < k; j++) {
        const d = haversineKm(p, centers[j]);
        const penalty = 1 + alpha * (counts[j] / capacity);
        const score = d * penalty;
        if (score < best) {
          best = score;
          bestJ = j;
        }
      }
      assignIdx[i] = bestJ;
      counts[bestJ]++;
    }

    // merkezleri güncelle (müşterilerin ortalaması)
    const sum: LatLng[] = new Array(k).fill(0).map(() => [0, 0]);
    const cnt: number[] = new Array(k).fill(0);
    for (let i = 0; i < N; i++) {
      const j = assignIdx[i];
      sum[j][0] += customers[i].lat;
      sum[j][1] += customers[i].lng;
      cnt[j]++;
    }
    for (let j = 0; j < k; j++) {
      if (cnt[j] > 0) {
        centers[j] = [sum[j][0] / cnt[j], sum[j][1] / cnt[j]];
      } else {
        centers[j] = [reps[j].lat, reps[j].lng];
      }
    }
  }

  // sonuçları derle
  const assign: Record<string, string> = {};
  const hulls: Record<string, LatLng[]> = {};
  const kmByRep: Record<string, number> = {};

  for (let j = 0; j < k; j++) {
    const clusterPts: LatLng[] = [];
    const clusterCustomers: Customer[] = [];
    for (let i = 0; i < N; i++) {
      if (assignIdx[i] === j) {
        clusterPts.push([customers[i].lat, customers[i].lng]);
        clusterCustomers.push(customers[i]);
        assign[customers[i].id] = reps[j].id;
      }
    }
    hulls[reps[j].id] = convexHull(clusterPts);

    // tahmini km: rep başlangıcından greedy
    const start: LatLng = [reps[j].lat, reps[j].lng];
    const pts = clusterCustomers.map((c) => [c.lat, c.lng] as LatLng);
    kmByRep[reps[j].id] = greedyRouteKm(start, pts);
  }

  return { assign, hulls, kmByRep };
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

  // çizilen çokgen (manuel seçim)
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // manuel seçim için rota
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // otomatik atama poligonları
  const [autoTerritories, setAutoTerritories] = useState<
    { repId: string; poly: LatLng[] }[]
  >([]);

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

  // Çokgen çizildiğinde (manuel seçim) – otomatik atama YOK; sadece seç
  const handlePolygonCreated = async (poly: L.Polygon) => {
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
    }
    polygonLayerRef.current = poly;

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map(
      (p) => [p.lat, p.lng] as LatLng
    );

    // poligon içindeki müşteriler
    const inside = customers.filter((c) => pointInPolygon([c.lat, c.lng], latlngs));
    const insideIds = inside.map((c) => c.id);
    setSelectedIds(insideIds);

    // rep için rota hesapla
    await computeRouteForSelection(inside, selectedRepId);
  };

  // Rota hesaplama (manuel seçim listesi için)
  const computeRouteForSelection = async (list: Customer[], rid: string) => {
    try {
      setLoading(true);
      setRouteCoords([]);
      setRouteKm(null);

      if (!list.length) return;

      const rep = reps.find((r) => r.id === rid) || reps[0];
      const start: LatLng = [rep.lat, rep.lng];

      // OSRM trip (rep + müşteriler)
      const coords = [start, ...list.map((c) => [c.lat, c.lng] as LatLng)]
        .map((p) => `${p[1]},${p[0]}`)
        .join(";");
      try {
        const data = await osrmTrip(coords);
        const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        setRouteCoords(latlngs);
        setRouteKm((data.trips[0].distance as number) / 1000);
      } catch {
        // fallback
        const pts = list.map((c) => [c.lat, c.lng] as LatLng);
        setRouteCoords([start, ...pts]);
        setRouteKm(greedyRouteKm(start, pts));
      }
    } finally {
      setLoading(false);
    }
  };

  // Otomatik Atama
  const handleAutoAssign = () => {
    if (!reps.length) return;
    const { assign, hulls } = autoDistribute(customers, reps);

    // atamaları uygula
    setAssignments((prev) => ({ ...prev, ...assign }));

    // poligonları hazırla
    const terr = reps.map((r) => ({ repId: r.id, poly: hulls[r.id] || [] }));
    setAutoTerritories(terr);

    // seçim/rota temizle
    setSelectedIds([]);
    setRouteCoords([]);
    setRouteKm(null);

    setToast("Otomatik atama tamamlandı. Bölgeler ve renkler güncellendi.");
    setTimeout(() => setToast(null), 3000);
  };

  // Draw control ekle (manuel seçim)
  const DrawControl = () => {
    const map = useMap();
    useEffect(() => {
      const drawControl = new L.Control.Draw({
        draw: {
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: "#ff0000",
              message: "<strong>Hata:</strong> Çokgen kendiyle kesişemez",
            },
          },
        },
        edit: {
          featureGroup: new L.FeatureGroup(),
          edit: false,
          remove: true,
        },
      });

      map.addControl(drawControl as any);

      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer as L.Polygon;
        map.addLayer(layer);
        handlePolygonCreated(layer);
      });

      map.on(L.Draw.Event.DELETED, (_e: any) => {
        polygonLayerRef.current = null;
        setSelectedIds([]);
        setRouteCoords([]);
        setRouteKm(null);
      });

      return () => {
        map.removeControl(drawControl as any);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, customers, selectedRepId, reps]);

    return null;
  };

  return (
    <div className="p-4">
      {/* Üst bar */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
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
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="border rounded-lg px-2 py-1"
            >
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>
              Seçilen: <b>{selectedIds.length}</b>
            </span>
          </div>

          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>
              Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
            </span>
          </div>

          {/* OTOMATİK ATAMA */}
          {reps.length > 1 && (
            <button
              onClick={handleAutoAssign}
              className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90 inline-flex items-center gap-2"
              title="Müşterileri ekipteki uzmanlara yaklaşık eşit dağıt"
            >
              <Sparkles className="w-4 h-4" />
              Otomatik Atama
            </button>
          )}
        </div>
      </div>

      <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
        <MapContainer
          center={mapCenter as LatLngExpression}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <DrawControl />

          {/* Otomatik atama bölgeleri (poligonlar) */}
          {autoTerritories.map(({ repId, poly }) =>
            poly && poly.length ? (
              <RLPolygon
                key={`terr-${repId}`}
                positions={poly as LatLngExpression[]}
                pathOptions={{
                  color: REP_COLORS[repId] || "#888",
                  weight: 2,
                  fillColor: hexToRgba(REP_COLORS[repId] || "#888", 0.18),
                  fillOpacity: 0.35,
                }}
              />
            ) : null
          )}

          {/* Rep Marker'ları (baş harfleri) */}
          {reps.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={repIconWithInitials(initials(r.name))}
            >
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
                          ? reps.find((r) => r.id === assignments[c.id])?.name ||
                            assignments[c.id]
                          : "—"}
                      </b>
                    </div>
                    <button
                      onClick={() =>
                        setAssignments((prev) => ({
                          ...prev,
                          [c.id]: selectedRepId,
                        }))
                      }
                      className="mt-2 w-full px-3 py-1.5 rounded bg-[#0099CB] text-white text-xs"
                    >
                      Bu Müşteriyi Ata (
                      {reps.find((r) => r.id === selectedRepId)?.name})
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Rota çizgisi (manuel seçim için) */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords as LatLngExpression[]}
              pathOptions={{ color: "#0099CB", weight: 7 }}
            />
          )}
        </MapContainer>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}

        {/* SAĞ PANEL – Seçilenler */}
        <div className="absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 translate-x-0 flex">
          <div className="bg-white/95 rounded-l-xl shadow-md px-5 py-4 flex flex-col gap-3 min-w-[300px] max-w-sm h-full">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              Seçilenler
            </div>
            <div className="text-[11px] text-gray-600">
              Harita üzerinde <b>çokgen</b> çizin. İçerde kalan müşteriler burada listelenir.
              Atama otomatik yapılmaz; <b>“Seçileni Ata”</b> butonuna basarak
              seçili satış uzmanına atayabilirsiniz. Sağ üstte rota uzunluğunu görürsünüz.
            </div>

            <div className="text-sm text-gray-700">
              Satış Uzmanı:{" "}
              <b>
                {reps.find((r) => r.id === selectedRepId)?.name || selectedRepId}
              </b>
            </div>

            <div className="text-xs text-gray-600">
              Seçilen müşteri: <b>{selectedIds.length}</b>
            </div>

            <button
              disabled={!selectedIds.length}
              onClick={() => {
                setAssignments((prev) => {
                  const n = { ...prev };
                  selectedIds.forEach((id) => (n[id] = selectedRepId));
                  return n;
                });
                setToast(
                  `${selectedIds.length} müşteri atandı → ${
                    reps.find((r) => r.id === selectedRepId)?.name
                  }`
                );
                setTimeout(() => setToast(null), 2500);
              }}
              className={`px-4 py-2 rounded-lg font-semibold ${
                selectedIds.length
                  ? "bg-[#0099CB] text-white hover:opacity-90"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              Seçileni Ata
            </button>

            <div className="max-h-full overflow-auto pr-1">
              {selectedCustomers.length === 0 ? (
                <div className="text-xs text-gray-500">Seçim yok.</div>
              ) : (
                selectedCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="w-2 h-2 rounded-full mt-2"
                      style={{ background: colorForCustomer(c) }} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {c.address}, {c.district}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Saat: {c.plannedTime} • Tel: {c.phone}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="mt-2 text-xs text-gray-600">
        <b>Otomatik Atama</b> tüm müşterileri ekibinizdeki satış uzmanlarına yaklaşık eşit
        sayıda ve yaklaşık eşit tahmini rota mesafesi hedefiyle dağıtır; haritada her
        uzman için bir bölge (poligon) çizilir.
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border px-4 py-3 text-sm text-gray-800">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentMapScreen;
