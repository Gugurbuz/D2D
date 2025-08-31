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
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
  onBack: () => void;
};

type LatLng = [number, number];

/* ------------------------------------------------
   Ufak yardımcılar
------------------------------------------------ */
const fmtKm = (km: number | null) =>
  km == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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

/** Rep marker’ı: baş harfler (ZK, SO, vb.) */
function repIconFor(rep: Rep) {
  const txt = initials(rep.name || "R");
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
   Çizim Kontrolü (alan tooltip’i kapalı — hatayı önler)
------------------------------------------------ */
const DrawControl: React.FC<{
  onPolygon: (poly: L.Polygon) => void;
  onClear: () => void;
  fgRef: React.MutableRefObject<L.FeatureGroup | null>;
}> = ({ onPolygon, onClear, fgRef }) => {
  const map = useMap();

  useEffect(() => {
    if (!fgRef.current) fgRef.current = new L.FeatureGroup();
    map.addLayer(fgRef.current);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false, // <<< önemli: eski “type is not defined” hatasını önler
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
        featureGroup: fgRef.current,
        edit: false,
        remove: true,
      },
    });

    map.addControl(drawControl as any);

    const onCreated = (e: any) => {
      const layer = e.layer as L.Polygon;
      fgRef.current!.addLayer(layer);
      onPolygon(layer);
    };

    const onDeleted = () => {
      fgRef.current!.clearLayers();
      onClear();
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.DELETED, onDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.DELETED, onDeleted);
      map.removeControl(drawControl as any);
      if (fgRef.current) {
        map.removeLayer(fgRef.current);
      }
    };
  }, [map, onPolygon, onClear, fgRef]);

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
  // sadece koordinatı olan rep’ler
  const reps = allReps.filter((r) => r.lat != null && r.lng != null);
  const mapCenter: LatLng = reps[0] ? [reps[0].lat as number, reps[0].lng as number] : [40.9368, 29.1553];

  const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || "rep-1");

  // sağ panel (geri getirildi)
  const [panelOpen, setPanelOpen] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };

  // çizilen çokgen & seçim
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // rota
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // harita & marker referansları
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  const colorForCustomer = (c: Customer) => {
    const rid = assignments[c.id];
    return REP_COLORS[rid || "_default"] || REP_COLORS._default;
  };

  const highlightCustomer = (c: Customer, pan = true) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (pan && mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
    }
    if (m) m.openPopup();
    const row = document.getElementById(`sel-row-${c.id}`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Çokgen çizildiğinde
  const handlePolygonCreated = async (poly: L.Polygon) => {
    // önceki poligonu kaldır
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
    }
    polygonLayerRef.current = poly;

    const latlngs = (poly.getLatLngs()[0] as L.LatLng[]).map((p) => [p.lat, p.lng]) as LatLng[];

    // poligon içindeki müşteriler
    const inside = customers.filter((c) => pointInPolygon([c.lat, c.lng], latlngs));
    const insideIds = inside.map((c) => c.id);
    setSelectedIds(insideIds);

    // otomatik atama (seçili rep'e)
    if (insideIds.length) {
      setAssignments((prev) => {
        const n = { ...prev };
        insideIds.forEach((id) => (n[id] = selectedRepId));
        return n;
      });
    }

    // otomatik rota
    await computeRouteForSelection(inside, selectedRepId);

    // panel açık kalsın ve ilk müşteriyi vurgula
    if (inside[0]) highlightCustomer(inside[0], true);
  };

  // Manuel temizle
  const handleClear = () => {
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    setSelectedIds([]);
    setSelectedId(null);
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

      const rep =
        reps.find((r) => r.id === rid && r.lat != null && r.lng != null) ||
        reps.find((r) => r.lat != null && r.lng != null);

      if (!rep) return;

      const start: LatLng = [rep.lat as number, rep.lng as number];

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
    } catch {
      // Fallback: sırayla haversine
      const rep =
        reps.find((r) => r.id === rid && r.lat != null && r.lng != null) ||
        reps.find((r) => r.lat != null && r.lng != null);
      if (!rep) return;

      const seq = [[rep.lat as number, rep.lng as number] as LatLng, ...list.map((c) => [c.lat, c.lng] as LatLng)];
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteCoords(seq);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
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
            <span>Seçilen: <b>{selectedCustomers.length}</b></span>
          </div>

          <div className="text-sm text-gray-700 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>Rota: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></span>
          </div>
        </div>
      </div>

      {/* Harita + Sağ panel */}
      <div
        className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <MapContainer
          center={mapCenter as LatLngExpression}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

          {/* Çizim Kontrolü */}
          <DrawControl onPolygon={handlePolygonCreated} onClear={handleClear} fgRef={featureGroupRef} />

          {/* Rep Marker'ları — baş harflerle */}
          {reps.map((r) => (
            <Marker key={r.id} position={[r.lat as number, r.lng as number]} icon={repIconFor(r)}>
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
            const highlighted = selectedIds.includes(c.id) || selectedId === c.id;
            return (
              <Marker
                key={c.id}
                position={[c.lat, c.lng]}
                icon={customerIcon(color, highlighted)}
                ref={(ref: any) => {
                  if (ref) markerRefs.current[c.id] = ref;
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedId(c.id);
                  },
                }}
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

        {/* SAĞ PANEL — seçilenler & açıklama (geri geldi) */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${
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
                <span className="rotate-90 text-[10px] font-bold tracking-wider">SEÇİLEN</span>
                <Minimize2 className="w-4 h-4 rotate-90" />
              </div>
            )}
          </button>

          {/* Panel İçeriği */}
          <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[300px] max-w-sm h-full">
            {/* Başlık */}
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700 text-base select-none">Seçilenler</span>
            </div>

            {/* Açıklama */}
            <div className="text-[11px] text-gray-600">
              Çokgen aracı ile harita üzerinde bir alan çizdiğinizde, <b>alan içindeki müşteriler</b> seçtiğiniz
              satış uzmanına otomatik atanır. Seçimi temizlemek için aşağıdaki butonu kullanabilirsiniz.
            </div>

            {/* Küçük özet */}
            <div className="text-xs text-gray-700">
              Toplam seçilen müşteri: <b>{selectedCustomers.length}</b> • Tahmini rota:{" "}
              <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
            </div>

            {/* Liste – sadece burası scroll olur */}
            <div className="max-h-full overflow-auto pr-1">
              {selectedCustomers.length === 0 ? (
                <div className="text-xs text-gray-500">Henüz bir seçim yapmadınız.</div>
              ) : (
                selectedCustomers.map((c, i) => {
                  const tone =
                    assignments[c.id] && REP_COLORS[assignments[c.id] as keyof typeof REP_COLORS]
                      ? REP_COLORS[assignments[c.id] as keyof typeof REP_COLORS]
                      : REP_COLORS._default;
                  return (
                    <div
                      key={c.id}
                      id={`sel-row-${c.id}`}
                      className={`flex items-start gap-2 p-2 rounded transition ${
                        selectedId === c.id ? "bg-[#0099CB]/10" : "hover:bg-gray-50"
                      }`}
                      onClick={() => highlightCustomer(c, true)}
                    >
                      <span
                        className="w-7 h-7 flex items-center justify-center font-bold rounded-full text-white"
                        style={{ background: tone }}
                        title={`${i + 1}. seçilen`}
                      >
                        {i + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {c.address}, {c.district}
                        </div>
                        <div className="text-xs text-gray-600">
                          Saat: {c.plannedTime} • Tel: {c.phone}
                        </div>
                      </div>

                      <button
                        className="ml-auto px-2 py-1 rounded-lg hover:bg-gray-100 text-xs border"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignments((prev) => ({ ...prev, [c.id]: selectedRepId }));
                        }}
                        title="Seçili satış uzmanına ata"
                      >
                        Ata
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button onClick={handleClear} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                Seçimi Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentMapScreen;
