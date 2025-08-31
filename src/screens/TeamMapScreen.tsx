import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, Users, Maximize2, Minimize2, Search, MessageSquare, X } from 'lucide-react';
import type { TeamRep } from '../data/team';
import { teamReps as defaultTeam } from '../data/team';

type Props = {
  reps?: TeamRep[];
  center?: [number, number];
};

// ... (WhatsAppIcon, toWaHref, toTelHref fonksiyonları aynı)

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);
const toWaHref = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.substring(1);
  }
  return `https://wa.me/${cleaned}`;
};
const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;

function ratioColor(completed: number, total: number) {
  if (!total) return '#9CA3AF'; // gri
  const r = completed / total;
  if (r >= 0.8) return '#16A34A'; // yeşil
  if (r >= 0.5) return '#F59E0B'; // amber
  return '#EF4444';             // kırmızı
}

// DÜZELTME: `initials` fonksiyonu artık eksik 'name' verisine karşı güvenli.
function initials(fullName?: string | null) {
  if (!fullName) return '?'; // Eğer isim yoksa, '?' döndürerek çökmeyi engelle.
  
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
      <div style="
        display:flex;flex-direction:column;align-items:center;gap:6px;
      ">
        <div style="
          width:34px;height:34px;border-radius:50%;
          background:${color};color:#fff;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid #fff;
        ">
          ${nameInit}
        </div>
        <div style="
          width:38px;height:6px;border-radius:4px;background:#E5E7EB;overflow:hidden;border:1px solid #fff;
          box-shadow:0 1px 3px rgba(0,0,0,.15);
        ">
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

const TeamMapScreen: React.FC<Props> = ({ reps, center }) => {
  const team = reps && reps.length ? reps : defaultTeam;
  const avgCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (team.length === 0) return [41.0082, 28.9784]; // Fallback to a default center
    const la = team.reduce((a, r) => a + r.lat, 0) / team.length;
    const ln = team.reduce((a, r) => a + r.lng, 0) / team.length;
    return [la, ln];
  }, [team, center]);

  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const [messagingPanel, setMessagingPanel] = useState<{ isOpen: boolean; rep: TeamRep | null }>({ isOpen: false, rep: null });

  const handleOpenMessagePanel = (rep: TeamRep) => {
    setMessagingPanel({ isOpen: true, rep: rep });
  };
  const handleCloseMessagePanel = () => {
    setMessagingPanel({ isOpen: false, rep: null });
  };

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
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

          {filtered.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={repDivIcon(r)}
              ref={(ref: any) => { if (ref) markerRefs.current[r.id] = ref; }}
              eventHandlers={{ click: () => { setSelectedId(r.id); const m = markerRefs.current[r.id]; if (m) m.openPopup(); }, }}
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
                    <a href={toWaHref(r.phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700" title="WhatsApp ile mesaj gönder">
                        <WhatsAppIcon />
                    </a>
                    <button onClick={() => handleOpenMessagePanel(r)} className="text-gray-600 hover:text-gray-800" title="Uygulama içi mesaj gönder">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-1.5rem)]'} flex`}>
          <button onClick={() => setPanelOpen((o) => !o)} className="w-6 bg-[#0099CB] hover:bg-[#007DA1] transition-colors flex flex-col items-center justify-center text-white" title={panelOpen ? 'Paneli kapat' : 'Paneli aç'}>
            {panelOpen ? ( <Minimize2 className="w-4 h-4 -rotate-90" /> ) : ( <div className="flex flex-col items-center"> <span className="rotate-90 text-[10px] font-bold tracking-wider">EKİP</span> <Minimize2 className="w-4 h-4 rotate-90" /> </div> )}
          </button>
          <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[320px] max-w-sm h-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="İsim veya telefon ile ara…" className="block w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-[#0099CB] focus:border-transparent text-sm" />
            </div>
            <div className="max-h-full overflow-auto pr-1">
              {filtered.map((r) => {
                const selected = selectedId === r.id;
                const color = ratioColor(r.completedToday, r.totalToday);
                const pct = r.totalToday ? Math.round((r.completedToday / r.totalToday) * 100) : 0;
                return (
                  <div key={r.id} className={`p-3 rounded-lg border transition ${selected ? 'border-[#0099CB] bg-[#0099CB]/5' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => { setSelectedId(r.id); if (mapRef.current) { mapRef.current.setView([r.lat, r.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true }); } const m = markerRefs.current[r.id]; if (m) m.openPopup(); }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{r.name}</div>
                        <div className="flex items-center gap-2.5 mt-1">
                          <a className="text-xs text-[#0099CB] underline" href={toTelHref(r.phone)} onClick={(e)=>e.stopPropagation()}> {r.phone} </a>
                          <a href={toWaHref(r.phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700" title="WhatsApp ile mesaj gönder" onClick={(e)=>e.stopPropagation()}> <WhatsAppIcon /> </a>
                          <button onClick={(e)=>{ e.stopPropagation(); handleOpenMessagePanel(r); }} className="text-gray-600 hover:text-gray-800" title="Uygulama içi mesaj gönder"> <MessageSquare className="w-4 h-4" /> </button>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 shrink-0">
                        {r.completedToday}/{r.totalToday}
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                      <div className="h-2 rounded" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="mt-1.5 text-[11px] text-gray-600">
                      Günlük ilerleme: %{pct}
                    </div>
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
              <button onClick={handleCloseMessagePanel} className="p-1 rounded-full hover:bg-gray-100"> <X className="w-5 h-5 text-gray-600"/> </button>
            </div>
            <div className="p-6"> <textarea placeholder={`${messagingPanel.rep?.name} kişisine bir mesaj yazın...`} className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-[#0099CB] focus:border-transparent" /> </div>
            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end"> <button onClick={handleCloseMessagePanel} className="px-5 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90"> Gönder </button> </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMapScreen;