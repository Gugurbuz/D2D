import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// ... (diğer importlar aynı kalacak)

// =================================================================================
// Yeni Yardımcı Fonksiyon: İstekleri Gruplama (Batching)
// =================================================================================
const processInBatches = async <T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 5
): Promise<R[]> => {
    let results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(processor);
        const batchResults = await Promise.all(batchPromises);
        results = results.concat(batchResults);
    }
    return results;
};


// =================================================================================
// Ana Bileşen (Değişiklikler ile)
// =================================================================================
const AssignmentMapScreen: React.FC<Props> = ({ customers, assignments, setAssignments, allReps: reps, onBack }) => {

    // --- State Management ---
    // ... (mevcut state'leriniz aynı kalacak)
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Hesaplanıyor..."); // Yükleme mesajını dinamik hale getirdik
    
    // ...

    // Worker için bir referans oluşturuyoruz
    const workerRef = useRef<Worker | null>(null);

    // Component kaldırıldığında worker'ı sonlandırmak için useEffect
    useEffect(() => {
        // Component yüklendiğinde worker'ı oluştur
        // Not: Vite veya Create React App gibi modern araçlar bu `new URL` syntax'ını destekler.
        workerRef.current = new Worker(new URL('./optimization.worker.ts', import.meta.url), { type: 'module' });

        return () => {
            // Component DOM'dan kaldırıldığında worker'ı temizle
            workerRef.current?.terminate();
        };
    }, []);

    // ... (diğer useMemo ve useCallback'leriniz aynı kalacak)

    const handleOptimize = useCallback(async () => {
        if (!workerRef.current) return;
    
        setLoading(true);
        setLoadingMessage("Müşteriler kümeleniyor...");
        setRegions({});
        setOptimizedRoutes({});
        setPendingOptimization(null); // Eski önizlemeyi temizle
    
        // Worker'a mesajı gönder
        workerRef.current.postMessage({ customers, reps });
    
        // Worker'dan gelecek cevabı dinle
        workerRef.current.onmessage = async (event) => {
            const { assignments: nextAssignments, hulls, customersPerRep, error } = event.data;
    
            if (error) {
                console.error("Worker hatası:", error);
                showToast("Optimizasyon başarısız oldu: " + error, 'error');
                setLoading(false);
                return;
            }
    
            setLoadingMessage("Rotalar hesaplanıyor...");
    
            // Rota hesaplamaları için OSRM'e GRUPLAR halinde istekler
            const routeProcessor = async (rep: Rep) => {
                const repCustomers = customersPerRep[rep.id] || [];
                if (repCustomers.length === 0) {
                    return { repId: rep.id, repName: rep.name, customerCount: 0, totalKm: null, coords: [] };
                }
                try {
                    const coords = [[rep.lat, rep.lng], ...repCustomers.map(c => [c.lat, c.lng] as LatLng)].map(p => `${p[1]},${p[0]}`).join(';');
                    const tripData = await osrmTrip(coords);
                    return {
                        repId: rep.id,
                        repName: rep.name,
                        customerCount: repCustomers.length,
                        totalKm: tripData.trips[0].distance / 1000,
                        coords: tripData.trips[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as LatLng)
                    };
                } catch (err) {
                    console.warn(`Rota hesaplanamadı: ${rep.name}`, err);
                    return { repId: rep.id, repName: rep.name, customerCount: repCustomers.length, totalKm: null, coords: [] };
                }
            };
    
            try {
                // İstekleri 5'erli gruplar halinde gönderiyoruz
                const results = await processInBatches(reps, routeProcessor, 5);
                const newOptimizedRoutes: Record<string, { coords: LatLng[], distance: number }> = {};
                results.forEach(res => {
                    if (res.coords.length > 0) {
                        newOptimizedRoutes[res.repId] = { coords: res.coords, distance: res.totalKm ?? 0 };
                    }
                });
    
                setPendingOptimization({
                    assignments: nextAssignments,
                    regions: hulls,
                    routes: newOptimizedRoutes,
                    summary: results.sort((a,b) => a.repName.localeCompare(b.repName)), // Özet tablosunu alfabetik sırala
                });
    
            } catch (err) {
                console.error("Rota hesaplama sırasında hata:", err);
                showToast("Rota hesaplama başarısız oldu.", 'error');
            } finally {
                setLoading(false);
            }
        };

        workerRef.current.onerror = (e) => {
            console.error("Worker'da bir hata oluştu:", e);
            showToast("Optimizasyon sırasında kritik bir hata oluştu.", 'error');
            setLoading(false);
        };
    
    }, [customers, reps, showToast]);

    const handleConfirmOptimization = useCallback(() => {
        // ... (bu fonksiyon aynı kalacak)
    }, [pendingOptimization, setAssignments, showToast]);

    const handleCancelOptimization = useCallback(() => setPendingOptimization(null), []);

    // --- Render ---
    return (
        <div className="p-4">
            {/* ... (render kodunuzun üst kısmı aynı kalacak) ... */}

            <div className="relative h-[620px] w-full rounded-2xl overflow-hidden shadow">
                {/* ... (MapContainer ve diğer componentler aynı) ... */}
                
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1200]">
                        <div className="rounded-lg bg-white shadow-lg px-6 py-4 text-base font-semibold text-gray-700 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            {/* Dinamik yükleme mesajı */}
                            {loadingMessage}
                        </div>
                    </div>
                )}

                {/* ... (Toast ve diğer render kodları aynı kalacak) ... */}
            </div>
        </div>
    );
};

export default AssignmentMapScreen;