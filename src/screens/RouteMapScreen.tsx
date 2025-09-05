// RouteMap.tsx

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  Star,
  StarOff,
  Navigation,
} from "lucide-react";

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
  customers?: Customer[];
  salesRep?: SalesRep;
}
const defaultSalesRep: SalesRep = {
  name: "Satış Uzmanı",
  lat: 40.9368,
  lng: 29.1553,
};

const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

function numberIcon(n: number, opts?: { highlight?: boolean; starred?: boolean }) {
  const highlight = !!opts?.highlight;
  const starred = !!opts?.starred;
  const bg = starred ? "#F5B301" : highlight ? "#FF6B00" : "#0099CB";
  const pulse = highlight ? "box-shadow:0 0 0 6px rgba(255,107,0,.15);" : "";
  return L.divIcon({
    className: "number-marker",
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;line-height:1;background:${bg};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${pulse}transform:${highlight ? "scale(1.14)" : "scale(1)"};">${n}</div>`,
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
const RouteMap: React.FC<Props> = ({ customers, salesRep }) => {
  const rep = salesRep || defaultSalesRep;
  const baseCustomers = customers && customers.length ? customers : [];
  const [orderedCustomers, setOrderedCustomers] = useState<Customer[]>(baseCustomers);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredId, setStarredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setPanelOpen(true);
    if (dx < -50) setPanelOpen(false);
    touchStartX.current = null;
  };

  const toTelHref = (phone: string) =>
    `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
  async function osrmTrip(coords: string) {
    const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
    const data = await res.json();
    if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");
    return data;
  }

  async function osrmRoute(from: LatLng, to: LatLng) {
    const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM route error: ${res.status}`);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("Route not found");
    return data;
  }

  const handleOptimize = async () => {
    try {
      setLoading(true);

      if (!starredId) {
        const tripPoints = [
          { kind: "rep" as const, lat: rep.lat, lng: rep.lng },
          ...baseCustomers.map(c => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
        ];
        const coords = tripPoints.map(p => `${p.lng},${p.lat}`).join(";");
        const data = await osrmTrip(coords);

        const orderedByTrip = data.waypoints
          .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
          .sort((a, b) => a.order - b.order)
          .map(x => tripPoints[x.inputIdx]);

        const sortedCustomers = orderedByTrip
          .filter(p => p.kind === "cust")
          .map(p => (p as any).ref as Customer);

        setOrderedCustomers(sortedCustomers);

        const latlngs: LatLng[] = data.trips[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        setRouteCoords(latlngs);
        setRouteKm((data.trips[0].distance as number) / 1000);

        if (sortedCustomers[0]) highlightCustomer(sortedCustomers[0], 0, true);

      } else {
        const star = baseCustomers.find(c => c.id === starredId)!;
        const others = baseCustomers.filter(c => c.id !== starredId);

        const dataRoute = await osrmRoute([rep.lat, rep.lng], [star.lat, star.lng]);
        const route1 = dataRoute.routes[0];
        const route1Coords: LatLng[] = route1.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const route1Km = (route1.distance as number) / 1000;

        const tripSeed = [{ lat: star.lat, lng: star.lng }, ...others.map(c => ({ lat: c.lat, lng: c.lng, ref: c }))];
        const coords2 = tripSeed.map(p => `${p.lng},${p.lat}`).join(";");
        const dataTrip2 = await osrmTrip(coords2);

        const ordered2 = dataTrip2.waypoints
          .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
          .sort((a, b) => a.order - b.order)
          .map(x => tripSeed[x.inputIdx]);

        const sortedCustomers = ordered2.map((p: any, idx: number) =>
          idx === 0 ? star : (p.ref as Customer)
        );

        setOrderedCustomers(sortedCustomers);

        const restCoords: LatLng[] = dataTrip2.trips[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const merged: LatLng[] = route1Coords.concat(restCoords.slice(1));

        setRouteCoords(merged);
        setRouteKm(route1Km + (dataTrip2.trips[0].distance as number) / 1000);

        highlightCustomer(star, 0, true);
      }
    } catch (e) {
      console.error(e);
      const seq: LatLng[] = (() => {
        const startList = starredId
          ? [baseCustomers.find(c => c.id === starredId)!, ...baseCustomers.filter(c => c.id !== starredId)]
          : baseCustomers;
        return [[rep.lat, rep.lng] as LatLng].concat(startList.map(c => [c.lat, c.lng] as LatLng));
      })();

      setRouteCoords(seq);
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteKm(acc);
    } finally {
      setLoading(false);
    }
  };
  const highlightCustomer = (c: Customer, i: number, pan = true) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (pan && mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
    }
    if (m) m.openPopup();
    const row = document.getElementById(`cust-row-${c.id}`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (starredId !== null) {
      handleOptimize();
    }
  }, [starredId]);

  useEffect(() => {
    setOrderedCustomers(baseCustomers);
  }, [baseCustomers]);

  const center: LatLng = [rep.lat, rep.lng];
  return (
    <div className="relative w-full">
      {/* Üst başlık ve butonlar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          Rota Haritası
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Toplam Mesafe: <b className="text-[#0099CB]">{fmtKm(routeKm)}</b>
          </div>
          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-semibold ${
              loading ? "bg-gray-300 text-gray-600" : "bg-[#0099CB] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Rota Hesaplanıyor…" : "Rotayı Optimize Et"}
          </button>
          <FullscreenBtn />
        </div>
      </div>

      {/* Harita */}
      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Satış Temsilcisi */}
          <Marker position={[rep.lat, rep.lng]} icon={repIcon}>
            <Popup>
              <b>{rep.name}</b>
            </Popup>
          </Marker>

          {/* Müşteri Markerları */}
          {orderedCustomers.map((c, i) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={numberIcon(i + 1, {
                highlight: selectedId === c.id,
                starred: starredId === c.id,
              })}
              zIndexOffset={1000 - i}
              ref={(ref: any) => {
                if (ref) markerRefs.current[c.id] = ref;
              }}
              eventHandlers={{
                click: () => {
                  setSelectedId(c.id);
                  const m = markerRefs.current[c.id];
                  if (m) m.openPopup();
                },
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <b>
                      {i + 1}. {c.name}
                    </b>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStarredId((prev) => (prev === c.id ? null : c.id));
                      }}
                      aria-label={starredId === c.id ? "Yıldızı kaldır" : "Yıldızla"}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starredId === c.id
                            ? "text-[#F5B301] fill-[#F5B301]"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>
                  <div>{c.address}, {c.district}</div>
                  <div>Saat: {c.plannedTime}</div>
                  <div>
                    Tel:{" "}
                    <a className="text-[#0099CB] underline" href={toTelHref(c.phone)}>
                      {c.phone}
                    </a>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full text-sm px-3 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigasyonu Başlat</span>
                  </a>
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
        {/* Panel ve aç/kapa butonu */}
        <div
          className={`absolute top-4 right-0 bottom-4 z-10 transition-all duration-300 ease-in-out ${
            panelOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%-1.5rem)] opacity-90"
          } flex`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white"
            title={panelOpen ? "Paneli kapat" : "Paneli aç"}
          >
            {panelOpen ? (
              <Minimize2 className="w-4 h-4 -rotate-90" />
            ) : (
              <div className="flex flex-col items-center text-xs font-semibold text-white leading-none">
                <span className="rotate-90 tracking-wider">ZİYARET</span>
                <Minimize2 className="w-4 h-4 rotate-90 mt-1" />
              </div>
            )}
          </button>

          <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[270px] max-w-[21.6rem] h-full overflow-y-auto scrollbar-gutter-stable">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#0099CB]" />
              <span className="font-semibold text-gray-700 text-base select-none">
                Ziyaret Sırası
              </span>
            </div>
            <div className="text-[11px] text-gray-600">
              ⭐ Bir müşteriyi yıldızlarsan rota önce o müşteriye gider; kalan duraklar
              en kısa şekilde planlanır. Yıldızı değiştirince rota otomatik güncellenir.
            </div>
            <div className="max-h-full overflow-auto pr-1">
              {orderedCustomers.map((c, i) => {
                const selected = selectedId === c.id;
                const starred = starredId === c.id;
                return (
                  <div
                    key={c.id}
                    id={`cust-row-${c.id}`}
                    className={`flex items-center gap-2 p-3 rounded transition cursor-pointer ${
                      selected ? "bg-[#0099CB]/10" : "hover:bg-gray-50"
                    }`}
                    onClick={() => highlightCustomer(c, i)}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white ${
                        starred
                          ? "bg-[#F5B301]"
                          : selected
                          ? "bg-[#FF6B00]"
                          : "bg-[#0099CB]"
                      }`}
                      title={`${i + 1}. müşteri`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {c.address}, {c.district}
                      </div>
                      <a
                        className="text-xs text-[#0099CB] underline"
                        href={toTelHref(c.phone)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.phone}
                      </a>
                    </div>
                    <button
                      className="ml-auto p-1.5 rounded-lg hover:bg-gray-100"
                      title={starred ? "İlk duraktan kaldır" : "İlk durak yap"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStarredId((prev) => (prev === c.id ? null : c.id));
                      }}
                    >
                      {starred ? (
                        <Star className="w-5 h-5 text-[#F5B301] fill-[#F5B301]" />
                      ) : (
                        <StarOff className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium ml-1">
                      {c.plannedTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">
              Rota Hesaplanıyor…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const FullscreenBtn: React.FC = () => {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  return (
    <button
      onClick={async () => {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      }}
      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
    >
      {isFs ? (
        <>
          <Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat
        </>
      ) : (
        <>
          <Maximize2 className="w-4 h-4" /> Tam Ekran
        </>
      )}
    </button>
  );
};

export default RouteMap;
