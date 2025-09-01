import * as kdTree from 'kd-tree-javascript';

// =================================================================================
// Tipler & Arayüzler
// =================================================================================
type LatLng = [number, number];
interface Customer { id: string; lat: number; lng: number; }
interface Rep { id: string; lat: number; lng: number; name: string; }

const OPTIMIZATION_ITERATIONS = 8;

// =================================================================================
// Yardımcı Fonksiyonlar
// =================================================================================
const haversineKm = (a: LatLng, b: LatLng): number => {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const lat1 = (a[0] * Math.PI) / 180;
    const lat2 = (b[0] * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

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
    // Gelecekteki sorunları ayıklamak için:
    // console.log("kdTree modülü:", kdTree); 
    
    const { customers, reps } = event.data;

    try {
        const K = reps.length;
        const pts: LatLng[] = customers.map(c => [c.lat, c.lng]);
        if (customers.length === 0 || K === 0) {
            self.postMessage({ type: 'error', error: "Müşteri veya Temsilci bulunamadı." });
            return;
        }

        const targetCapacity = Math.ceil(customers.length / K);
        let centroids: LatLng[] = reps.map(r => [r.lat, r.lng]);
        let assignments: number[] = new Array(customers.length).fill(-1);

        for (let i = 0; i < OPTIMIZATION_ITERATIONS; i++) {
            self.postMessage({ type: 'progress', progress: (i / OPTIMIZATION_ITERATIONS) * 100, message: `İterasyon ${i + 1}/${OPTIMIZATION_ITERATIONS}` });

            const buckets: number[][] = Array.from({ length: K }, () => []);

            const centroidPoints = centroids.map((point, index) => ({
                x: point[0], y: point[1], repIndex: index
            }));
            
            const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => haversineKm([a.x, a.y], [b.x, b.y]);
            
            // SON DÜZELTME: Constructor'a .default üzerinden erişim
            const tree = new (kdTree as any).default(centroidPoints, distance, ["x", "y"]);

            const customerOrder = [...customers.keys()].sort(() => Math.random() - 0.5);

            customerOrder.forEach(custIdx => {
                const point = pts[custIdx];
                const customerPoint = { x: point[0], y: point[1] };
                const nearestReps = tree.nearest(customerPoint, K);

                let chosenRep = -1;
                for (const [nearest, dist] of nearestReps) {
                    const repIdx = (nearest as any).repIndex;
                    if (buckets[repIdx].length < targetCapacity) {
                        chosenRep = repIdx;
                        break;
                    }
                }
                if (chosenRep === -1) {
                    chosenRep = (nearestReps[0][0] as any).repIndex;
                }
                
                buckets[chosenRep].push(custIdx);
                assignments[custIdx] = chosenRep;
            });

            centroids = buckets.map((bucket, k) => {
                if (bucket.length === 0) return reps[k] ? [reps[k].lat, reps[k].lng] : centroids[k];
                const sum = bucket.reduce((acc, ptIdx) => [acc[0] + pts[ptIdx][0], acc[1] + pts[ptIdx][1]], [0, 0] as LatLng);
                return [sum[0] / bucket.length, sum[1] / bucket.length];
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