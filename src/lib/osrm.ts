// src/lib/osrm.ts
// OSRM istemcisi + sağlam fallback (greedy + segment route)
// Not: OSRM'e giderken her noktayı "ref" ile işaretliyoruz, geri dönüşte
// doğrudan aynı referanslarla ordered listeyi kuruyoruz.

export type LatLng = [number, number];

export interface RepPoint {
  lat: number;
  lng: number;
}

export interface StopPoint {
  id?: string | number;
  lat: number;
  lng: number;
  [k: string]: any; // name, address, vs.
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
  OSRM_BASE = url.replace(/\/+$/, "");
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
    // destination=any → son nokta serbest (400 riskini azaltır)
    const url = encodeURI(
      `${OSRM_BASE}/trip/v1/driving/${coords}` +
        `?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&radiuses=${radiuses}`
    );
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) return null;
    const data = JSON.parse(text);
    if (data.code !== "Ok" || !data.trips?.[0]) return null;
    return data;
  } catch (err) {
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
// Geometri (segment bazlı)
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
// Optimize (yüksek seviye)
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

  // 1) stops'ı temizle + kopyala
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

  // 3) YILDIZ YOK → TRIP dene (ref ile) → fallback greedy
  if (!starredId) {
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

      const orderedStops = orderedByTrip
        .filter((p: any) => p.kind === "stop")
        .map((p: any) => p.ref as TStop);

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

  // 4) YILDIZ VAR → rep->star ROUTE + star'dan TRIP (ref ile) → fallback greedy
  const star = inputStops.find((s) => String(s.id) === String(starredId));
  if (!star) {
    // id bulunamadıysa yıldızsız gibi davran
    return optimizeRoute<TStop>({ rep, stops: inputStops, starredId: null });
  }
  const others = inputStops.filter((s) => String(s.id) !== String(starredId));

  // rep -> star
  const firstLeg = await osrmRouteSafe([rep.lat, rep.lng], [star.lat, star.lng]);
  const firstCoords: LatLng[] = firstLeg
    ? firstLeg.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng)
    : ([ [rep.lat, rep.lng], [star.lat, star.lng] ] as LatLng[]);
  const firstKm = firstLeg ? firstLeg.distance / 1000 : haversineKm([rep.lat, rep.lng], [star.lat, star.lng]);

  // star + others ile TRIP (ref'li)
  const tripPoints2 = [
    { kind: "stop" as const, lat: star.lat, lng: star.lng, ref: star }, // source=first sayesinde ilk
    ...others.map((s) => ({ kind: "stop" as const, lat: s.lat, lng: s.lng, ref: s })),
  ];
  const trip2 = await osrmTripSafe(tripPoints2);
  if (trip2) {
    const ordered2 = trip2.waypoints
      .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
      .sort((a: any, b: any) => a.order - b.order)
      .map((x: any) => tripPoints2[x.inputIdx]);

    // star girişte zaten ilk; OSRM sıralaması yine de ilk bırakır (source=first)
    const orderedStops = ordered2.map((p: any) => p.ref as TStop);

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
