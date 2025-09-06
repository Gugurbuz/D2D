// --- YENİ BİLEŞEN: Teklif ve Müzakere Ekranı (HATALARI DÜZELTİLMİŞ HALİ) ---
const ProposalScreen: React.FC<{ customer: Customer; onContinue: () => void; }> = ({ customer, onContinue }) => {
    // State'ler
    const [currentUnitPrice, setCurrentUnitPrice] = useState(2.20); 
    const [currentConsumption, setCurrentConsumption] = useState(150);
    const availableTariffs = useMemo(() => ALL_TARIFFS.filter(t => t.type.includes(customer.customerType)), [customer.customerType]);
    
    // --- DÜZELTME 1: GÜVENLİ STATE BAŞLANGICI ---
    // Eğer availableTariffs boş ise, başlangıç değeri null olacak.
    // Bu sayede `availableTariffs[0]` undefined olduğunda uygulama çökmez.
    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(availableTariffs[0] || null);

    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    // --- DÜZELTME 2: HESAPLAMALARIN GÜVENLİ HALE GETİRİLMESİ ---
    // selectedTariff null olabileceğinden, hesaplamadan önce varlığını kontrol ediyoruz.
    const currentMonthlyBill = currentUnitPrice * currentConsumption;
    const enerjisaMonthlyBill = selectedTariff ? selectedTariff.unitPrice * currentConsumption : 0;
    const annualSavings = selectedTariff ? (currentMonthlyBill - enerjisaMonthlyBill) * 12 : 0;


    const CustomerTypeIcon = {
        Mesken: <Home className="w-6 h-6 text-gray-700" />,
        Ticarethane: <Building className="w-6 h-6 text-gray-700" />,
        Sanayi: <Factory className="w-6 h-6 text-gray-700" />,
    };

    // --- DÜZELTME 3: UYGUN TARİFE YOKSA UYARI GÖSTER ---
    // Eğer en başta uygun tarife bulunamadıysa, hesaplama ekranını hiç gösterme.
    if (!selectedTariff) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Uygun Tarife Bulunamadı</h3>
                <p className="text-gray-600 mt-2">
                    Bu müşteri tipi ({customer.customerType}) için sistemde kayıtlı uygun bir tarife bulunamadı.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
                {/* Başlık ve Müşteri Tipi */}
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h3 className="text-xl font-semibold">Teklif ve Tasarruf Simülasyonu</h3>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                        {CustomerTypeIcon[customer.customerType]}
                        <span className="font-medium">{customer.customerType}</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Mevcut Durum Alanı (İnteraktif) */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-semibold text-lg mb-3">Mevcut Durum</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Birim Fiyat (TL/kWh)</label>
                                <input
                                    type="number"
                                    value={currentUnitPrice}
                                    onChange={e => setCurrentUnitPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Aylık Tüketim (kWh)</label>
                                <input
                                    type="number"
                                    value={currentConsumption}
                                    onChange={e => setCurrentConsumption(parseInt(e.target.value) || 0)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                />
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-gray-600">Tahmini Aylık Fatura</p>
                                <p className="text-2xl font-bold text-gray-800">{currentMonthlyBill.toFixed(2)} TL</p>
                            </div>
                        </div>
                    </div>

                    {/* Enerjisa Teklifi Alanı (Dinamik) */}
                    <div className="p-4 border-2 border-[#0099CB] rounded-lg bg-white">
                        <h4 className="font-semibold text-lg mb-3 text-[#007ca8]">Enerjisa Teklifi</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Tarife Seçimi</label>
                                <select
                                    value={selectedTariff.id}
                                    onChange={e => setSelectedTariff(ALL_TARIFFS.find(t => t.id === e.target.value)!)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                >
                                    {availableTariffs.map(tariff => (
                                        <option key={tariff.id} value={tariff.id}>{tariff.name}</option>
                                    ))}
                                </select>
                                {selectedTariff.id === 'yesil_evim' && (
                                     <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3"/> Solar çözümlerde %10 indirim sağlar.
                                     </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Birim Fiyat (TL/kWh)</p>
                                <p className="text-xl font-semibold">{selectedTariff.unitPrice.toFixed(2)} TL</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-gray-600">Enerjisa ile Tahmini Aylık Fatura</p>
                                <p className="text-2xl font-bold text-[#007ca8]">{enerjisaMonthlyBill.toFixed(2)} TL</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Tasarruf ve Sonraki Adım */}
                <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                    <p className="text-lg font-medium text-green-800">Yıllık Tahmini Tasarruf</p>
                    <p className="text-4xl font-bold text-green-700 my-2">{annualSavings > 0 ? `${annualSavings.toFixed(2)} TL` : "Daha Avantajlı"}</p>
                </div>
                
                {/* Yeşil Evim Lead Oluşturma */}
                {selectedTariff.id === 'yesil_evim' && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center animate-fade-in">
                        <p className="font-medium text-yellow-800 mb-2">Güneş enerjisi çözümleriyle ilgileniyor musunuz?</p>
                        <button 
                            onClick={() => setIsLeadModalOpen(true)}
                            className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
                        >
                            Evet, Teklif İçin Talep Oluştur
                        </button>
                    </div>
                )}


                <div className="mt-8 text-right">
                    <button onClick={onContinue} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                        Müzakere Sonucuna Git <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {isLeadModalOpen && (
                <LeadGenerationModal 
                    customer={customer}
                    onClose={() => setIsLeadModalOpen(false)}
                />
            )}
        </>
    );
};