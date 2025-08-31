import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Route, ChevronLeft, ChevronRight } from "lucide-react";
import { Customer } from "../types";

const customerIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

type Props = {
  customers: Customer[];
  onOptimizeRoute?: (customers: Customer[]) => void;
};

function buildPolyline(customers: Customer[]): [number, number][] {
  return customers.map((c) => [c.lat, c.lng]);
}

const RouteMap: React.FC<Props> = ({ customers, onOptimizeRoute }) => {
  const [isListOpen, setIsListOpen] = useState(true);

  const center = useMemo<[number, number]>(() => {
    if (!customers?.length) return [41.015137, 28.97953];
    const lat = customers.reduce((s, c) => s + c.lat, 0) / customers.length;
    const lng = customers.reduce((s, c) => s + c.lng, 0) / customers.length;
    return [lat, lng];
  }, [customers]);

  const polyPoints = useMemo(() => buildPolyline(customers), [customers]);

  const handleOptimize = () => {
    onOptimizeRoute?.(customers);
  };

  return (
    <div style={{ display: "flex", height: "70vh", width: "100%" }}>
      <div
        style={{
          position: "relative",
          width: isListOpen ? 340 : 56,
          transition: "width 200ms ease",
          borderRight: "1px solid #e5e7eb",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => setIsListOpen((v) => !v)}
          style={{
            position: "absolute", top: 12, right: -14, width: 28, height: 28,
            borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff",
            display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", zIndex: 10,
          }}
        >
          {isListOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        <div
          style={{
            position: "sticky", top: 0, zIndex: 5, background: "#fff",
            borderBottom: "1px solid #f0f0f0", padding: "10px 12px",
            display: "flex", alignItems: "center", gap: 8, justifyContent: isListOpen ? "space-between" : "center",
          }}
        >
          {isListOpen ? (
            <>
              <div style={{ fontWeight: 600 }}>Ziyaret Listesi</div>
              <button
                onClick={handleOptimize}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-[#F9C800] font-semibold"
              >
                <Route size={18} />
                Rota Optimize Et
              </button>
            </>
          ) : (
            <button
              onClick={handleOptimize}
              title="Rota Optimize Et"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-[#F9C800]"
            >
              <Route size={18} />
            </button>
          )}
        </div>

        <div style={{ overflowY: "auto", padding: isListOpen ? "10px 10px 16px" : 0 }}>
          {isListOpen ? (
            customers.map((c, idx) => (
              <div key={c.id} className="border border-gray-100 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{idx + 1}. {c.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{c.status}</span>
                </div>
                <div className="text-sm text-gray-600">{c.address}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.plannedTime} • {c.distance} • {c.estimatedDuration}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-gray-500 p-2">Liste kapalı</div>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {customers.map((c) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon}>
              <Popup>
                <div className="font-semibold mb-1">{c.name}</div>
                <div className="text-sm text-gray-600">{c.address}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.plannedTime} • {c.distance} • {c.estimatedDuration}
                </div>
              </Popup>
            </Marker>
          ))}
          {polyPoints.length > 1 && <Polyline positions={polyPoints as any} color="#1D4ED8" weight={4} opacity={0.75} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteMap;
