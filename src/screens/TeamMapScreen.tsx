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

// YENİLİK: WhatsApp ikonu için SVG bileşeni
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

// YENİLİK: WhatsApp linki oluşturan yardımcı fonksiyon
const toWaHref = (phone: string) => {
  let cleaned = phone.replace(/\D/g, ''); // Numarayı temizle (sadece rakamlar kalsın)
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.substring(1); // Başındaki 0'ı kaldırıp 90 ekle
  }
  return `https://wa.me/${cleaned}`;
};

const toTelHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;
function ratioColor(completed: number, total: number) { /* ... Değişiklik yok ... */ }
function initials(fullName: string) { /* ... Değişiklik yok ... */ }
function repDivIcon(rep: TeamRep) { /* ... Değişiklik yok ... */ }
const FullscreenBtn: React.FC = () => { /* ... Değişiklik yok ... */ };

const TeamMapScreen: React.FC<Props> = ({ reps, center }) => {
  const team = reps && reps.length ? reps : defaultTeam;
  const avgCenter = useMemo<[number, number]>(() => { /* ... Değişiklik yok ... */ });

  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // YENİLİK: Uygulama içi mesajlaşma paneli için state ve handler'lar
  const [messagingPanel, setMessagingPanel] = useState<{ isOpen: boolean; rep: TeamRep | null }>({ isOpen: false, rep: null });

  const handleOpenMessagePanel = (rep: TeamRep) => {
    setMessagingPanel({ isOpen: true, rep: rep });
  };
  const handleCloseMessagePanel = () => {
    setMessagingPanel({ isOpen: false, rep: null });
  };

  const filtered = useMemo(() => { /* ... Değişiklik yok ... */ });
  const totals = useMemo(() => { /* ... Değişiklik yok ... */ });

  return (
    <div className="relative w-full">
      {/* Üst başlık + özet (Değişiklik yok) */}
      <div className="mb-3 flex items-center justify-between">
        {/* ... */}
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
                  <div className="text-sm">Tamamlanan / Toplam: <b>{r.completedToday}/{r.totalToday}</b></div>
                  
                  {/* YENİLİK: Popup içindeki telefon bölümü güncellendi */}
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

        {/* SAĞ PANEL */}
        <div className={`absolute top-4 right-0 bottom-4 z-10 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-1.5rem)]'} flex`}>
          {/* ... Toggle Bar (değişiklik yok) ... */}

          {/* Panel İçerik */}
          <div className="bg-white/90 rounded-l-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[320px] max-w-sm h-full">
            {/* ... Arama (değişiklik yok) ... */}
            
            {/* Liste */}
            <div className="max-h-full overflow-auto pr-1">
              {filtered.map((r) => {
                const selected = selectedId === r.id;
                const color = ratioColor(r.completedToday, r.totalToday);
                const pct = r.totalToday ? Math.round((r.completedToday / r.totalToday) * 100) : 0;
                return (
                  <div key={r.id} className={`p-3 rounded-lg border transition ${selected ? 'border-[#0099CB] bg-[#0099CB]/5' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => { /* ... Değişiklik yok ... */ }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{r.name}</div>
                        
                        {/* YENİLİK: Paneldeki telefon bölümü güncellendi */}
                        <div className="flex items-center gap-2.5 mt-1">
                          <a className="text-xs text-[#0099CB] underline" href={toTelHref(r.phone)} onClick={(e)=>e.stopPropagation()}>
                            {r.phone}
                          </a>
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

                    {/* ... Progress Bar ve yazı (değişiklik yok) ... */}
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

      {/* YENİLİK: Uygulama İçi Mesajlaşma Paneli (Placeholder) */}
      {messagingPanel.isOpen && (
        <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-800">
                Mesaj: {messagingPanel.rep?.name}
              </h3>
              <button onClick={handleCloseMessagePanel} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600"/>
              </button>
            </div>
            <div className="p-6">
                <textarea 
                    placeholder={`${messagingPanel.rep?.name} kişisine bir mesaj yazın...`}
                    className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                />
            </div>
            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end">
                <button 
                    onClick={handleCloseMessagePanel}
                    className="px-5 py-2 rounded-lg bg-[#0099CB] text-white font-semibold hover:opacity-90"
                >
                    Gönder
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamMapScreen;