// YENİ: K-d tree kütüphanesini içe aktar
import * as kdTree from 'kd-tree-javascript';

// =================================================================================
// Tipler & Arayüzler (Aynı kalıyor)
// =================================================================================
type LatLng = [number, number];
interface Customer { id: string; lat: number; lng: number; }
interface Rep { id: string; lat: number; lng: number; name: string; } // 'name' eklendi

// YENİ: İterasyon sayısını düşürerek hızlı bir deneme yapabilirsiniz
const OPTIMIZATION_ITERATIONS = 8; // 10'dan 8'e düşürmek bile fark yaratabilir

// =================================================================================
// Yardımcı Fonksiyonlar (Aynı kalıyor)
// =================================================================================
const haversineKm = (a: LatLng, b: LatLng): number => { /* ... aynı kod ... */ };
const convexHull = (points: LatLng[]): LatLng[] => { /* ... aynı kod ... */ };

// =================================================================================
// Worker'ın ana dinleyicisi (GÜNCELLENDİ)
// =================================================================================
self.onmessage = (event: MessageEvent<{ customers: Customer[]; reps: Rep[] }>) => {
    const { customers, reps } = event.data;

    try {
        const K = reps.length;
        const pts: LatLng[] = customers.map(c => [c.lat, c.lng]);
        if (customers.length === 0 || K === 0) {
            self.postMessage({ error: "Müşteri veya Temsilci bulunamadı." });
            return;
        }

        const targetCapacity = Math.ceil(customers.length / K);
        let centroids: LatLng[] = reps.map(r => [r.lat, r.lng]);
        let assignments: number[] = new Array(customers.length).fill(-1);

        for (let i = 0; i < OPTIMIZATION_ITERATIONS; i++) {
            // İlerleme durumu göndermek için
            self.postMessage({ type: 'progress', progress: (i / OPTIMIZATION_ITERATIONS) * 100, message: `İterasyon ${i + 1}/${OPTIMIZATION_ITERATIONS}` });

            const buckets: number[][] = Array.from({ length: K }, () => []);

            // 1. K-d Tree'yi her iterasyonun başında centroid'ler ile oluştur
            // Centroid'lere rep'in index'ini de ekliyoruz ki kim olduğunu bilelim
            const centroidPoints = centroids.map((point, index) => ({
                x: point[0], // latitude
                y: point[1], // longitude
                repIndex: index // Temsilcinin orijinal index'i
            }));
            
            // Boyutlar (dimensions) ve uzaklık fonksiyonu
            const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => haversineKm([a.x, a.y], [b.x, b.y]);
         const tree = new kdTree.KdTree(centroidPoints, distance, ["x", "y"]);

            const customerOrder = [...customers.keys()].sort(() => Math.random() - 0.5);

            customerOrder.forEach(custIdx => {
                const point = pts[custIdx];
                const customerPoint = { x: point[0], y: point[1] };

                // 2. En yakın temsilcileri K-d Tree ile bul (K adet)
                // Bu, eski sıralama yönteminden ÇOK DAHA HIZLI
                const nearestReps = tree.nearest(customerPoint, K);

                // 3. Kapasite kontrolü yaparak en uygun temsilciyi ata
                let chosenRep = -1;
                for (const [nearest, dist] of nearestReps) {
                    const repIdx = (nearest as any).repIndex;
                    if (buckets[repIdx].length < targetCapacity) {
                        chosenRep = repIdx;
                        break;
                    }
                }
                // Eğer hepsi doluysa (dengesiz dağılım), en yakındakini ata
                if (chosenRep === -1) {
                    chosenRep = (nearestReps[0][0] as any).repIndex;
                }
                
                buckets[chosenRep].push(custIdx);
                assignments[custIdx] = chosenRep;
            });

            // Centroid'leri güncelle (bu kısım aynı)
            centroids = buckets.map((bucket, k) => {
                if (bucket.length === 0) return reps[k] ? [reps[k].lat, reps[k].lng] : centroids[k];
                const sum = bucket.reduce((acc, ptIdx) => [acc[0] + pts[ptIdx][0], acc[1] + pts[ptIdx][1]], [0, 0] as LatLng);
                return [sum[0] / bucket.length, sum[1] / bucket.length];
            });
        }

        // Sonuçları ana componente göndermek için (bu kısım aynı)
        // ... (önceki cevaptaki `nextAssignments`, `customersPerRep`, `hulls` hesaplamaları)
        
        self.postMessage({
            type: 'complete', // YENİ: Sonucun tipini belirtiyoruz
            assignments: nextAssignments,
            hulls: hulls,
            customersPerRep: customersPerRep,
        });

    } catch (error) {
        self.postMessage({ type: 'error', error: (error as Error).message });
    }
};

export { };