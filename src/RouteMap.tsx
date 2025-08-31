import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2 } from "lucide-react";

export type Customer = {
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
  phone: string;
};

export type SalesRep = {
  name: string;
  lat: number;
  lng: number;
};

type LatLng = [number, number];

interface Props {
  customers: Customer[];
  salesRep: SalesRep;
}

const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

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
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const center: LatLng = [salesRep.lat, salesRep.lng];

  const [orderedCustomers, setOrderedCustomers] = useState(customers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;

  const handleOptimize = async () => {
    const tripPoints = [
      { kind: "rep" as const, lat: salesRep.lat, lng: salesRep.lng },
      ...customers.map(c => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
    ];
    const coords = tripPoints.map(p => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;

    try {
      setLoading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
      const data = await res.json();
      if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");

      const orderedByTrip = data.waypoints
        .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
        .sort((a: any, b: any) => a.order - b.order)
        .map((x: any) => tripPoints[x.inputIdx]);

      const sortedCustomers = orderedByTrip.filter(p => p.kind === "cust").map(p => (p as any).ref);
      setOrderedCustomers(sortedCustomers);

      const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      setRouteCoords(latlngs);
      setRouteKm((data.trips[0].distance as number) / 1000);
    } catch (e) {
      console.error(e);
      const seq: LatLng[] = [[salesRep.lat, salesRep.lng], ...orderedCustomers.map(c => [c.lat, c.lng] as LatLng)];
      setRouteCoords(seq);
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };

  const highlightCustomer = (c: Customer, index: number, pan = true) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (pan && mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
    }
    if (m) m.openPopup();
    const el = document.getElementById(`cust-row-${c.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const toggleFullscreen = async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // bazı tarayıcılar kullanıcı jesti ister
    }
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">Rota Haritası</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b></div>
          <button onClick={handleOptimize} disabled={loading}
                  className={`px-4 py-2 rounded-lg font-semibold ${loading ? 'bg-gray-300 text-gray-600' : 'bg-[#0099CB] text-white hover:opacity-90'}`}>
            {loading ? 'Rota Hesaplanıyor…' : 'Rotayı Optimize Et'}
          </button>
          <button onClick={toggleFullscreen} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">
            {isFullscreen ? <><Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Harita */}
        <div className="lg:col-span-3">
          <div className="h-[560px] w-full rounded-2xl overflow-hidden shadow relative">
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <Marker position={[salesRep.lat, salesRep.lng]} icon={repIcon}>
                <Popup><b>{salesRep.name}</b></Popup>
              </Marker>

              {orderedCustomers.map((c, i) => (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  icon={numberIcon(i + 1, selectedId === c.id)}
                  zIndexOffset={1000 - i}
                  ref={(ref: any) => { if (ref) markerRefs.current[c.id] = ref; }}
                  eventHandlers={{ click: () => highlightCustomer(c, i, true) }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div><b>{i + 1}. {c.name}</b></div>
                      <div>{c.address}, {c.district}</div>
                      <div>Saat: {c.plannedTime}</div>
                      <div>Tel: <a href={toTelHref(c.phone)} className="text-[#0099CB] underline">{c.phone}</a></div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Ziyaret Sırası */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow p-4 max-h-[560px] overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Ziyaret Sırası</h3>
              <button onClick={() => setListOpen(o => !o)} className="text-sm text-[#0099CB] underline">
                {listOpen ? 'Listeyi Kapat' : 'Listeyi Aç'}
              </button>
            </div>

            {listOpen && (
              <div className="space-y-2">
                {orderedCustomers.map((c, i) => {
                  const selected = c.id === selectedId;
                  return (
                    <div id={`cust-row-${c.id}`} key={c.id}
                         className={`p-3 rounded-lg border transition ${selected ? "bg-[#0099CB]/10 border-[#0099CB]/30" : "bg-white hover:bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => highlightCustomer(c, i, true)}
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-sm font-bold ${selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"}`}
                          title={`${i + 1}. müşteriyi vurgula`}
                        >
                          {i + 1}
                        </button>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{c.name}</div>
                          <div className="text-xs text-gray-600 truncate">{c.address}, {c.district}</div>
                          <a href={toTelHref(c.phone)} className="text-xs text-[#0099CB] underline">{c.phone}</a>
                        </div>
                        <span className="ml-auto text-xs text-gray-700 font-semibold">{c.plannedTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">Rota Hesaplanıyor…</div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
