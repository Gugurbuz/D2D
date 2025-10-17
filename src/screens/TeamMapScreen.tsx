// src/screens/TeamMapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Phone, Users, Maximize2, Minimize2, Search, MessageSquare, X, Flame } from 'lucide-react';
import type { TeamRep } from '../data/team';
import { teamReps as defaultTeam } from '../data/team';

/* ================== Yardımcılar ================== */

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);
const toWaHref = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '90' + cleaned.substring(1);
  return `https://wa.me/${cleaned}`;
};
const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;

function ratioColor(completed: number, total: number) {
  if (!total) return '#9CA3AF';
  const r = completed / total;
  if (r >= 0.8) return '#16A34A';
  if (r >= 0.5) return '#F59E0B';
  return '#EF4444';
}
function initials(fullName?: string | null) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}
function repDivIcon(rep: TeamRep) {
  const pct = rep.totalToday > 0 ? Math.round((rep.completedToday / rep.totalToday) * 100) : 0;
  const color = ratioColor(rep.completedToday, rep.totalToday);
  const nameInit = initials(rep.name);
  return L.divIcon({
    className: 'rep-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div style="width:34px;height:34px;border-radius:50%;
          background:${color};color:#fff;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid #fff;">
          ${nameInit}
        </div>
        <div style="width:38px;height:6px;border-radius:4px;background:#E5E7EB;overflow:hidden;border:1px solid #fff;
          box-shadow:0 1px 3px rgba(0,0,0,.15);">
          <div style="height:100%;width:${pct}%;background:${color};"></div>
        </div>
      </div>
    `,
    iconSize: [38, 44],
    iconAnchor: [19, 44],
    popupAnchor: [0, -46],
  });
}

const FullscreenBtn: React.FC = () => {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  return (
    <button
      onClick={async () => {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      }}
      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
    >
      {isFs ? <><Minimize2 className="w-4 h-4" /> Tam Ekranı Kapat</> : <><Maximize2 className="w-4 h-4" /> Tam Ekran</>}
    </button>
  );
};

/* ================== Heat Katmanı (Leaflet.heat) ================== */

type HeatPoint = [number, number, number]; // [lat, lng, weight]

const HeatLayer: React.FC<{
  points: HeatPoint[];
  radius: number;
  blur: number;
  maxZoom?: number;
  gradient?: Record<number, string>;
  opacity?: number;
}> = ({ points, radius, blur, maxZoom = 17, gradient, opacity = 0.6 }) => {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (points.length === 0) return;

    const layer = (L as any).heatLayer(points, {
      radius,
      blur,
      maxZoom,
      gradient,
      minOpacity: opacity,
    });
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, JSON.stringify(points), radius, blur, maxZoom, gradient, opacity]);

  return null;
};

/* ============ Opsiyonel: Rep nokta şeması (geri uyumluluk için güvenli) ============ */
/**
 * Eğer TeamRep içinde aşağıdaki gibi bir alan varsa otomatik kullanılır:
 *   points?: Array<{ lat: number; lng: number; type: 'visited'|'potential'|'won'|'lost'; weight?: number }>
 * Yoksa reps konumları completed/total oranıyla ağırlıklandırılarak kullanılır.
 */

type Props = {
  reps?: TeamRep[];
  center?: [number, number];
};

const TeamMapScreen: React.FC<Props> = ({ reps, center }) => {
  const team = reps && reps.length ? reps : defaultTeam;

  const avgCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (team.length === 0) return [41.0082, 28.9784];
    const la = team.reduce((a, r) => a + r.lat, 0) / team.length;
    const ln = team.reduce((a, r) => a + r.lng, 0) / team.length;
    return [la, ln];
  }, [team, center]);

  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [showVisits, setShowVisits] = useState(true);
  const [showPotential, setShowPotential] = useState(true);
  const [showConversion, setShowConversion] = useState(true);
  const [radius, setRadius] = useState(22);
  const [blur, setBlur] = useState(18);

  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const [messagingPanel, setMessagingPanel] = useState<{ isOpen: boolean; rep: TeamRep | null }>({ isOpen: false, rep: null });
  const handleOpenMessagePanel = (rep: TeamRep) => setMessagingPanel({ isOpen: true, rep });
  const handleCloseMessagePanel = () => setMessagingPanel({ isOpen: false, rep: null });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return team;
    return team.filter(r =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.phone && r.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
    );
  }, [team, query]);

  const totals = useMemo(() => {
    const completed = team.reduce((a, r) => a + r.completedToday, 0);
    const planned = team.reduce((a, r) => a + r.totalToday, 0);
    const rate = planned ? Math.round((completed / planned) * 100) : 0;
    return { completed, planned, rate };
  }, [team]);

  /* ============ Heat verilerini hazırla ============ */

  // 1) Eğer rep.points varsa ondan üret, yoksa rep konumunu oranla ağırlıklandır.
  const visitsHeat: HeatPoint[] = useMemo(() => {
    const fromPoints = team.flatMap((r: any) =>
      Array.isArray(r.points)
        ? (r.points as any[])
            .filter(p => p && p.type === 'visited' && Number.isFinite(p.lat) && Number.isFinite(p.lng))
            .map(p => [p.lat, p.lng, Math.max(0.1, p.weight ?? 1)])
        : []
    );
    if (fromPoints.length) return fromPoints;

    // fallback: reps konumlarına ziyaret varsayımı
    return team.map(r => {
      const w = Math.max(0.1, r.totalToday || 0); // plan sayısı yoğunluk kabul
      return [r.lat, r.lng, w] as HeatPoint;
    });
  }, [team]);

  const potentialHeat: HeatPoint[] = useMemo(() => {
    const fromPoints = team.flatMap((r: any) =>
      Array.isArray(r.points)
        ? (r.points as any[])
            .filter(p => p && p.type === 'potential' && Number.isFinite(p.lat) && Number.isFinite(p.lng))
            .map(p => [p.lat, p.lng, Math.max(0.1, p.weight ?? 1)])
        : []
    );
    if (fromPoints.length) return fromPoints;

    // fallback: reps konumlarına basit potansiyel katsayısı (ör: plan - tamamlanan)
    return team.map(r => {
      const potential = Math.max(0, (r.totalToday || 0) - (r.completedToday || 0));
      const w = Math.max(0.1, potential);
      return [r.lat, r.lng, w] as HeatPoint;
    });
  }, [team]);

  const conversionHeat: HeatPoint[] = useMemo(() => {
    const fromPoints = team.flatMap((r: any) =>
      Array.isArray(r.points)
        ? (r.points as any[])
            .filter(p => p && (p.type === 'won' || p.type === 'lost') && Number.isFinite(p.lat) && Number.isFinite(p.lng))
            // won -> pozitif ağırlık, lost -> düşük ancak görünür
            .map(p => [p.lat, p.lng, Math.max(0.1, p.type === 'won' ? (p.weight ?? 1) * 1.0 : (p.weight ?? 1) * 0.25)])
        : []
    );
    if (fromPoints.length) return fromPoints;

    // fallback: reps konumlarında tamamlanan/planlanan oranı
    return team.map(r => {
      const ratio = r.totalToday ? r.completedToday / r.totalToday : 0;
      const w = Math.max(0.1, ratio); // 0.1-1 arası
      return [r.lat, r.lng, w] as HeatPoint;
    });
  }, [team]);

  // Renk gradyanları — ziyaret: turuncu, potansiyel: mavi, dönüşüm: yeşil
  const visitsGradient = useMemo(() => ({
    0.0: '#fff7ed', 0.2: '#fed7aa', 0.4: '#fdba74', 0.6: '#fb923c', 0.8: '#f97316', 1.0: '#ea580c'
  }), []);
  const potentialGradient = useMemo(() => ({
    0.0: '#eff6ff', 0.2: '#bfdbfe', 0.4: '#93c5fd', 0.6: '#60a5fa', 0.8: '#3b82f6', 1.0: '#1d4ed8'
  }), []);
  const conversionGradient = useMemo(() => ({
    0.0: '#ecfdf5', 0.2: '#a7f3d0', 0.4: '#6ee7b7', 0.6: '#34d399', 0.8: '#10b981', 1.0: '#059669'
  }), []);

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Users className="w-5 h-5 text-[#0099CB]" />
          Ekip Haritası
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div>
            Tamamlanan: <b className="text-green-600">{totals.completed}</b> /
            Planlanan: <b>{totals.planned}</b> — Oran: <b className="text-[#0099CB]">%{totals.rate}</b>
          </div>
          <FullscreenBtn />
        </div>
      </div>

      <div className="relative h-[560px] w-full rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          center={avgCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(m) => (mapRef.current = m)}
          className="z-0"
        >
          {/* Public OSM ile devam */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Isı Katmanları */}
          {showVisits && (
            <HeatLayer
              points={visitsHeat}
              radius={radius}
              blur={blur}
              gradient={visitsGradient}
              opacity={0.55}
            />
          )}
          {showPotential && (
            <HeatLayer
              points={potentialHeat}
              radius={radius}
              blur={blur}
              gradient={potentialGradient}
              opacity={0.45}
            />
          )}
          {showConversion && (
            <HeatLayer
              points={conversionHeat}
              radius={radius}
              blur={blur}
              gradient={conversionGradient}
              opacity={0.6}
            />
          )}

          {/* Rep markerları */}
          {filtered.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={repDivIcon(r)}
              ref={(ref: any) => { if (ref) markerRefs.current[r.id] = ref; }}
              eventHandlers={{
                click: () => {
                  setSelectedId(r.id);
                  const m = markerRefs.current[r.id];
                  if (m) m.openPopup();
                },
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm">
                    Tamamlanan / Toplam: <b>{r.completedToday}/{r.totalToday}</b>
                  </div>
                  <div className="text-sm flex items-center gap-2 mt-2">
                    <Phone className="w-3.5 h-3.5" />
                    <a className="text-[#0099CB] underline" href={toTelHref(r.phone)}>{r.phone}</a>
                    <a
                      href={toWaHref(r.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                      title="WhatsApp ile mesaj gönder"
                    >
                      <WhatsAppIcon />
                    </a>
                    <button
                      onClick={() => handleOpenMessagePanel(r)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Uygulama içi mesaj gönder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Sağ kontrol paneli */}
        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-1.5rem)]'} flex`}>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white"
            title={panelOpen ? 'Paneli kapat' : 'Paneli aç'}
          >
            {panelOpen ? (
              <Minimize2 className="w-4 h-4 -rotate-90" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="rotate-90 text-[10px] font-bold tracking-wider">EKİP</span>
                <Minimize2 className="w-4 h-4 rotate-90" />
              </div>
            )}
          </button>

          <div className="bg-white/90 backdrop-blur rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[340px] max-w-sm h-full">
            {/* Arama */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İsim veya telefon ile ara…"
                className="block w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-[#0099CB] focus:border-transparent text-sm"
              />
            </div>

            {/* Heat toggles */}
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <div className="font-medium text-gray-800">Isı Haritası Katmanları</div>
              </div>

              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={showVisits} onChange={(e) => setShowVisits(e.target.checked)} />
                <span className="text-sm">Ziyaret Yoğunluğu</span>
                <span className="ml-auto inline-block w-4 h-2 rounded" style={{ background: '#f97316' }} />
              </label>

              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={showPotential} onChange={(e) => setShowPotential(e.target.checked)} />
                <span className="text-sm">Potansiyel Yoğunluğu</span>
                <span className="ml-auto inline-block w-4 h-2 rounded" style={{ background: '#3b82f6' }} />
              </label>

              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={showConversion} onChange={(e) => setShowConversion(e.target.checked)} />
                <span className="text-sm">Dönüşüm Oranı</span>
                <span className="ml-auto inline-block w-4 h-2 rounded" style={{ background: '#10b981' }} />
              </label>

              {/* Radius */}
              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">Yarıçap: {radius}px</div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Blur */}
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Blur: {blur}px</div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Lejand */}
              <div className="mt-3">
                <div className="text-xs text-gray-600">Lejand</div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="text-[11px] text-gray-700">
                    <div className="h-2 rounded" style={{ background: 'linear-gradient(to right,#fff7ed,#ea580c)' }} />
                    <div className="mt-1">Ziyaret</div>
                  </div>
                  <div className="text-[11px] text-gray-700">
                    <div className="h-2 rounded" style={{ background: 'linear-gradient(to right,#eff6ff,#1d4ed8)' }} />
                    <div className="mt-1">Potansiyel</div>
                  </div>
                  <div className="text-[11px] text-gray-700">
                    <div className="h-2 rounded" style={{ background: 'linear-gradient(to right,#ecfdf5,#059669)' }} />
                    <div className="mt-1">Dönüşüm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rep listesi */}
            <div className="max-h-full overflow-auto pr-1">
              {filtered.map((r) => {
                const selected = selectedId === r.id;
                const color = ratioColor(r.completedToday, r.totalToday);
                const pct = r.totalToday ? Math.round((r.completedToday / r.totalToday) * 100) : 0;
                return (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg border transition ${selected ? 'border-[#0099CB] bg-[#0099CB]/5' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedId(r.id);
                      if (mapRef.current) {
                        mapRef.current.setView([r.lat, r.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
                      }
                      const m = markerRefs.current[r.id];
                      if (m) m.openPopup();
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{r.name}</div>
                        <div className="flex items-center gap-2.5 mt-1">
                          <a className="text-xs text-[#0099CB] underline" href={toTelHref(r.phone)} onClick={(e)=>e.stopPropagation()}>{r.phone}</a>
                          <a href={toWaHref(r.phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700" title="WhatsApp ile mesaj gönder" onClick={(e)=>e.stopPropagation()}>
                            <WhatsAppIcon />
                          </a>
                          <button onClick={(e)=>{ e.stopPropagation(); handleOpenMessagePanel(r); }} className="text-gray-600 hover:text-gray-800" title="Uygulama içi mesaj gönder">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 shrink-0">
                        {r.completedToday}/{r.totalToday}
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                      <div className="h-2 rounded" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="mt-1.5 text-[11px] text-gray-600">Günlük ilerleme: %{pct}</div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-sm text-gray-500 py-8 text-center">Eşleşen sonuç bulunamadı.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {messagingPanel.isOpen && (
        <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-800"> Mesaj: {messagingPanel.rep?.name} </h3>
              <button onClick={handleCloseMessagePanel} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-600"/></button>
            </div>
            <div className="p-6">
              <textarea placeholder={`${messagingPanel.rep?.name} kişisine bir mesaj yazın...`} className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-[#0099CB] focus:border-transparent" />
            </div>
            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end">
              <button onClick={handleCloseMessagePanel} className="px-5 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90">Gönder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMapScreen;
