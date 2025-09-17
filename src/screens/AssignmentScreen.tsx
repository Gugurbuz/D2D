// src/screens/AssignmentScreen.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  Search,
  Route as RouteIcon,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { Customer } from '../RouteMap';
import { Rep, Screen } from '../types';
import { getStatusColor } from '../utils/ui';
import toast, { Toaster } from 'react-hot-toast';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
  setCurrentScreen: (s: Screen) => void;
};

type TabKey = 'all' | 'unassigned' | 'byRep';

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
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [repFilter, setRepFilter] = useState<string>('');
  const [selectMenuOpen, setSelectMenuOpen] = useState(false);

  const selectedIds = useMemo(
    () => Object.entries(localSelected).filter(([, v]) => v).map(([k]) => k),
    [localSelected]
  );

  const repName = useCallback((rid?: string) => allReps.find(r => r.id === rid)?.name || '—', [allReps]);
  const repObj  = useCallback((rid?: string) => allReps.find(r => r.id === rid), [allReps]);

  // --- Row click selection helpers ---
  const isInteractive = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase();
    return (
      tag === 'input' || tag === 'button' || tag === 'a' ||
      tag === 'select' || tag === 'textarea' || tag === 'label'
    );
  };

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    if (isInteractive(e.target as HTMLElement)) return;
    setLocalSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };
  // -----------------------------------

  // Filter chain
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let base = customers;
    if (q) {
      base = base.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q)
      );
    }

    if (activeTab === 'unassigned') {
      base = base.filter(c => !assignments[c.id]);
    } else if (activeTab === 'byRep' && repFilter) {
      base = base.filter(c => assignments[c.id] === repFilter);
    }
    return base;
  }, [customers, assignments, searchQuery, activeTab, repFilter]);

  const toggleAll = (v: boolean, onlyUnassigned = false) => {
    const next: Record<string, boolean> = { ...localSelected };
    filtered.forEach((c) => {
      if (onlyUnassigned && assignments[c.id]) return;
      next[c.id] = v;
    });
    setLocalSelected(next);
  };

  const clearSelection = () => setLocalSelected({});

  const assignIdsToRep = (ids: string[], repId: string) => {
    if (!repId || ids.length === 0) return;
    setAssignments(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = repId; });
      return next;
    });
  };

  const handleAssign = () => {
    if (!selectedRep) { toast.error('Lütfen bir satış uzmanı seçiniz.'); return; }
    if (selectedIds.length === 0) { toast('Seçili müşteri yok.', { icon: 'ℹ️' }); return; }
    assignIdsToRep(selectedIds, selectedRep);
    toast.success(`${selectedIds.length} müşteri ${repName(selectedRep)} adına atandı.`);
    clearSelection();
  };

  // Drag & Drop: selected rows -> rep card
  const onRowDragStart = (e: React.DragEvent<HTMLTableRowElement>, startId: string) => {
    const ids = selectedIds.length > 0 ? selectedIds : [startId];
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onRepDrop = (e: React.DragEvent<HTMLDivElement>, repId: string) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('text/plain');
      const ids: string[] = JSON.parse(data);
      assignIdsToRep(ids, repId);
      toast.success(`${ids.length} müşteri ${repName(repId)} adına atandı.`);
      clearSelection();
    } catch {
      /* no-op */
    }
  };

  const onRepDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const dynamicAssignLabel = useMemo(() => {
    const count = selectedIds.length;
    if (count === 0) return 'Seçilileri Ata';
    if (count === 1) return '1 Müşteriyi Ata';
    return `${count} Müşteriyi Ata`;
  }, [selectedIds.length]);

  const HeaderSelectMenu = () => (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        <button
          type="button"
          onClick={() => setSelectMenuOpen((s) => !s)}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          aria-haspopup="menu"
          aria-expanded={selectMenuOpen}
        >
          Seçim <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {selectMenuOpen && (
        <div
          role="menu"
          className="absolute z-20 mt-1 w-44 rounded-lg border bg-white shadow-sm p-1"
          onMouseLeave={() => setSelectMenuOpen(false)}
        >
          <button
            className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-gray-50"
            onClick={() => { toggleAll(true); setSelectMenuOpen(false); }}
          >
            Bu Görünümdekinin Tümünü Seç
          </button>
          <button
            className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-gray-50"
            onClick={() => { toggleAll(true, true); setSelectMenuOpen(false); }}
          >
            Tüm Atanmamışları Seç
          </button>
          <button
            className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-gray-50"
            onClick={() => { clearSelection(); setSelectMenuOpen(false); }}
          >
            Seçimi Temizle
          </button>
        </div>
      )}
    </div>
  );

  const RepPill: React.FC<{ rep: Rep; small?: boolean }> = ({ rep, small }) => {
    const initials = rep.name?.split(' ').map(s => s[0]).slice(0, 2).join('') || '?';
    const size = small ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
    return (
      <div className="flex items-center gap-2">
        {rep.avatarUrl ? (
          <img
            src={rep.avatarUrl}
            alt={rep.name}
            className={`rounded-full object-cover ${small ? 'w-6 h-6' : 'w-8 h-8'}`}
          />
        ) : (
          <div className={`rounded-full bg-gray-200 flex items-center justify-center ${size} font-semibold text-gray-700`}>
            {initials}
          </div>
        )}
        {!small && <span className="text-sm text-gray-800">{rep.name}</span>}
      </div>
    );
  };

  return (
    <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 py-4">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Görev Atama</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentScreen('assignmentMap')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
            title="Haritadan Ata"
          >
            <RouteIcon className="w-4 h-4" />
            Haritadan Ata
          </button>
        </div>
      </div>

      {/* Kontrol Kartı */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        {/* Sekmeler */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full text-sm border ${activeTab === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-3 py-1.5 rounded-full text-sm border ${activeTab === 'unassigned' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}
          >
            Atanmamış
          </button>

          {/* Temsilciye göre görünüm */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('byRep')}
              className={`px-3 py-1.5 rounded-full text-sm border ${activeTab === 'byRep' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}
            >
              Temsilciye Göre
            </button>
            <select
              value={repFilter}
              onChange={(e) => { setRepFilter(e.target.value); setActiveTab('byRep'); }}
              className="border rounded-lg px-3 py-1.5 text-sm"
              title="Bu görünüme yalnızca seçilen temsilciye atanmış müşteriler gelir"
            >
              <option value="">Temsilci seç</option>
              {allReps.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Arama + Atama kontrolü */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
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
            <span className="text-sm text-gray-600">Ata:</span>
            <select
              value={selectedRep}
              onChange={e => setSelectedRep(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              {allReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <button
              onClick={() => toggleAll(true)}
              className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              Tümünü Seç
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              Temizle
            </button>

            <button
              onClick={handleAssign}
              disabled={selectedIds.length === 0 || !selectedRep}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedIds.length === 0 || !selectedRep ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#0099CB] text-white hover:opacity-95'}`}
            >
              {dynamicAssignLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sol: Tablo */}
        <div className="col-span-12 xl:col-span-9 bg-white border border-gray-200 rounded-2xl">
          <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
            <div className="max-h-[70vh] overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
              <table className="w-full min-w-[1000px] xl:min-w-full table-auto">
                <colgroup>
                  <col className="w-16" />
                  <col className="w-[16%] md:w-[18%] xl:w-[18%]" />
                  <col className="w-[44%] md:w-[42%] xl:w-[50%]" />
                  <col className="w-[10%] md:w-[12%]" />
                  <col className="w-[10%] md:w-[12%]" />
                  <col className="w-[14%] md:w-[16%]" />
                </colgroup>

                <thead className="text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left sticky top-0 z-10 bg-gray-50">
                      <HeaderSelectMenu />
                    </th>
                    {['Müşteri','Adres','İlçe','Durum','Atanan'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left sticky top-0 z-10 bg-gray-50"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filtered.map((c, idx) => {
                    const checked = !!localSelected[c.id];
                    const assignedTo = assignments[c.id];
                    const rowBase = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                    const rowSelected = checked ? 'bg-blue-50' : rowBase;

                    return (
                      <tr
                        key={c.id}
                        className={`${rowSelected} hover:bg-gray-50 transition-colors cursor-pointer`}
                        draggable
                        onDragStart={(e) => onRowDragStart(e, c.id)}
                        onClick={(e) => handleRowClick(e, c.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setLocalSelected(prev => ({ ...prev, [c.id]: e.target.checked }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap truncate">{c.name}</td>
                        <td className="px-4 py-3 whitespace-normal break-words">{c.address}</td>
                        <td className="px-4 py-3 whitespace-nowrap truncate">{c.district}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {assignedTo ? (
                            <div className="flex items-center gap-2">
                              {repObj(assignedTo)?.avatarUrl ? (
                                <img
                                  src={repObj(assignedTo)!.avatarUrl as string}
                                  alt={repName(assignedTo)}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                  {repName(assignedTo).split(' ').map(s => s[0]).slice(0,2).join('')}
                                </div>
                              )}
                              <span>{repName(assignedTo)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <UserIcon className="w-4 h-4" />
                              <span>—</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-500">
                        Kriterlere uygun müşteri bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sağ: Drag & Drop Atama Paneli */}
        <div className="col-span-12 xl:col-span-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-800">Sürükle-Bırak ile Ata</h2>
              <span className="text-xs text-gray-500">{selectedIds.length} seçili</span>
            </div>

            <div className="space-y-2">
              {allReps.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 cursor-move transition"
                  onDrop={(e) => onRepDrop(e, rep.id)}
                  onDragOver={onRepDragOver}
                  title="Seçili müşteri(leri) bu temsilciye bırak"
                >
                  <RepPill rep={rep} />
                  <button
                    className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
                    onClick={() => {
                      if (selectedIds.length === 0) {
                        toast('Seçili müşteri yok.', { icon: 'ℹ️' });
                        return;
                      }
                      assignIdsToRep(selectedIds, rep.id);
                      toast.success(`${selectedIds.length} müşteri ${rep.name} adına atandı.`);
                      clearSelection();
                    }}
                  >
                    Ata
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-gray-500">
              İpucu: Tablodan satırları sürükleyip buradaki temsilcilerin üzerine bırakabilirsiniz.
              Hiç seçim yapmazsanız, sürüklediğiniz tek satır atanır.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentScreen;
