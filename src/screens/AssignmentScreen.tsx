import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Route as RouteIcon, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { Customer } from '../types'; // Bu tiplerin projenizde olduğunu varsayıyoruz
import { Rep, Screen } from '../types';
import { getStatusColor } from '../utils/ui';

// ==================================================================
// ==================== YARDIMCI BİLEŞENLER =========================
// ==================================================================

// --- Toast Bildirim Bileşeni ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void; }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';

    return (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-fade-in-up ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {isSuccess ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
        </div>
    );
};

// --- Özel Dropdown Bileşeni ---
const CustomSelect: React.FC<{ options: { value: string; label: string }[]; value: string; onChange: (value: string) => void; placeholder?: string; }> = ({ options, value, onChange, placeholder = "Seçim yapın..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div ref={ref} className="relative w-full md:w-56">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099CB]">
                <span className="text-sm text-gray-800">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <ul className="py-1 max-h-60 overflow-auto">
                        {options.map(option => (
                            <li key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// ==================================================================
// ==================== ANA EKRAN BİLEŞENİ ==========================
// ==================================================================

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  allReps: Rep[];
  setCurrentScreen: (s: Screen) => void;
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);
  
  const selectedIds = useMemo(() => Object.entries(localSelected).filter(([, v]) => v).map(([k]) => k), [localSelected]);
  const selectedCount = selectedIds.length;
  
  const isAllVisibleSelected = useMemo(() => {
      if (filtered.length === 0) return false;
      return filtered.every(c => localSelected[c.id]);
  }, [filtered, localSelected]);

  const toggleAllVisible = () => {
    const nextValue = !isAllVisibleSelected;
    const newSelected = { ...localSelected };
    filtered.forEach((c) => { newSelected[c.id] = nextValue; });
    setLocalSelected(newSelected);
  };
  
  const clearSelection = () => setLocalSelected({});

  const handleAssign = () => {
    if (!selectedRep) { setToast({ message: 'Lütfen bir satış uzmanı seçin.', type: 'error' }); return; }
    if (selectedCount === 0) { setToast({ message: 'Lütfen en az bir müşteri seçin.', type: 'error' }); return; }

    setAssignments(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => { next[id] = selectedRep; });
      return next;
    });
    setToast({ message: `${selectedCount} müşteri başarıyla atandı.`, type: 'success' });
    clearSelection();
  };

  const repName = (rid?: string) => allReps.find(r => r.id === rid)?.name || 'Atanmamış';
  const repOptions = allReps.map(r => ({ value: r.id, label: r.name }));

  return (
    <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 py-4 bg-gray-50 min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Görev Atama</h1>
        <button onClick={() => setCurrentScreen('assignmentMap')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 text-sm font-medium">
          <RouteIcon className="w-4 h-4" /> Haritadan Ata
        </button>
      </div>
      
      {/* Üst Kontrol Paneli */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Müşteri, adres, ilçe ara…" className="block w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"/>
        </div>
        <CustomSelect options={repOptions} value={selectedRep} onChange={setSelectedRep} />
      </div>

      {/* Bağlamsal Aksiyon Çubuğu */}
      {selectedCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between animate-fade-in">
              <span className="text-sm font-semibold text-blue-800">{selectedCount} müşteri seçildi</span>
              <div className="flex items-center gap-3">
                  <button onClick={clearSelection} className="text-sm font-medium text-gray-600 hover:text-gray-900">Seçimi Temizle</button>
                  <button onClick={handleAssign} className="px-4 py-2 rounded-lg bg-[#0099CB] text-white font-semibold text-sm">Seçilileri Ata</button>
              </div>
          </div>
      )}

      {/* Müşteri Tablosu */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            <table className="w-full min-w-[1000px] xl:min-w-full table-auto">
              <thead className="text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-5 py-3 sticky top-0 z-10 bg-gray-50 w-12"><input type="checkbox" checked={isAllVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 rounded text-[#0099CB] focus:ring-[#0099CB]"/></th>
                  <th className="px-5 py-3 text-left sticky top-0 z-10 bg-gray-50 w-1/5">Müşteri</th>
                  <th className="px-5 py-3 text-left sticky top-0 z-10 bg-gray-50">Adres</th>
                  <th className="px-5 py-3 text-left sticky top-0 z-10 bg-gray-50 w-1/6">Atanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="text-center py-16">
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Search className="w-10 h-10"/>
                                <span className="font-semibold">Sonuç Bulunamadı</span>
                                <span className="text-sm">Aradığınız kriterlere uygun müşteri bulunamadı.</span>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filtered.map(c => {
                      const assignedTo = assignments[c.id];
                      return (
                        <tr key={c.id} className={`hover:bg-gray-50 ${localSelected[c.id] ? 'bg-blue-50' : ''}`}>
                          <td className="px-5 py-4"><input type="checkbox" checked={!!localSelected[c.id]} onChange={e => setLocalSelected(prev => ({ ...prev, [c.id]: e.target.checked }))} className="h-4 w-4 rounded text-[#0099CB] focus:ring-[#0099CB]"/></td>
                          <td className="px-5 py-4 whitespace-nowrap"><div className="font-semibold text-gray-800">{c.name}</div><div className="text-sm text-gray-500">{c.district}</div></td>
                          <td className="px-5 py-4 text-sm text-gray-600 whitespace-normal break-words">{c.address}</td>
                          <td className="px-5 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${assignedTo ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>{repName(assignedTo)}</span></td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================================================================
// ==================== ANA UYGULAMA (ÖNİZLEME İÇİN) ===============
// ==================================================================
// Bu kısım, bileşenin çalışır bir önizlemesini sağlamak için eklenmiştir.
// Gerekli tipler ve yardımcı fonksiyonlar burada tanımlanmıştır.

const mockCustomers: Customer[] = [
    { id: 1, name: 'Ahmet Yılmaz', address: 'Gül Mahallesi, Lale Sokak No: 12/3', district: 'Çankaya/Ankara', phone: '555 123 4567', status: 'Pending', subscriberType: 'Mesken', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.35, avgMonthlyConsumptionKwh: 150, lat: 39.9085, lon: 32.7533 },
    { id: 2, name: 'Ayşe Kaya (ABC Market)', address: 'Menekşe Caddesi, Zambak Apartmanı No: 5, Daire: 8', district: 'Kadıköy/İstanbul', phone: '555 987 6543', status: 'Completed', subscriberType: 'Ticarethane', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.41, avgMonthlyConsumptionKwh: 450, lat: 40.9904, lon: 29.0271 },
    { id: 3, name: 'Mehmet Öztürk (Demir Çelik)', address: 'Anadolu Sanayi Sitesi, 1234. Sokak No: 1, Organize Sanayi Bölgesi', district: 'Bornova/İzmir', phone: '555 111 2233', status: 'Pending', subscriberType: 'Sanayi', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.29, avgMonthlyConsumptionKwh: 2500, lat: 38.4682, lon: 27.2211 },
    { id: 4, name: 'Fatma Şahin', address: 'İnönü Bulvarı, Atatürk Apartmanı, No: 55', district: 'Nilüfer/Bursa', phone: '555 444 5566', status: 'Rejected', subscriberType: 'Mesken', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.38, avgMonthlyConsumptionKwh: 180, lat: 40.2091, lon: 28.9953 },
];

const mockReps: Rep[] = [
    { id: 'rep1', name: 'Ali Veli' },
    { id: 'rep2', name: 'Zeynep Güneş' },
    { id: 'rep3', name: 'Hasan Dağ' },
];

// Bu yardımcı fonksiyonlar normalde utils/ui.ts gibi bir dosyada olurdu.
namespace AppUtils {
    export const getStatusColor = (status: Customer['status']) => {
      switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Postponed': return 'bg-blue-100 text-blue-800';
        case 'Unreachable': return 'bg-yellow-100 text-yellow-800';
        case 'Evaluating': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
}


const App = () => {
    const [assignments, setAssignments] = useState<Record<string, string | undefined>>({ '2': 'rep1' });
    const [screen, setScreen] = useState<Screen>('assignmentList');

    if (screen === 'assignmentList') {
        return <AssignmentScreen customers={mockCustomers} assignments={assignments} setAssignments={setAssignments} allReps={mockReps} setCurrentScreen={setScreen} />
    }
    
    // Harita ekranı için basit bir yer tutucu
    if(screen === 'assignmentMap') {
        return <div className="p-8">
            <h1 className="text-2xl font-bold">Harita Görünümü (Yer Tutucu)</h1>
            <button onClick={() => setScreen('assignmentList')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Listeye Dön</button>
        </div>
    }

    return <div>Ekran Yüklenemedi</div>
}

// Global scope'a yardımcı fonksiyonları ekliyoruz ki ana bileşen içinden erişilebilsin.
// Bu, normal bir projede yapılmaz, sadece bu tek dosyalık önizleme için bir çözümdür.
(window as any).getStatusColor = AppUtils.getStatusColor;

export default App;
