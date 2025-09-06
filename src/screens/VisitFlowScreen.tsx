import React, { useMemo, useState } from 'react';
import { Search, Map, ChevronRight, Home, Building, Factory } from 'lucide-react';

// Önceki dosyalardan gelen tipleri ve bileşenleri buraya dahil ediyoruz
// Gerçek bir projede bunlar ayrı dosyalardan import edilirdi.
// --- START: Diğer dosyalardan gelen kodlar ---

export interface Customer {
  id: number;
  name: string;
  address: string;
  district: string;
  phone: string;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Postponed' | 'Unreachable' | 'Evaluating';
  notes?: string;
  subscriberType: 'Mesken' | 'Ticarethane' | 'Sanayi';
  isEligible: boolean;
  currentProvider: string;
  currentKwhPrice: number;
  avgMonthlyConsumptionKwh: number;
  lat: number;
  lon: number;
}

// VisitFlowScreen ve diğer tüm alt bileşenler buraya gelecek...
// Bu kod çok uzun olduğu için, sadece ana mantığı etkilemeyen bir yer tutucu ekliyorum.
const VisitFlowScreenPlaceholder: React.FC<{ customer: Customer; onCancel: () => void }> = ({ customer, onCancel }) => (
    <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold">Ziyaret Akışı: {customer.name}</h1>
        <p className="mt-2 text-gray-600">Bu, {customer.name} için başlatılan ziyaret akışının simülasyonudur.</p>
        <button onClick={onCancel} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Listeye Geri Dön
        </button>
    </div>
);


const subscriberTypeInfo = {
    'Mesken': { icon: <Home className="w-4 h-4"/>, color: "text-cyan-600 bg-cyan-100" },
    'Ticarethane': { icon: <Building className="w-4 h-4"/>, color: "text-orange-600 bg-orange-100" },
    'Sanayi': { icon: <Factory className="w-4 h-4"/>, color: "text-slate-600 bg-slate-100" },
};

const statusInfo: Record<Customer['status'], { label: string; color: string; }> = {
    Pending: { label: 'Bekliyor', color: 'bg-gray-200 text-gray-800' },
    Completed: { label: 'Tamamlandı', color: 'bg-green-200 text-green-800' },
    Rejected: { label: 'Reddedildi', color: 'bg-red-200 text-red-800' },
    Postponed: { label: 'Ertelendi', color: 'bg-blue-200 text-blue-800' },
    Unreachable: { label: 'Ulaşılamadı', color: 'bg-yellow-200 text-yellow-800' },
    Evaluating: { label: 'Değerlendiriliyor', color: 'bg-purple-200 text-purple-800' },
};


// --- END: Diğer dosyalardan gelen kodlar ---


// ==================================================================
// ==================== ZİYARET LİSTESİ EKRANI ======================
// ==================================================================

type VisitListScreenProps = {
  customers: Customer[];
  onStartVisit: (customer: Customer) => void; // Hatanın çözümü: Prop'u burada tanımlıyoruz
};

const VisitListScreen: React.FC<VisitListScreenProps> = ({ customers, onStartVisit }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Günlük Ziyaret Listesi</h1>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 text-sm font-medium">
                <Map className="w-4 h-4" /> Harita Görünümü
            </button>
        </div>

        {/* Arama Kutusu */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Müşteri, adres veya ilçe ara..." 
            className="block w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
          />
        </div>

        {/* Müşteri Kartları */}
        <div className="space-y-3">
            {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                    <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo[customer.status].color}`}>
                                    {statusInfo[customer.status].label}
                                </span>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${subscriberTypeInfo[customer.subscriberType].color} rounded-full text-xs font-medium`}>
                                    {subscriberTypeInfo[customer.subscriberType].icon}
                                    {customer.subscriberType}
                                </div>
                            </div>
                            <p className="font-semibold text-lg text-gray-800 mt-2">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.address}, {customer.district}</p>
                        </div>
                        <button 
                            onClick={() => onStartVisit(customer)} // Hatanın çözümü: Prop'u burada kullanıyoruz
                            className="w-full sm:w-auto bg-[#0099CB] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#007ca8] transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Ziyareti Başlat</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Search className="w-10 h-10"/>
                        <span className="font-semibold">Sonuç Bulunamadı</span>
                        <span className="text-sm">Aradığınız kriterlere uygun müşteri bulunamadı.</span>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};


// ==================================================================
// ==================== ANA UYGULAMA (ÖNİZLEME İÇİN) ===============
// ==================================================================

const mockCustomers: Customer[] = [
    { id: 1, name: 'Ahmet Yılmaz', address: 'Gül Mahallesi, No: 12/3', district: 'Çankaya/Ankara', phone: '555 123 4567', status: 'Pending', subscriberType: 'Mesken', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.35, avgMonthlyConsumptionKwh: 150, lat: 39.9085, lon: 32.7533 },
    { id: 2, name: 'Ayşe Kaya (ABC Market)', address: 'Menekşe Cd, No: 5', district: 'Kadıköy/İstanbul', phone: '555 987 6543', status: 'Completed', subscriberType: 'Ticarethane', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.41, avgMonthlyConsumptionKwh: 450, lat: 40.9904, lon: 29.0271 },
    { id: 3, name: 'Mehmet Öztürk (Demir Çelik)', address: 'Sanayi Sitesi No: 1', district: 'Bornova/İzmir', phone: '555 111 2233', status: 'Pending', subscriberType: 'Sanayi', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.29, avgMonthlyConsumptionKwh: 2500, lat: 38.4682, lon: 27.2211 },
];

const App = () => {
    // Hatanın çözümü: Üst bileşen state'i burada tutuyor.
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    if (selectedCustomer) {
        // Bir müşteri seçildiğinde, ziyaret akışını o müşteri için başlat.
        // Gerçek uygulamada burada VisitFlowScreen olurdu.
        return <VisitFlowScreenPlaceholder 
                    customer={selectedCustomer} 
                    onCancel={() => setSelectedCustomer(null)} 
                />;
    }

    // Seçili müşteri yoksa, ziyaret listesini göster.
    return <VisitListScreen 
                customers={mockCustomers} 
                onStartVisit={setSelectedCustomer} // Hatanın çözümü: Fonksiyonu prop olarak iletiyoruz
            />;
}

export default App;
