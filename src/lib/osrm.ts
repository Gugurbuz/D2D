// src/lib/osrm.ts
// OSRM istemcisi + fallback algoritmaları (greedy + segment route)
// Amaç: rep (başlangıç) ve duraklar verildiğinde, sıralı durak listesi,
// polyline (LatLng[]), ve toplam mesafeyi (km) üretmek.

// =======================
// Tipler
// =======================
export type LatLng = [number, number];

export interface RepPoint {
  lat: number;
  lng: number;
}

export interface StopPoint {
  id?: string | number;
  lat: number;
  lng: number;
  // İsteğe bağlı ek alanlar (#name, #address, vs.) korunur:
  [k: string]: any;
}

export interface OsrmOptimizeResult<TStop extends StopPoint = StopPoint> {
  orderedStops: TStop[];
  polyline: LatLng[];
  distanceKm: number;
}

// =======================
// OSRM base URL (override edilebilir)
// =======================
let OSRM_BASE = "https://router.project-osrm.org";

export function setOsrmBase(url: string) {
  OSRM_BASE = url.replace(/\/+$/, ""); // sondaki / temizle
}

const toCoordStr = (lat: number, lng: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
const makeRadiusesParam = (n: number, r = 1000) => new Array(n).fill(String(r)).join(";");

// =======================
// Yardımcılar
// =======================
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** En yakın komşu (greedy) – sadece sıralama bulur */
function greedyOrder(points: LatLng[], startIndex = 0): number[] {
  const n = points.length;
  const used = new Array(n).fill(false);
  const order = [startIndex];
  used[startIndex] = true;
  for (let k = 1; k < n; k++) {
    const last = points[order[order.length - 1]];
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      const d = haversineKm(last, points[i]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    used[best] = true;
    order.push(best);
  }
  return order;
}

// =======================
// OSRM çağrıları (safe)
// =======================
async function osrmTripSafe(points: { lat: number; lng: number }[]) {
  // Trip için en az 2 nokta gerekir
  if (!points || points.length < 2) return null;
  try {
    const coords = points.map((p) => toCoordStr(p.lat, p.lng)).join(";");
    const radiuses = makeRadiusesParam(points.length, 1000);
    const url = encodeURI(
      `${OSRM_BASE}/trip/v1/driving/${coords}` +
        `?source=first&destination=last&roundtrip=false&overview=full&geometries=geojson&radiuses=${radiuses}`
    );
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) return null;
    const data = JSON.parse(text);
    if (data.code !== "Ok" || !data.trips?.[0]) return null;
    return data;
  } catch {
    return null;
  }
}

async function osrmRouteSafe(from: LatLng, to: LatLng) {
  try {
    const coords = `${toCoordStr(from[0], from[1])};${toCoordStr(to[0], to[1])}`;
    const url = encodeURI(
      `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&annotations=false&steps=false`
    );
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) return null;
    const data = JSON.parse(text);
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    return data.routes[0] as { distance: number; geometry: { coordinates: [number, number][] } };
  } catch {
    return null;
  }
}

// =======================
// Geometri kurucu (segment bazlı)
// =======================
async function buildGeometryFromOrder(orderedLatLngs: LatLng[]) {
  const coords: LatLng[] = [];
  let totalKm = 0;

  if (orderedLatLngs.length === 0) return { coords, km: 0 };
  coords.push(orderedLatLngs[0]);

  for (let i = 1; i < orderedLatLngs.length; i++) {
    const a = orderedLatLngs[i - 1];
    const b = orderedLatLngs[i];

    const route = await osrmRouteSafe(a, b);
    if (route) {
      const seg = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
      coords.push(...seg.slice(1)); // ilk nokta zaten eklendi
      totalKm += route.distance / 1000;
    } else {
      // OSRM yoksa düz bağla
      coords.push(b);
      totalKm += haversineKm(a, b);
    }
  }

  return { coords, km: totalKm };
}

