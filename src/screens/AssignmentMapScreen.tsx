// src/screens/AssignmentMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// @ts-ignore - leaflet.draw types opsiyonel
import "leaflet-draw";
import { Delaunay } from "d3-delaunay";
import {
  ArrowLeft,
  Route as RouteIcon,
  Ruler,
  Users,
  CheckCircle2,
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
   Marker stilleri ve renkler
------------------------------------------------ */
const REP_COLORS: Record<string, string> = {
  "rep-1": "#0ea5e9", // mavi
  "rep-2": "#22c55e", // yeşil
  "rep-3": "#f97316", // turuncu
  _default: "#9ca3af", // gri (atanmamış)
};

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const s1 = parts[0]?.[0] ?? "";
  const s2 = parts[1]?.[0] ?? "";
  return (s1 + s2).toUpperCase();
}
function repIconWithInitials(txt: string) {
  return L.divIcon({
    className: "rep-marker",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:30px;height:30px;border-radius:50%;
        background:#111827;color:#fff;border:2px solid #fff;
        font-weight:800;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.25);
      ">${txt}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -24],
  });
}

/* ------------------------------------------------
   Voronoi clip rect hesaplayıcı
------------------------------------------------ */
function computeClipRect(
  reps: Rep[],
  customers: Customer[],
  marginKm = 5
): [number, number, number, number] {
  const lats = [...reps.map((r) => r.lat), ...customers.map((c) => c.lat)];
  const lngs = [...reps.map((r) => r.lng), ...customers.map((c) => c.lng)];
  if (!lats.length || !lngs.length) return [28.8, 40.8, 29.4, 41.3]; // İstanbul civarı fallback
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latMargin = marginKm / 111; // ~1° lat ~111km
  const lngMargin =
    (marginKm / 111) * Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));

  const x0 = minLng - lngMargin;
  const y0 = minLat - latMargin;
  const x1 = maxLng + lngMargin;
  const y1 = maxLat + latMargin;
  return [x0, y0, x1, y1];
}

