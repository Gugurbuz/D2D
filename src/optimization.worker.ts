// YENİ: Modern ve uyumlu kütüphaneleri içe aktarıyoruz
import KDBush from 'kdbush';
import { around } from 'geokdbush';

// =================================================================================
// Tipler & Arayüzler
// =================================================================================
type LatLng = [number, number];
interface Customer { id: string; lat: number; lng: number; }
interface Rep { id: string; lat: number; lng: number; name: string; }

const OPTIMIZATION_ITERATIONS = 8;

// =================================================================================
// Yardımcı Fonksiyonlar (Artık Haversine'e ihtiyacımız yok, geokdbush hallediyor)
// =================================================================================
const convexHull = (points: LatLng[]): LatLng[] => {
    if (points.length < 3) return points.slice();
    const pts = points.slice().sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]));
    const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
    const lower: LatLng[] = [];
    for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
    }
    const upper: LatLng[] = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
        upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
};

// =================================================================================
// Worker'ın ana dinleyicisi
// =================================================================================
self.onmessage = (event: MessageEvent<{ customers: Customer[]; reps: Rep[] }>) => {
    const { customers, reps } = event.data;

    try {
        const K = reps.length;
        if (customers.length === 0 || K === 0) {
            self.postMessage({ type: 'error', error: "Müşteri veya Temsilci bulunamadı." });
            return;
        }

        const targetCapacity = Math.ceil(customers.length / K);
        let centroids: LatLng[] = reps.map(r => [r.lat, r.lng]);
        let assignments: number[] = new Array(customers.length).fill(-1);

        // KDBush, temsilcilerin (reps) index'ini tutmamızı gerektiriyor
        const repPoints = reps.map((rep, index) => ({ ...rep, index }));

        for (let i = 0; i < OPTIMIZATION_ITERATIONS; i++) {
            self.postMessage({ type: 'progress', progress: (i / OPTIMIZATION_ITERATIONS) * 100, message: `İterasyon ${i + 1}/${OPTIMIZATION_ITERATIONS}` });

            const buckets: number[][] = Array.from({ length: K }, () => []);

            // 1. Her iterasyonda centroid'lerin coğrafi index'ini oluşturuyoruz
            const centroidIndex = new KDBush(
                repPoints,
                (p) => centroids[p.index][1], // lng
                (p) => centroids[p.index][0]  // lat
            );
            
            const customerOrder = [...customers.keys()].sort(() => Math.random() - 0.5);

            customerOrder.forEach(custIdx => {
                const customer = customers[custIdx];

                // 2. GeoKDBush ile en yakın K adet temsilciyi buluyoruz. Bu çok hızlı!
                const nearestRepIndices = around(centroidIndex, customer.lng, customer.lat, K);

                let chosenRep = -1;
                for (const repIndex of nearestRepIndices) {
                    if (buckets[repIndex].length < targetCapacity) {
                        chosenRep = repIndex;
                        break;
                    }
                }
                if (chosenRep === -1) {
                    chosenRep = nearestRepIndices[0];
                }
                
                buckets[chosenRep].push(custIdx);
                assignments[custIdx] = chosenRep;
            });

            centroids = buckets.map((bucket, k) => {
                if (bucket.length === 0) return reps[k] ? [reps[k].lat, reps[k].lng] : centroids[k];
                const sumLat = bucket.reduce((acc, ptIdx) => acc + customers[ptIdx].lat, 0);
                const sumLng = bucket.reduce((acc, ptIdx) => acc + customers[ptIdx].lng, 0);
                return [sumLat / bucket.length, sumLng / bucket.length];
            });
        }

        const nextAssignments: Record<string, string> = {};
        const customersPerRep: Record<string, Customer[]> = Object.fromEntries(reps.map(r => [r.id, []]));
        customers.forEach((c, i) => {
            const repId = reps[assignments[i]]?.id || reps[0].id;
            nextAssignments[c.id] = repId;
            if (customersPerRep[repId]) customersPerRep[repId].push(c);
        });

        const hulls: Record<string, LatLng[]> = {};
        reps.forEach(r => {
            hulls[r.id] = customersPerRep[r.id].length > 2
                ? convexHull(customersPerRep[r.id].map(c => [c.lat, c.lng]))
                : (customersPerRep[r.id] || []).map(c => [c.lat, c.lng]);
        });
        
        self.postMessage({
            type: 'complete',
            assignments: nextAssignments,
            hulls: hulls,
            customersPerRep: customersPerRep,
        });

    } catch (error) {
        self.postMessage({ type: 'error', error: (error as Error).message });
    }
};

export { };