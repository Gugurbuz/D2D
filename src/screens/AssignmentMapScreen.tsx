// src/screens/AssignmentMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon, // <<< DEĞİŞİKLİK: Polygon eklendi
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
      yi > y !== yj > y &&
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
      grp.clearLayers();
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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [regionCenters, setRegionCenters] = useState<LatLng[]>(
    reps.map((r) => [r.lat, r.lng])
  );
  useEffect(() => {
    setRegionCenters(reps.map((r) => [r.lat, r.lng]));
  }, [reps]);

  const [toast, setToast] = useState<string | null>(null);

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  const colorForCustomer = (c: Customer) => {
    const rid = assignments[c.id];
    return REP_COLORS[rid || "_default"] || REP_COLORS._default;
  };

  const handlePolygonCreated = async (poly: L.Polygon) => {
    polygonLayerRef.current = poly;

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map((p) => [
      p.lat,
      p.lng,
    ]) as LatLng[];

    const inside = customers.filter((c) =>
      pointInPolygon([c.lat, c.lng], latlngs)
    );
    const insideIds = inside.map((c) => c.id);
    setSelectedIds(insideIds);

    await computeRouteForSelection(inside, selectedRepId);
  };

  const handlePolygonCleared = () => {
    polygonLayerRef.current = null;
    setSelectedIds([]);
    setRouteCoords([]);
    setRouteKm(null);
  };

  const computeRouteForSelection = async (list: Customer[], rid: string) => {
    try {
      setLoading(true);
      setRouteCoords([]);
      setRouteKm(null);

      if (!list.length) return;

      const rep = reps.find((r) => r.id === rid) || reps[0];
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
    } catch (_e) {
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
   * DEĞİŞİKLİK: İYİLEŞTİRİLMİŞ OPTİMİZE FONKSİYONU
   * - K-Means benzeri bir yaklaşımla çalışır.
   * - Müşterileri en yakın merkeze atar, sonra merkezleri günceller.
   * - Bu işlemi birkaç tur tekrarlayarak daha dengeli bir dağılım sağlar.
   * ========================= */
  const handleOptimize = () => {
    const N = customers.length;
    const K = reps.length;
    if (N === 0 || K === 0) {
      setToast("Optimizasyon için yeterli müşteri veya satış uzmanı yok.");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    // 1. Hedef Kapasiteleri Hesapla (Her rep'e kaç müşteri düşmeli)
    const baseCapacity = Math.floor(N / K);
    const remainder = N % K;
    const capacities = new Array(K).fill(baseCapacity);
    for (let i = 0; i < remainder; i++) {
      capacities[i]++;
    }

    // 2. Başlangıç Merkezlerini Belirle (Rep'lerin kendi konumları)
    let centers: LatLng[] = reps.map((r) => [r.lat, r.lng]);
    let assignments = new Array(N).fill(-1); // Müşteri index -> Rep index

    const MAX_ITERATIONS = 5; // Genellikle 5-10 tur yeterlidir

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      // --- ATAMA ADIMI ---
      // Her müşteriyi en yakın merkeze ata, ancak kapasiteyi göz önünde bulundur.

      // Müşterileri tüm merkezlere olan uzaklıklarına göre sırala
      const customerDistances = customers.map((customer, custIdx) => {
        const distances = centers.map((center, repIdx) => ({
          repIdx,
          dist: haversineKm([customer.lat, customer.lng], center),
        }));
        distances.sort((a, b) => a.dist - b.dist); // En yakından uzağa sırala
        return { custIdx, preferences: distances };
      });

      const repCustomerCounts = new Array(K).fill(0);
      const tempAssignments = new Array(N).fill(-1);

      // Kapasitesi dolmayan en yakın rep'e ata
      customerDistances.forEach(({ custIdx, preferences }) => {
        for (const pref of preferences) {
          if (repCustomerCounts[pref.repIdx] < capacities[pref.repIdx]) {
            tempAssignments[custIdx] = pref.repIdx;
            repCustomerCounts[pref.repIdx]++;
            break;
          }
        }
        // Eğer tüm tercihleri doluysa, geçici olarak en yakına ata (sonra düzeltilecek)
        if (tempAssignments[custIdx] === -1) {
          tempAssignments[custIdx] = preferences[0].repIdx;
        }
      });
      assignments = tempAssignments;

      // --- GÜNCELLEME ADIMI ---
      // Merkezleri, atanan müşterilerin ortalama konumuna göre güncelle
      const newCentersSum: LatLng[] = Array.from({ length: K }, () => [0, 0]);
      const counts = new Array(K).fill(0);

      customers.forEach((customer, custIdx) => {
        const repIdx = assignments[custIdx];
        if (repIdx !== -1) {
          newCentersSum[repIdx][0] += customer.lat;
          newCentersSum[repIdx][1] += customer.lng;
          counts[repIdx]++;
        }
      });

      centers = centers.map((oldCenter, repIdx) => {
        if (counts[repIdx] > 0) {
          return [
            newCentersSum[repIdx][0] / counts[repIdx],
            newCentersSum[repIdx][1] / counts[repIdx],
          ];
        }
        return oldCenter; // Müşteri atanmadıysa merkezi değiştirme
      });
    }

    // 3. Sonuçları State'e Kaydet
    const finalAssignments: Record<string, string> = {};
    customers.forEach((customer, custIdx) => {
      const repIdx = assignments[custIdx];
      if (repIdx !== -1) {
        const repId = reps[repIdx].id;
        finalAssignments[customer.id] = repId;
      }
    });

    setAssignments(finalAssignments); // Müşteri atamalarını güncelle
    setRegionCenters(centers);      // Haritadaki Voronoi bölgeleri için merkezleri güncelle

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

          {/* DEĞİŞİKLİK: Voronoi Bölgeleri (Polygon ile) */}
          {reps.map((r) => {
            const poly = voronoiPolys[r.id] || [];
            if (!poly.length) return null;
            const color = REP_COLORS[r.id] || "#777";
            return (
              <Polygon
                key={`poly-${r.id}`}
                positions={poly as LatLngExpression[]}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.3,
                  color: color,
                  weight: 2,
                  opacity: 0.7,
                }}
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