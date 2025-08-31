import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { Customer, Screen } from '../types';
import { Search, Clock, MapPin } from 'lucide-react';

type Props = {
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
  setCurrentScreen: (s: Screen) => void;
  agentName: string;
  currentScreen: Screen;
  setSelectedCustomer: (c: Customer | null) => void;
};

const VisitList: React.FC<Props> = ({
  customers,
  setCustomers,
  setCurrentScreen,
  agentName,
  currentScreen,
  setSelectedCustomer,
}) => {
  const [filter, setFilter] = useState<'Bugün' | 'Bu Hafta' | 'Tamamlandı'>('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSpeechToText = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
    }
  };

  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitDetail');
  };

  const getStatusColor = (status: string) =>
    status === 'Tamamlandı' ? 'bg-green-100 text-green-800' :
    status === 'Yolda' ? 'bg-blue-100 text-blue-800' :
    'bg-yellow-100 text-yellow-800';

  const getPriorityColor = (priority: string) =>
    priority === 'Yüksek' ? 'bg-red-100 text-red-800' :
    priority === 'Orta' ? 'bg-orange-100 text-orange-800' :
    'bg-green-100 text-green-800';

  let filtered = customers.filter(c => filter === 'Tamamlandı' ? c.status === 'Tamamlandı' : true);
  if (searchQuery.trim()) {
    const s = searchQuery.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.address.toLowerCase().includes(s) ||
      c.district.toLowerCase().includes(s)
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation agentName={agentName} currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ziyaret Listesi</h1>
          <div className="flex space-x-2">
            {(['Bugün', 'Bu Hafta', 'Tamamlandı'] as const).map(option => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === option ? 'bg-[#0099CB] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent text-lg"
              placeholder="Müşteri adı, adres veya ilçe ile ara..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={handleSpeechToText}
                disabled={isListening}
                className={`p-2 rounded-lg transition-colors ${
                  isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#F9C800] bg-opacity-20 text-[#0099CB] hover:bg-[#F9C800] hover:bg-opacity-30'
                }`}
                title="Sesli arama"
              >
                🎤
              </button>
            </div>
          </div>
          {isListening && <p className="text-sm text-[#0099CB] mt-2">Dinleniyor... Lütfen konuşun</p>}
          {searchQuery && <p className="text-sm text-gray-600 mt-2">"{searchQuery}" için {filtered.length} sonuç bulundu</p>}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Sonuç bulunamadı</div>
          ) : (
            filtered.map((customer) => (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(customer.status)}`}>{customer.status}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(customer.priority)}`}>{customer.priority}</span>
                    </div>
                    <p className="text-gray-600 mb-1">{customer.address}, {customer.district}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{customer.estimatedDuration}</span></span>
                      <span className="flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>{customer.distance}</span></span>
                      <span>Saat: {customer.plannedTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => { setSelectedCustomer(customer); setCurrentScreen('visitDetail'); }}
                      className="bg-[#0099CB] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0088B8] transition-colors"
                    >
                      Detay
                    </button>
                    {customer.status === 'Bekliyor' && (
                      <button
                        onClick={() => handleStartVisit(customer)}
                        className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-[#E6B500] transition-colors"
                      >
                        Başlat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitList;
