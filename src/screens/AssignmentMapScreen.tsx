// src/screens/AssignmentMapScreen.tsx
import React, { useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup, CircleMarker } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { Customer } from '../RouteMap';
import { Rep } from '../types';
import { ArrowLeft, Check } from 'lucide-react';

// leaflet default marker fix (vite)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
  onBack: () => void;
};

type LatLngTuple = [number, number];

// basit ray-casting point-in-polygon
function pointInPolygon(point: LatLngTuple, vs: LatLngTuple[]) {
  const x = point[1]; // lng
  const y = point[0]; // lat
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][1], yi = vs[i][0];
    const xj = vs[j][1], yj = vs[j][0];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const AssignmentMapScreen: React.FC<Props> = ({
  customers,
  assignments,
  setAssignments,
  allReps,
  onBack,
}) => {
  const [selectedRep, setSelectedRep] = useState<string>(allReps[0]?.id || '');
  const [polygon, setPolygon] = useState<LatLngTuple[] | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  const center: LatLngTuple = useMemo(() => {
    // kaba ortalama (İstanbul - Maltepe default olabilir)
    if (customers.length === 0) return [40.9368, 29.1553];
    const lat = customers.reduce((a, c) => a + c.lat, 0) / customers.length;
    const lng = customers.reduce((a, c) => a + c.lng, 0) / customers.length;
    return [lat, lng];
  }, [customers]);

  const selectedCustomers = useMemo(() => {
    if (!polygon) return [];
    return customers.filter(c => pointInPolygon([c.lat, c.lng], polygon));
  }, [customers, polygon]);

  const handleAssignSelected = () => {
    if (!selectedRep) { alert('Lütfen bir satış uzmanı seçiniz.'); return; }
    if (selectedCustomers.length === 0) { alert('Çizilen alan içinde müşteri bulunamadı.'); return; }

    setAssignments(prev => {
      const next = { ...prev };
      selectedCustomers.forEach(c => { next[c.id] = selectedRep; });
      return next;
    });
    alert(`${selectedCustomers.length} müşteri atandı.`);
  };

  const onCreated = (e: any) => {
    // yalnız tek şekil kalsın
    const fg = featureGroupRef.current;
    if (fg) {
      fg.eachLayer((layer: any) => {
        if (layer !== e.layer) fg.removeLayer(layer);
      });
    }
    // polygon/rectangle düğümlerini al
    const layer = e.layer;
    let latlngs: LatLng[] | LatLng[][] = layer.getLatLngs();
    // rectangle/polygon ring → düz diziye indir
    const flat: LatLngTuple[] = Array.isArray(latlngs[0])
      ? (latlngs[0] as LatLng[]).map((p) => [p.lat, p.lng])
      : (latlngs as LatLng[]).map((p) => [p.lat, p.lng]);

    setPolygon(flat);
  };

  const onDeleted = () => {
    setPolygon(null);
  };

  return (
    <div className="p-6">
      {/* üst bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Haritadan Atama</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Satış Uzmanı:</span>
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {allReps.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <button
            onClick={handleAssignSelected}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold"
          >
            <Check className="w-4 h-4" />
            Seçili Alanı Ata ({selectedCustomers.length})
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Harita */}
        <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow">
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FeatureGroup ref={featureGroupRef as any}>
              <EditControl
                position="topleft"
                onCreated={onCreated}
                onDeleted={onDeleted}
                draw={{
                  polyline: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  // polygon & rectangle aktif
                }}
              />
            </FeatureGroup>

            {/* Müşteriler */}
            {customers.map((c) => {
              const isSel = polygon ? pointInPolygon([c.lat, c.lng], polygon) : false;
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={isSel ? 9 : 6}
                  pathOptions={{ color: isSel ? '#FF6B00' : '#0099CB', weight: 2, fillOpacity: 0.8 }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-sm">{c.address}, {c.district}</div>
                      <div className="text-sm">Saat: {c.plannedTime}</div>
                      <div className="text-sm">Tel: {c.phone}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Sağ özet panel */}
        <div className="bg-white rounded-2xl border p-4 h-[560px] overflow-auto">
          <div className="font-semibold text-gray-900 mb-2">Seçilen Müşteriler</div>
          <div className="text-sm text-gray-600 mb-3">
            Çizdiğin alan içinde kalan müşteriler aşağıda listelenir. “Seçili Alanı Ata” ile {allReps.find(r=>r.id===selectedRep)?.name}’e atanır.
          </div>
          {selectedCustomers.length === 0 ? (
            <div className="text-gray-500 text-sm">Henüz seçim yok.</div>
          ) : (
            <div className="space-y-2">
              {selectedCustomers.map((c) => (
                <div key={c.id} className="p-2 rounded-lg border hover:bg-gray-50">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-600">{c.address}, {c.district}</div>
                  <div className="text-xs text-gray-600">Saat: {c.plannedTime} • Tel: {c.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentMapScreen;
