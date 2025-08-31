// src/AssignMap.tsx
import React, { useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import { Route as RouteIcon, Check, Users } from 'lucide-react';
import type { Customer, SalesRep } from './RouteMap';

type Props = {
  customers: Customer[];
  reps: SalesRep[];
  onAssign: (selectedIds: Set<string>, repId: string) => void;
};

const repIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

const AssignMap: React.FC<Props> = ({ customers, reps, onAssign }) => {
  const mapCenter: [number, number] = useMemo(() => {
    const c = customers[0];
    return c ? [c.lat, c.lng] : [41.015, 28.979];
  }, [customers]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRepId, setSelectedRepId] = useState<string>(reps[0]?.id || 'rep-1');
  const [rect, setRect] = useState<LatLngBounds | null>(null);

  const featureGroupRef = useRef<any>(null);

  const handleCreated = (e: any) => {
    // yalnız RECTANGLE açık
    const layer = e.layer;
    const _bounds: LatLngBounds = layer.getBounds();
    setRect(_bounds);

    // seçimi hesapla
    const next = new Set<string>();
    customers.forEach(c => {
      const latlng = L.latLng(c.lat, c.lng);
      if (_bounds.contains(latlng)) next.add(c.id);
    });
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setRect(null);
    setSelectedIds(new Set());
    if (featureGroupRef.current) {
      const fg = featureGroupRef.current;
      fg.clearLayers();
    }
  };

  return (
    <div className="relative">
      {/* Üst şerit */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <RouteIcon className="w-5 h-5 text-[#0099CB]" />
          Görev Atama (Dikdörtgen Seçim)
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Seçili Müşteri: <b className="text-[#0099CB]">{selectedIds.size}</b>
          </div>
          <button onClick={clearSelection} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Seçimi Temizle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Harita */}
        <div className="lg:col-span-3">
          <div className="relative h-[560px] rounded-2xl overflow-hidden shadow-xl">
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              {/* Draw control */}
              <EditControl
                position="topleft"
                onCreated={handleCreated}
                draw={{
                  polyline: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polygon: false,   // istersen true yap
                  rectangle: true,
                }}
                edit={{
                  edit: false,
                  remove: false,
                }}
              />
              {/* Müşteriler */}
              {customers.map((c) => (
                <Marker key={c.id} position={[c.lat, c.lng]} icon={repIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <b>{c.name}</b>
                      <div>{c.address}, {c.district}</div>
                      <div>Saat: {c.plannedTime}</div>
                      {c.assignedRepId && (
                        <div className="text-xs text-gray-600">Atanan: {reps.find(r => r.id === c.assignedRepId)?.name || c.assignedRepId}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {/* Seçili dikdörtgeni göster (opsiyonel görsel teyit) */}
              {rect && <Rectangle bounds={rect} pathOptions={{ color: '#0099CB', weight: 2 }} />}
            </MapContainer>
          </div>
        </div>

        {/* Sağ Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-[560px] flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#0099CB]" />
              <div className="font-semibold text-gray-900">Atama Paneli</div>
            </div>

            <label className="text-sm text-gray-600 mb-1">Satış Uzmanı</label>
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="mb-3 w-full border rounded-lg p-2"
            >
              {reps.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <div className="text-xs text-gray-600 mb-2">
              Haritada <b>dikdörtgen</b> çiz; içindeki müşteriler aşağıya listelenecek.
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
              {Array.from(selectedIds).length === 0 ? (
                <div className="p-3 text-sm text-gray-500">Henüz seçim yok.</div>
              ) : (
                <ul className="divide-y">
                  {customers
                    .filter(c => selectedIds.has(c.id))
                    .map(c => (
                      <li key={c.id} className="p-3">
                        <div className="font-medium text-sm text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-600 truncate">{c.address}, {c.district}</div>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => onAssign(selectedIds, selectedRepId)}
              disabled={selectedIds.size === 0}
              className={`mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                selectedIds.size === 0 ? 'bg-gray-300 text-gray-600' : 'bg-[#0099CB] text-white hover:opacity-90'
              }`}
            >
              <Check className="w-4 h-4" />
              Seçilileri Ata
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignMap;