/* ------------------------------------------------
   Çizim kontrolü (polygon)
------------------------------------------------ */
const DrawControl: React.FC<{
  onPolygon: (layer: L.Polygon) => void;
  onClear: () => void;
}> = ({ onPolygon, onClear }) => {
  const map = useMap();
  const groupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const grp = new L.FeatureGroup();
    groupRef.current = grp;
    map.addLayer(grp);

    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        // showArea:true bazı paket kombinasyonlarında geometryutil "type" hatası atabiliyor
        polygon: {
          allowIntersection: false,
          showArea: false,
          drawError: {
            color: "#ff0000",
            message: "<strong>Hata:</strong> Çokgen kendiyle kesişemez",
          },
        },
      },
      edit: {
        featureGroup: grp,
        edit: false,
        remove: true,
      },
    });

    map.addControl(drawControl as any);

    const onCreated = (e: any) => {
      const layer = e.layer as L.Polygon;
      grp.clearLayers(); // sadece 1 polygon tut
      grp.addLayer(layer);
      onPolygon(layer);
    };
    const onDeleted = () => {
      grp.clearLayers();
      onClear();
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.DELETED, onDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.DELETED, onDeleted);
      map.removeControl(drawControl as any);
      map.removeLayer(grp);
    };
  }, [map, onPolygon, onClear]);

  return null;
};

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
  const [selectedRepId, setSelectedRepId] = useState<string>(
    reps[0]?.id || "rep-1"
  );

  // çizilen çokgen
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  // rota
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // optimize sonrası bölgeler (titrememesi için sadece optimize ile güncelliyoruz)
  const [regionCenters, setRegionCenters] = useState<LatLng[]>(
    reps.map((r) => [r.lat, r.lng])
  );
  useEffect(() => {
    setRegionCenters(reps.map((r) => [r.lat, r.lng]));
  }, [reps]);

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

  // Çokgen çizildiğinde → seçimi güncelle + rota hesapla (AUTO ASSIGN YOK!)
  const handlePolygonCreated = async (poly: L.Polygon) => {
    polygonLayerRef.current = poly;

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map((p) => [
      p.lat,
      p.lng,
    ]) as LatLng[];

    // poligon içindeki müşteriler
    const inside = customers.filter((c) =>
      pointInPolygon([c.lat, c.lng], latlngs)
    );
    const insideIds = inside.map((c) => c.id);
    setSelectedIds(insideIds);

    // rota: seçili rep konumu -> seçilen müşteriler
    await computeRouteForSelection(inside, selectedRepId);
  };

  // Polygon temizlenince
  const handlePolygonCleared = () => {
    polygonLayerRef.current = null;
    setSelectedIds([]);
    setRouteCoords([]);
    setRouteKm(null);
  };

  // Rota hesaplama (seçilenler için)
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

      const data = await osrmTrip(coords);
      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(latlngs);
      setRouteKm((data.trips[0].distance as number) / 1000);
    } catch (_e) {
      // Fallback: sırayla haversine
      const rep = reps.find((r) => r.id === rid) || reps[0];
      const seq = [[rep.lat, rep.lng] as LatLng].concat(
        list.map((c) => [c.lat, c.lng] as LatLng)
      );
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteCoords(seq);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };

  // Seçilenleri ata (manuel)
  const handleAssignSelected = () => {
    if (!selectedIds.length) {
      setToast("Önce haritada bir alan çizerek müşteri seçin.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setAssignments((prev) => {
      const n = { ...prev };
      selectedIds.forEach((id) => (n[id] = selectedRepId));
      return n;
    });
    setToast("Seçilen müşteriler atandı.");
    setTimeout(() => setToast(null), 2000);
  };

  /* =========================
     OPTIMIZE ET (dengeli dağıt + bölgeleri güncelle)
     - Müşterileri, rep sayısına göre hedef kapasite ile (N/K) olabildiğince eşit paylaştırır
     - En yakın rep + kapasite kuralı
     - Merkezleri 2 tur günceller (mini k-means tadında)
     - Voronoi bölgelerini yeni merkezlere göre çizer (çakışma olmaz)
  ========================= */
  const handleOptimize = () => {
    const N = customers.length;
    const K = reps.length || 1;

    const base = Math.floor(N / K);
    const remainder = N % K;
    const capacity = Array.from({ length: K }, (_, i) => base + (i < remainder ? 1 : 0));

    const dist = (c: Customer, r: Rep) => haversineKm([c.lat, c.lng], [r.lat, r.lng]);

    const ranked = customers
      .map((c, idx) => {
        const ds = reps.map((r) => dist(c, r));
        const sorted = [...ds].sort((a, b) => a - b);
        const order = reps
          .map((r, k) => ({ k, d: ds[k] }))
          .sort((a, b) => a.d - b.d);
        const spread = (sorted[1] ?? sorted[0]) - sorted[0]; // 2. yakın - en yakın
        return { idx, order, spread };
      })
      .sort((a, b) => b.spread - a.spread);

    const assignIdx = new Array<number>(N).fill(-1);
    const capLeft = [...capacity];

    for (const item of ranked) {
      let chosen = item.order.find((o) => capLeft[o.k] > 0)?.k;
      if (chosen == null) chosen = item.order[0].k;
      assignIdx[item.idx] = chosen;
      capLeft[chosen] = Math.max(0, capLeft[chosen] - 1);
    }

    let centers: LatLng[] = reps.map((r) => [r.lat, r.lng]);
    for (let t = 0; t < 2; t++) {
      const sum: LatLng[] = Array.from({ length: K }, () => [0, 0]);
      const cnt = new Array<number>(K).fill(0);
      customers.forEach((c, i) => {
        const k = assignIdx[i];
        sum[k][0] += c.lat;
        sum[k][1] += c.lng;
        cnt[k]++;
      });
      centers = centers.map((c, k) =>
        cnt[k] ? [sum[k][0] / cnt[k], sum[k][1] / cnt[k]] : c
      );
    }

    // sonuç atama
    const next: Record<string, string> = {};
    customers.forEach((c, i) => {
      const repId = reps[assignIdx[i]]?.id || reps[0].id;
      next[c.id] = repId;
    });
    setAssignments((prev) => ({ ...prev, ...next }));

    // bölgeleri güncelle (Voronoi)
    setRegionCenters(centers);

    setToast("Optimize atama tamamlandı.");
    setTimeout(() => setToast(null), 2000);
  };

  /* =========================
     Voronoi bölgeleri (sadece regionCenters değişince)
  ========================= */
  const clipRect = useMemo(
    () => computeClipRect(reps, customers, 5),
    [reps, customers]
  );

  const voronoiPolys = useMemo(() => {
    if (!reps.length || !regionCenters.length) return {} as Record<string, LatLng[]>;
    const pts = regionCenters.map(([lat, lng]) => [lng, lat] as [number, number]);
    const delaunay = Delaunay.from(pts);
    const vor = delaunay.voronoi(clipRect);
    const polys: Record<string, LatLng[]> = {};
    reps.forEach((r, i) => {
      const poly = vor.cellPolygon(i) as [number, number][] | null;
      polys[r.id] = poly ? poly.map(([x, y]) => [y, x]) : [];
    });
    return polys;
  }, [regionCenters, clipRect, reps]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-4">
      {/* Üst bar */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <div className="flex items-center gap-2 ml-1">
            <RouteIcon className="w-5 h-5 text-[#0099CB]" />
            Haritadan Görev Atama
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Satış Uzmanı:</span>
            <select
              value={selectedRepId}
              onChange={(e) => {
                setSelectedRepId(e.target.value);
                // seçili rota da bu rep’e göre hesaplanır
                if (selectedCustomers.length) {
                  computeRouteForSelection(selectedCustomers, e.target.value);
                }
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

          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>
              Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
            </span>
          </div>

          <button
            onClick={handleOptimize}
            className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90"
          >
            Optimize Et
          </button>
        </div>
      </div>

      {/* Harita + Sağ panel */}
      <div className="relative h-[640px] w-full rounded-2xl overflow-hidden shadow">
        <MapContainer
          center={mapCenter as LatLngExpression}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          <DrawControl
            onPolygon={handlePolygonCreated}
            onClear={handlePolygonCleared}
          />

          {/* Voronoi Bölgeleri */}
          {reps.map((r) => {
            const poly = voronoiPolys[r.id] || [];
            if (!poly.length) return null;
            const color = REP_COLORS[r.id] || "#777";
            return (
              <Polyline
                key={`poly-${r.id}`}
                positions={poly as LatLngExpression[]}
                pathOptions={{ color, weight: 2, opacity: 0.7 }}
              />
            );
          })}

          {/* Rep Marker'ları (baş harfler) */}
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
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Rota çizgisi (seçilen çokgen için) */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords as LatLngExpression[]}
              pathOptions={{ color: "#0099CB", weight: 6, opacity: 0.9 }}
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

        {/* Sağ Panel (Seçilenler) */}
        <div className="absolute top-4 right-4 z-10 w-[320px] max-w-[85vw] bg-white/95 rounded-xl shadow-md border p-4 flex flex-col gap-3">
          <div className="font-semibold text-gray-800">Seçilenler</div>
          <div className="text-xs text-gray-600">
            Harita üzerindeki <b>Çokgen</b> aracı ile bir alan çizin. Alan içindeki
            müşteriler listede görünecek. Aşağıdan seçili satış uzmanını değiştirip{" "}
            <b>Seçilenleri Ata</b> butonuna basın. (Otomatik atama yapılmaz.)
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Satış Uzmanı:</span>
            <select
              value={selectedRepId}
              onChange={(e) => {
                setSelectedRepId(e.target.value);
                if (selectedCustomers.length) {
                  computeRouteForSelection(selectedCustomers, e.target.value);
                }
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

          <div className="text-xs text-gray-600">
            Seçili müşteri: <b>{selectedIds.length}</b> • Tahmini rota:{" "}
            <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
          </div>

          <div className="max-h-[300px] overflow-auto pr-1 space-y-2">
            {selectedCustomers.length === 0 && (
              <div className="text-sm text-gray-500">Henüz seçim yok.</div>
            )}
            {selectedCustomers.map((c) => (
              <div
                key={c.id}
                className="p-2 rounded border hover:bg-gray-50 text-sm"
              >
                <div className="font-medium text-gray-900 truncate">{c.name}</div>
                <div className="text-xs text-gray-600 truncate">
                  {c.address}, {c.district}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Atanan:{" "}
                  <b>
                    {assignments[c.id]
                      ? reps.find((r) => r.id === assignments[c.id])?.name ||
                        assignments[c.id]
                      : "—"}
                  </b>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAssignSelected}
            className="mt-1 w-full px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Seçilenleri Ata
          </button>
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="mt-2 text-xs text-gray-600">
        İpucu: <b>Optimize Et</b> ile müşteriler rep’lere dengeli şekilde dağıtılır ve
        bölgeler (Voronoi) çakışmadan gösterilir.
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
