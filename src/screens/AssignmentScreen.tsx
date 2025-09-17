import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Route as RouteIcon, Users, UserPlus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Toast bildirimleri için
import { Customer } from '../RouteMap';
import { Rep, Screen } from '../types';
import { getStatusColor } from '../utils/ui';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
  setCurrentScreen: (s: Screen) => void;
};

// YENİ: Temsilci Avatarı Bileşeni
const Avatar: React.FC<{ rep?: Rep }> = ({ rep }) => {
    if (!rep) {
        return (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center" title="Atanmamış">
                <UserPlus className="w-4 h-4 text-gray-500" />
            </div>
        );
    }
    const initials = rep.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    // Basit bir hash fonksiyonu ile isme göre renk üretelim
    const colorIndex = rep.name.charCodeAt(0) % 5;
    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700',
        'bg-yellow-100 text-yellow-700',
        'bg-red-100 text-red-700',
        'bg-indigo-100 text-indigo-700',
    ];

    return (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${colors[colorIndex]}`} title={rep.name}>
            {initials}
        </div>
    );
};


const AssignmentScreen: React.FC<Props> = ({
  customers,
  assignments,
  setAssignments,
  allReps,
  setCurrentScreen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<Record<string, boolean>>({});
  const [selectedRep, setSelectedRep] = useState<string>(allReps[0]?.id || '');
  const [filter, setFilter] = useState<'all' | 'unassigned'>('all');
  const mainCheckboxRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    // 1. Sekmeye göre filtrele (Tümü / Atanmamış)
    let initialFilter = customers;
    if (filter === 'unassigned') {
        initialFilter = customers.filter(c => !assignments[c.id]);
    }
    
    // 2. Arama sorgusuna göre filtrele
    const q = searchQuery.toLowerCase().trim();
    if (!q) return initialFilter;
    return initialFilter.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
    );
  }, [customers, searchQuery, filter, assignments]);

  const selectedIds = Object.keys(localSelected).filter(id => localSelected[id]);

  useEffect(() => {
    // Ana checkbox'ın durumunu güncelle (indeterminate)
    const numSelected = selectedIds.length;
    const numVisible = filtered.length;
    if (mainCheckboxRef.current) {
        mainCheckboxRef.current.checked = numSelected === numVisible && numVisible > 0;
        mainCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numVisible;
    }
  }, [selectedIds, filtered]);


  const handleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      filtered.forEach((c) => { next[c.id] = true; });
    }
    setLocalSelected(next);
  };

  const handleAssign = () => {
    if (!selectedRep) {
        toast.error('Lütfen bir satış uzmanı seçin.');
        return;
    }
    if (selectedIds.length === 0) {
        toast.error('Lütfen en az bir müşteri seçin.');
        return;
    }

    setAssignments(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => { next[id] = selectedRep; });
      return next;
    });

    const repName = allReps.find(r => r.id === selectedRep)?.name || '';
    toast.success(`${selectedIds.length} müşteri başarıyla ${repName} adlı uzmana atandı.`);
    setLocalSelected({}); // Seçimi sıfırla
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <Toaster position="top-center" />
      <header className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Görev Atama</h1>
            <p className="text-sm text-slate-500 mt-1">Müşterileri satış temsilcilerine atayın veya harita üzerinden planlayın.</p>
        </div>
        <button
          onClick={() => setCurrentScreen('assignmentMap')}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-slate-50 font-semibold text-slate-700 shadow-sm"
          title="Haritadan Ata"
        >
          <RouteIcon className="w-5 h-5 text-blue-600" />
          Haritadan Atama Yap
        </button>
      </header>

      {/* Kontrol Paneli */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        {/* Filtreleme ve Arama */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0">
                <div className="inline-flex rounded-lg shadow-sm">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'} rounded-l-lg border border-slate-300`}>Tümü ({customers.length})</button>
                    <button onClick={() => setFilter('unassigned')} className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'} rounded-r-lg border-t border-b border-r border-slate-300`}>Atanmamış ({customers.filter(c => !assignments[c.id]).length})</button>
                </div>
            </div>
            <div className="relative flex-grow">
              <Search className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Müşteri, adres, ilçe ara…"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
        </div>

        {/* Atama Aksiyonları */}
        <div className="bg-slate-50 p-3 rounded-lg flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-600" />
                <select value={selectedRep} onChange={e => setSelectedRep(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm font-medium">
                    {allReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <span className="text-sm text-slate-500">adlı uzmana ata:</span>
            </div>
            <button onClick={handleAssign} disabled={selectedIds.length === 0}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed w-full md:w-auto">
                {selectedIds.length > 0 ? `${selectedIds.length} Müşteriyi Ata` : 'Müşteri Seçin'}
            </button>
        </div>
      </div>

      {/* Müşteri Tablosu */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs font-semibold text-gray-600 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                    <input type="checkbox" ref={mainCheckboxRef} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded" />
                </th>
                {['Müşteri','Adres','İlçe','Durum','Atanan'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const checked = !!localSelected[c.id];
                  const assignedTo = assignments[c.id];
                  return (
                    <tr key={c.id} className={`transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={checked} onChange={(e) => setLocalSelected(prev => ({ ...prev, [c.id]: e.target.checked }))} className="rounded" />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.address}</td>
                      <td className="px-4 py-3 text-slate-600">{c.district}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(c.status)}`}>{c.status || "Durum Yok"}</span>
                      </td>
                      <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Avatar rep={allReps.find(r => r.id === assignedTo)} />
                                <span className="text-sm font-medium text-slate-700">{allReps.find(r => r.id === assignedTo)?.name || '-'}</span>
                            </div>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold">Filtrelerle eşleşen müşteri bulunamadı.</p>
                        <p className="text-sm">Arama terimini değiştirmeyi veya farklı bir filtre seçmeyi deneyin.</p>
                    </div>
                )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentScreen;
