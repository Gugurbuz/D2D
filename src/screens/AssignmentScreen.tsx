import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Rep } from '../types';
import { getStatusColor } from '../utils/ui';
import { Customer } from '../RouteMap';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
};

const AssignmentScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps }) => {
  // EKRANA ÖZEL STATE’LER BU BİLEŞENİN ÜST SEVİYESİNDE
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<Record<string, boolean>>({});
  const [selectedRep, setSelectedRep] = useState<string>(allReps[0]?.id || '');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return q
      ? customers.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q))
      : customers;
  }, [customers, searchQuery]);

  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    filtered.forEach(c => { next[c.id] = v; });
    setLocalSelected(next);
  };

  const selectedIds = Object.entries(localSelected).filter(([, v]) => v).map(([k]) => k);

  const handleAssign = () => {
    if (!selectedRep) { alert('Lütfen bir satış uzmanı seçiniz.'); return; }
    if (selectedIds.length === 0) { alert('Lütfen en az bir müşteri seçiniz.'); return; }
    setAssignments(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => { next[id] = selectedRep; });
      return next;
    });
    alert(`${selectedIds.length} müşteri atandı.`);
  };

  const repName = (rid?: string) => allReps.find(r => r.id === rid)?.name || '—';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Görev Atama</h1>
        <div className="text-sm text-gray-600">Toplam müşteri: <b>{customers.length}</b></div>
      </div>

      {/* Arama & Rep seçimi */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Müşteri, adres, ilçe ara…"
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Satış Uzmanı:</span>
          <select value={selectedRep} onChange={e => setSelectedRep(e.target.value)} className="border rounded-lg px-3 py-2">
            {allReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button onClick={() => toggleAll(true)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Tümünü Seç</button>
          <button onClick={() => toggleAll(false)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Temizle</button>
          <button onClick={handleAssign} className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold">Seçilileri Ata</button>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-gray-200 p-0 overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs font-semibold text-gray-600 border-b">
          <div>Seç</div><div>Müşteri</div><div>Adres</div><div>İlçe</div><div>Durum</div><div>Atanan</div>
        </div>

        {filtered.map(c => {
          const checked = !!localSelected[c.id];
          const assignedTo = assignments[c.id];
          return (
            <div key={c.id} className="grid grid-cols-6 gap-2 px-4 py-3 items-center border-b last:border-b-0 hover:bg-gray-50">
              <div><input type="checkbox" checked={checked} onChange={(e) => setLocalSelected(prev => ({ ...prev, [c.id]: e.target.checked }))} /></div>
              <div className="truncate">{c.name}</div>
              <div className="truncate">{c.address}</div>
              <div className="truncate">{c.district}</div>
              <div><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span></div>
              <div className="text-sm">{repName(assignedTo)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentScreen;
