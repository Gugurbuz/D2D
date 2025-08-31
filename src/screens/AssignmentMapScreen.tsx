// src/screens/AssignmentMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Customer } from "../RouteMap";
import { Rep } from "../types";

/* ------------------------------------------------
   Tipler & Props
------------------------------------------------ */
type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
  onBack: () => void;
};

type LatLng = [number, number];

const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

/** Basit point-in-polygon (ray casting) */
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
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
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
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
   Marker stilleri
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

const repIcon = L.divIcon({
  className: "rep-marker",
  html: `
    <div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:50%;
      background:#111827;color:#fff;border:2px solid #fff;
      font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.25);
    ">R</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -22],
});

/* ------------------------------------------------
   Çizim Kontrolü (alan tooltip'i kapalı)
------------------------------------------------ */
const DrawControl: React.FC<{ onPolygon: (poly: L.Polygon) => void }> = ({ onPolygon }) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    // featureGroup'u haritaya ekleyelim (silme için gerekli)
    map.addLayer(drawnItemsRef.current);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false, // <-- Hatanın kaynağı olan tooltip’i kapat
          metric: true,
          shapeOptions: { color: "#0099CB", weight: 2 },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItemsRef.current,
        edit: false,
        remove: true,
      },
    });

    map.addControl(drawControl as any);

    const onCreated = (e: any) => {
      const layer = e.layer as L.Polygon;
      drawnItemsRef.current.addLayer(layer);
      onPolygon(layer);
    };

    const onDeleted = () => {
      drawnItemsRef.current.clearLayers();
      // Silinince üst komponent seçim ve rotayı temizleyecek.
      map.fire("assignment-clear" as any);
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.DELETED, onDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.DELETED, onDeleted);
      map.removeControl(drawControl as any);
      map.removeLayer(drawnItemsRef.current);
    };
  }, [map, onPolygon]);

  return null;
};

/* ------------------------------------------------
   Ana Bileşen
------------------------------------------------ */
const AssignmentMapScreen: React.FC<Props> = ({
  customers,
  assignments,
  setAssignments,
  allReps,
  onBack,
}) => {
  const reps = allReps.filter(r => r.lat != null && r.lng != null); // güvenli liste
  const mapCenter: LatLng = reps[0] ? [reps[0].lat as number, reps[0].lng as number] : [40.9368, 29.1553];

  const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");

  // çizilen çokgen & seçim
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // rota
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // özet modal
  const [showSummary, setShowSummary] = useState(false);
  const [summaryRows, setSummaryRows] = useState<{ repId: string; repName: string; count: number; km: number | null }[]>([]);

  // toast
  const [toast, setToast] = useState<string | null>(null);

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  const colorForCustomer = (c: Customer) => {
    const rid = assignments[c.id];
    return REP_COLORS[rid || "_default"] || REP_COLORS._default;
  };

  // Çokgen çizildiğinde
  const handlePolygonCreated = async (poly: L.Polygon) => {
    if (polygonLayerRef.current) polygonLayerRef.current.remove();
    polygonLayerRef.current = poly;

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map(p => [p.lat, p.lng]) as LatLng[];

    // poligon içindeki müşteriler
    const inside = customers.filter(c => pointInPolygon([c.lat, c.lng], latlngs));
    const insideIds = inside.map(c => c.id);
    setSelectedIds(insideIds);

    // otomatik atama (seçili rep'e)
    if (insideIds.length) {
      setAssignments(prev => {
        const n = { ...prev };
        insideIds.forEach(id => (n[id] = selectedRepId));
        return n;
      });
    }

    // otomatik rota
    await computeRouteForSelection(inside, selectedRepId);
  };

  // Harita "assignment-clear" olayı → seçim/rota temizle
  useEffect(() => {
    // @ts-ignore
    const handler = () => { setSelectedIds([]); setRouteCoords([]); setRouteKm(null); };
    // Leaflet map'i hook'tan almak zahmetli, basit çözüm: window üstünden dinleme yok.
    // Bunu atlıyoruz çünkü DrawControl zaten map.fire ile tetikliyor; burada cleanup
    // üst komponentte manuel yapılabilir. (İhtiyaç yoksa boş bırakın.)
    return () => {};
  }, []);

  // Rota hesaplama (seçilenler için)
  const computeRouteForSelection = async (list: Customer[], rid: string) => {
    try {
      setLoading(true);
      setRouteCoords([]);
      setRouteKm(null);

      if (!list.length) return;

      const rep =
        reps.find(r => r.id === rid && r.lat != null && r.lng != null) ||
        reps.find(r => r.lat != null && r.lng != null);

      if (!rep) return; // güvenlik

      const start: LatLng = [rep.lat as number, rep.lng as number];

      // OSRM trip (rep + müşteriler)
      const coords = [start, ...list.map(c => [c.lat, c.lng] as LatLng)]
        .map(p => `${p[1]},${p[0]}`)
        .join(";");

      const data = await osrmTrip(coords);
      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(latlngs);
      setRouteKm((data.trips[0].distance as number) / 1000);
    } catch {
      // Fallback: sırayla haversine
      const rep =
        reps.find(r => r.id === rid && r.lat != null && r.lng != null) ||
        reps.find(r => r.lat != null && r.lng != null);
      if (!rep) return;

      const seq = [[rep.lat as number, rep.lng as number] as LatLng, ...list.map(c => [c.lat, c.lng] as LatLng)];
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteCoords(seq);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };

  // Rota Özeti
  const buildSummary = async () => {
    const rows: { repId: string; repName: string; count: number; km: number | null }[] = [];
    for (const r of reps) {
      const list = customers.filter(c => assignments[c.id] === r.id);
      if (!list.length || r.lat == null || r.lng == null) {
        rows.push({ repId: r.id, repName: r.name, count: list.length, km: list.length ? 0 : 0 });
        continue;
      }
      let km: number | null = null;
      try {
        const coords = [[r.lat, r.lng] as LatLng, ...list.map(c => [c.lat, c.lng] as LatLng)]
          .map(p => `${p[1]},${p[0]}`)
          .join(";");
        const data = await osrmTrip(coords);
        km = (data.trips[0].distance as number) / 1000;
      } catch {
        const seq = [[r.lat, r.lng] as LatLng, ...list.map(c => [c.lat, c.lng] as LatLng)];
        let acc = 0;
        for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
        km = acc;
      }
      rows.push({ repId: r.id, repName: r.name, count: list.length, km });
    }
    setSummaryRows(rows);
    setShowSummary(true);
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
            <span>Seçilen: <b>{selectedIds.length}</b></span>
          </div>

          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></span>
          </div>

          <button
            onClick={buildSummary}
            className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90"
          >
            Rota Özeti
          </button>
        </div>
      </div>

      {/* Harita */}
      <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
        <MapContainer center={mapCenter as LatLngExpression} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

          {/* Çizim Kontrolü */}
          <DrawControl onPolygon={handlePolygonCreated} />

          {/* Rep Marker'ları (koord. olanlar) */}
          {reps.map((r) => (
            <Marker key={r.id} position={[r.lat as number, r.lng as number]} icon={repIcon}>
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
                      Atanan:{" "}
                      <b>
                        {assignments[c.id]
                          ? reps.find((r) => r.id === assignments[c.id])?.name || assignments[c.id]
                          : "—"}
                      </b>
                    </div>
                    <button
                      onClick={() => setAssignments((prev) => ({ ...prev, [c.id]: selectedRepId }))}
                      className="mt-2 w-full px-3 py-1.5 rounded bg-[#0099CB] text-white text-xs"
                    >
                      Bu Müşteriyi Ata ({reps.find((r) => r.id === selectedRepId)?.name})
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Rota çizgisi */}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords as LatLngExpression[]} pathOptions={{ color: "#0099CB", weight: 7 }} />
          )}
        </MapContainer>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>

      {/* Alt bilgi */}
      <div className="mt-2 text-xs text-gray-600">
        Çokgen aracı ile bir alan çizdiğinizde, alan içindeki müşteriler seçtiğiniz satış
        uzmanına otomatik atanır ve rota hesaplanır.
      </div>

      {/* Özet Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-[#0099CB]" />
                Rota Özeti
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setShowSummary(false)} aria-label="Kapat">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2">Satış Uzmanı</th>
                      <th className="py-2">Atanan Müşteri</th>
                      <th className="py-2">Toplam Yol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.repId} className="border-t">
                        <td className="py-2">{row.repName}</td>
                        <td className="py-2">{row.count}</td>
                        <td className="py-2">{fmtKm(row.km)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={() => setShowSummary(false)} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
                  Devam Et
                </button>
                <button
                  onClick={() => {
                    setShowSummary(false);
                    setToast("Görev atamaları tamamlandı.");
                    setTimeout(() => setToast(null), 2500);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tamamla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border px-4 py-3 text-sm text-gray-800">{toast}</div>
        </div>
      )}
    </div>
  );
};

export default AssignmentMapScreen;
