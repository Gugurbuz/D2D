// src/lib/osrm.ts
// Tek görev: rep + duraklar => ordered duraklar, polyline (LatLng[]), toplam mesafe (km)
// OSRM varsa kullanır; yoksa greedy + düz çizgi ile %100 çalışır.

export type LatLng = [number, number];

export interface RepPoint {
  lat: number;
  lng: number;
}

export interface StopPoint {
  id?: string | number;
  lat: number;
  lng: number;
  [k: string]: any; // name, address vs. korunur
}

export interface OsrmOptimizeResult<TStop extends StopPoint = StopPoint> {
  orderedStops: TStop[];
  polyline: LatLng[];
  distanceKm: number;
}

/** OSRM’i istersen tamamen kapat (sadece fallback) */
const USE_OSRM = true;

/** İstersen kendi OSRM host’un: */
let OSRM_BASE = "https://router.project-osrm.org";
export function setOsrmBase(url: string) {
  OSRM_BASE = url.replace(/\/+$/, "");
}

const toCoordStr = (lat: number, lng: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
const makeRadiusesParam = (n: number, r = 1000) => new Array(n).fill(String(r)).join(";");

/* ----------------- Yardımcılar ----------------- */
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function greedyOrder(points: LatLng[], startIndex = 0): number[] {
  const n = points.length;
  const used = new Array(n).fill(false);
  const order = [startIndex];
  used[startIndex] = true;
  for (let k = 1; k < n; k++) {
    const last = points[order[order.length - 1]];
    let best = -1, bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      const d = haversineKm(last, points[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    used[best] = true;
    order.push(best);
  }
  return order;
}

/* ----------------- OSRM çağrıları (güvenli) ----------------- */
async function osrmTripSafe(points: { lat: number; lng: number }[]) {
  if (!USE_OSRM) return null;
  if (!points || points.length < 2) return null;
  try {
    const coords = points.map((p) => toCoordStr(p.lat, p.lng)).join(";");
    const radiuses = makeRadiusesParam(points.length, 1000);
    const url =
      `${OSRM_BASE}/trip/v1/driving/${coords}` +
      `?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&radiuses=${radiuses}`;
    const res = await fetch(encodeURI(url));
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.trips?.[0]) return null;
    return data;
  } catch {
    return null;
  }
}
async function osrmRouteSafe(from: LatLng, to: LatLng) {
  if (!USE_OSRM) return null;
  try {
    const coords = `${toCoordStr(from[0], from[1])};${toCoordStr(to[0], to[1])}`;
    const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&annotations=false&steps=false`;
    const res = await fetch(encodeURI(url));
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    return data.routes[0] as { distance: number; geometry: { coordinates: [number, number][] } };
  } catch {
    return null;
  }
}

/* ----------------- Geometri kurucu ----------------- */
async function buildGeometryFromOrder(orderedLatLngs: LatLng[]) {
  // segment segment ROUTE dene; yoksa düz çiz
  const coords: LatLng[] = [];
  let totalKm = 0;
  if (orderedLatLngs.length === 0) return { coords, km: 0 };
  coords.push(orderedLatLngs[0]);

  for (let i = 1; i < orderedLatLngs.length; i++) {
    const a = orderedLatLngs[i - 1], b = orderedLatLngs[i];
    const route = await osrmRouteSafe(a, b);
    if (route) {
      const seg = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
      coords.push(...seg.slice(1));
      totalKm += route.distance / 1000;
    } else {
      coords.push(b);
      totalKm += haversineKm(a, b);
    }
  }
  return { coords, km: totalKm };
}

/* ----------------- Optimize (yüksek seviye) ----------------- */
export async function optimizeRoute<TStop extends StopPoint = StopPoint>(params: {
  rep: RepPoint;
  stops: TStop[];
  starredId?: string | number | null;
}): Promise<OsrmOptimizeResult<TStop>> {
  const { rep } = params;

  // rep valid değilse boş dön
  if (!rep || !Number.isFinite(rep.lat) || !Number.isFinite(rep.lng)) {
    return { orderedStops: [] as TStop[], polyline: [] as LatLng[], distanceKm: 0 };
  }

  // stops temizle
  const inputStops = (params.stops || []).filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)
  ) as TStop[];
  const starredId =
    params.starredId === undefined || params.starredId === null || params.starredId === ""
      ? null
      : params.starredId;

  if (inputStops.length === 0) {
    return { orderedStops: [] as TStop[], polyline: [[rep.lat, rep.lng]], distanceKm: 0 };
  }

  // ==== YILDIZ YOK ====
  if (!starredId) {
    // 1) TRIP (ref ile)
    const tripPoints = [
      { kind: "rep" as const, lat: rep.lat, lng: rep.lng },
      ...inputStops.map((s) => ({ kind: "stop" as const, lat: s.lat, lng: s.lng, ref: s })),
    ];
    const trip = await osrmTripSafe(tripPoints);
    if (trip) {
      const orderedByTrip = trip.waypoints
        .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
        .sort((a: any, b: any) => a.order - b.order)
        .map((x: any) => tripPoints[x.inputIdx]);
      const orderedStops = orderedByTrip.filter((p: any) => p.kind === "stop").map((p: any) => p.ref as TStop);
      const polyline: LatLng[] = trip.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      const distanceKm = (trip.trips[0].distance as number) / 1000;
      return { orderedStops, polyline, distanceKm };
    }

    // 2) Fallback: greedy + route/düz
    const latlngs: LatLng[] = [[rep.lat, rep.lng], ...inputStops.map((s) => [s.lat, s.lng])];
    const orderIdx = greedyOrder(latlngs, 0);
    const orderedLatLngs = orderIdx.map((i) => latlngs[i]);
    const orderedStops = orderIdx.slice(1).map((i) => inputStops[i - 1]);
    const geom = await buildGeometryFromOrder(orderedLatLngs);
    return { orderedStops, polyline: geom.coords, distanceKm: geom.km };
  }

  // ==== YILDIZ VAR ====
  const star = inputStops.find((s) => String(s.id) === String(starredId));
  if (!star) {
    // id yoksa yıldızsız gibi davran
    return optimizeRoute<TStop>({ rep, stops: inputStops, starredId: null });
  }
  const others = inputStops.filter((s) => String(s.id) !== String(starredId));

  // 1) rep->star
  const firstLeg = await osrmRouteSafe([rep.lat, rep.lng], [star.lat, star.lng]);
  const firstCoords: LatLng[] = firstLeg
    ? firstLeg.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng)
    : ([ [rep.lat, rep.lng], [star.lat, star.lng] ] as LatLng[]);
  const firstKm = firstLeg ? firstLeg.distance / 1000 : haversineKm([rep.lat, rep.lng], [star.lat, star.lng]);

  // 2) star + others → TRIP (ref ile)
  const tripPoints2 = [
    { kind: "stop" as const, lat: star.lat, lng: star.lng, ref: star },
    ...others.map((s) => ({ kind: "stop" as const, lat: s.lat, lng: s.lng, ref: s })),
  ];
  const trip2 = await osrmTripSafe(tripPoints2);
  if (trip2) {
    const ordered2 = trip2.waypoints
      .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
      .sort((a: any, b: any) => a.order - b.order)
      .map((x: any) => tripPoints2[x.inputIdx]);
    const orderedStops = ordered2.map((p: any) => p.ref as TStop);
    const restPolyline: LatLng[] = trip2.trips[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    const merged = firstCoords.concat(restPolyline.slice(1));
    const distanceKm = firstKm + (trip2.trips[0].distance as number) / 1000;
    return { orderedStops, polyline: merged, distanceKm };
  }

  // 3) Fallback: yıldız sabit ilk, sonrasında greedy
  const latlngs2: LatLng[] = [
    [rep.lat, rep.lng],
    [star.lat, star.lng],
    ...others.map((s) => [s.lat, s.lng] as LatLng),
  ];
  // rep->star sabit, star’dan sonrası greedy
  const orderIdx2 = [0, 1].concat(greedyOrder(latlngs2.slice(1), 0).slice(1).map((i) => i + 1));
  const orderedLatLngs2 = orderIdx2.map((i) => latlngs2[i]);
  const orderedStops = [star, ...orderIdx2.slice(2).map((i) => others[i - 2])];
  const geom2 = await buildGeometryFromOrder(orderedLatLngs2);
  return { orderedStops, polyline: geom2.coords, distanceKm: geom2.km };
}