// =======================
// Yüksek seviye optimize
// =======================
export async function optimizeRoute<TStop extends StopPoint = StopPoint>(params: {
  rep: RepPoint;
  stops: TStop[];
  starredId?: string | number | null;
}): Promise<OsrmOptimizeResult<TStop>> {
  const { rep } = params;

  // 0) rep valid mi?
  if (!rep || !Number.isFinite(rep.lat) || !Number.isFinite(rep.lng)) {
    return { orderedStops: [] as TStop[], polyline: [] as LatLng[], distanceKm: 0 };
  }

  // 1) stops'ı temizle + kopyala (referansları koruyoruz)
  const inputStops = (params.stops || []).filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)
  ) as TStop[];

  const starredId =
    params.starredId === undefined || params.starredId === null || params.starredId === ""
      ? null
      : params.starredId;

  // 2) Özel durumlar
  if (inputStops.length === 0) {
    return { orderedStops: [] as TStop[], polyline: [[rep.lat, rep.lng]] as LatLng[], distanceKm: 0 };
  }
  if (!starredId && inputStops.length === 1) {
    // Sadece 1 durak: route ile çiz
    const only = inputStops[0];
    const route = await osrmRouteSafe([rep.lat, rep.lng], [only.lat, only.lng]);
    if (route) {
      const polyline = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
      return { orderedStops: [only], polyline, distanceKm: route.distance / 1000 };
    } else {
      return {
        orderedStops: [only],
        polyline: [
          [rep.lat, rep.lng],
          [only.lat, only.lng],
        ],
        distanceKm: haversineKm([rep.lat, rep.lng], [only.lat, only.lng]),
      };
    }
  }

  // 3) YILDIZ YOK → TRIP dene → fallback greedy
  if (!starredId) {
    const points = [{ lat: rep.lat, lng: rep.lng }, ...inputStops.map((s) => ({ lat: s.lat, lng: s.lng }))];
    const trip = await osrmTripSafe(points);
    if (trip) {
      // waypoint_index'e göre sırala
      const ordered = trip.waypoints
        .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
        .sort((a: any, b: any) => a.order - b.order)
        .map((x: any) => points[x.inputIdx]);

      // rep'i atla → durakları orijinal referansla eşle
      const orderedStops = ordered.slice(1).map((p: any) => {
        return inputStops.find((s) => s.lat === p.lat && s.lng === p.lng)!;
      });

      const polyline: LatLng[] = trip.trips[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      const distanceKm = (trip.trips[0].distance as number) / 1000;

      return { orderedStops, polyline, distanceKm };
    }

    // Trip yoksa → greedy + segment route
    const latlngs: LatLng[] = [[rep.lat, rep.lng], ...inputStops.map((s) => [s.lat, s.lng])];
    const orderIdx = greedyOrder(latlngs, 0); // 0 = rep
    const orderedLatLngs = orderIdx.map((i) => latlngs[i]);
    const orderedStops = orderIdx.slice(1).map((i) => inputStops[i - 1]); // rep'i at
    const geom = await buildGeometryFromOrder(orderedLatLngs);
    return { orderedStops, polyline: geom.coords, distanceKm: geom.km };
  }

  // 4) YILDIZ VAR → rep->star ROUTE + star'dan TRIP → fallback greedy
  const star = inputStops.find((s) => String(s.id) === String(starredId));
  // Yıldız id'si bulunamazsa yıldız yok gibi devam et
  if (!star) {
    return optimizeRoute<TStop>({ rep, stops: inputStops, starredId: null });
  }
  const others = inputStops.filter((s) => String(s.id) !== String(starredId));

  // rep -> star
  const firstLeg = await osrmRouteSafe([rep.lat, rep.lng], [star.lat, star.lng]);
  const firstCoords: LatLng[] = firstLeg
    ? firstLeg.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng)
    : ([ [rep.lat, rep.lng], [star.lat, star.lng] ] as LatLng[]);
  const firstKm = firstLeg ? firstLeg.distance / 1000 : haversineKm([rep.lat, rep.lng], [star.lat, star.lng]);

  // star + others ile TRIP
  const points2 = [{ lat: star.lat, lng: star.lng }, ...others.map((s) => ({ lat: s.lat, lng: s.lng }))];
  const trip2 = await osrmTripSafe(points2);
  if (trip2) {
    const ordered2 = trip2.waypoints
      .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
      .sort((a: any, b: any) => a.order - b.order)
      .map((x: any) => points2[x.inputIdx]);

    const restStops = ordered2.slice(1).map((p: any) => {
      return others.find((s) => s.lat === p.lat && s.lng === p.lng)!;
    });
    const orderedStops = [star, ...restStops];

    const restPolyline: LatLng[] = trip2.trips[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    const merged = firstCoords.concat(restPolyline.slice(1));
    const distanceKm = firstKm + (trip2.trips[0].distance as number) / 1000;

    return { orderedStops, polyline: merged, distanceKm };
  }

  // Trip2 de yoksa → greedy (star sabit ilk) + segment route
  const latlngs2: LatLng[] = [
    [rep.lat, rep.lng],
    [star.lat, star.lng],
    ...others.map((s) => [s.lat, s.lng] as LatLng),
  ];
  // rep->star sabit, star'dan sonrası greedy
  const orderIdx2 = [0, 1].concat(greedyOrder(latlngs2.slice(1), 0).slice(1).map((i) => i + 1));
  const orderedLatLngs2 = orderIdx2.map((i) => latlngs2[i]);
  const orderedStops = [star, ...orderIdx2.slice(2).map((i) => others[i - 2])];

  const geom2 = await buildGeometryFromOrder(orderedLatLngs2);
  return { orderedStops, polyline: geom2.coords, distanceKm: geom2.km };
}
