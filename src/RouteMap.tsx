import React, { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Route, ChevronLeft, ChevronRight } from "lucide-react";

// Enerjisa/placeholder ikon (saha personeli için)
const redCarIcon = new L.Icon({
  iconUrl: "https://companieslogo.com/img/orig/ENJSA.IS-d388e8cb.png?t=1720244491",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// 🔢 Numara bazlı DivIcon (highlight destekli)
function createNumberIcon(n: number, highlight = false) {
  const baseStyle = `
    width:28px;height:28px;display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:12px;line-height:1;color:#fff;
    background:${highlight ? "#FF6B00" : "#0099CB"};
    border-radius:50%;border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.25);
    transform:${highlight ? "scale(1.12)" : "scale(1)"};
    transition: transform .2s ease;
  `;
  return L.divIcon({
    className: "number-marker",
    html: `
      <div class="${highlight ? "pulse-wrap" : ""}">
        <div style="${baseStyle}">${n}</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

// tel: href için numarayı normalize et
const toTelHref = (phone: string) => {
  // + işareti haricindeki tüm olmayan rakamları sil
  const cleaned = phone.replace(/(?!^\+)[^\d]/g, "");
  return `tel:${cleaned}`;
};

// (Maltepe içi örnek veri) → phone eklendi
const customers = [
  { id: '1',  name: 'Mehmet Yılmaz',     address: 'Maltepe – Bağdat Cd.',          lat: 40.9372, lng: 29.1550, plannedTime: "09:00", phone: "+90 532 111 22 01" },
  { id: '2',  name: 'Ayşe Demir',        address: 'Maltepe – Feyzullah Mah.',      lat: 40.9355, lng: 29.1602, plannedTime: "09:30", phone: "+90 532 111 22 02" },
  { id: '3',  name: 'Ali Kaya',          address: 'Maltepe – Cevizli Mah.',        lat: 40.9301, lng: 29.1655, plannedTime: "10:00", phone: "+90 532 111 22 03" },
  { id: '4',  name: 'Zeynep Koç',        address: 'Maltepe – İdealtepe Mah.',      lat: 40.9323, lng: 29.1490, plannedTime: "10:30", phone: "+90 532 111 22 04" },
  { id: '5',  name: 'Hakan Şahin',       address: 'Maltepe – Küçükyalı Merkez',    lat: 40.9287, lng: 29.1442, plannedTime: "11:00", phone: "+90 532 111 22 05" },
  { id: '6',  name: 'Selin Arslan',      address: 'Maltepe – Altayçeşme Mah.',     lat: 40.9402, lng: 29.1475, plannedTime: "11:30", phone: "+90 532 111 22 06" },
  { id: '7',  name: 'Burak Çetin',       address: 'Maltepe – Aydınevler Mah.',     lat: 40.9450, lng: 29.1650, plannedTime: "12:00", phone: "+90 532 111 22 07" },
  { id: '8',  name: 'Elif Aydın',        address: 'Maltepe – Gülsuyu Mah.',        lat: 40.9475, lng: 29.1423, plannedTime: "12:30", phone: "+90 532 111 22 08" },
  { id: '9',  name: 'Mert Öz',           address: 'Maltepe – Yalı Mah.',           lat: 40.9365, lng: 29.1522, plannedTime: "13:00", phone: "+90 532 111 22 09" },
  { id: '10', name: 'Gamze Yıldız',      address: 'Maltepe – Esenkent Mah.',       lat: 40.9480, lng: 29.1588, plannedTime: "13:30", phone: "+90 532 111 22 10" },
  { id: '11', name: 'Onur Demirel',      address: 'Maltepe – Zümrütevler Mah.',    lat: 40.9445, lng: 29.1544, plannedTime: "14:00", phone: "+90 532 111 22 11" },
  { id: '12', name: 'Derya Kılıç',       address: 'Maltepe – Büyükbakkalköy Mah.', lat: 40.9511, lng: 29.1633, plannedTime: "14:30", phone: "+90 532 111 22 12" },
  { id: '13', name: 'Volkan Taş',        address: 'Maltepe – Başıbüyük Mah.',      lat: 40.9533, lng: 29.1501, plannedTime: "15:00", phone: "+90 532 111 22 13" },
  { id: '14', name: 'Seda Karaca',       address: 'Maltepe – İdealtepe Sahil',     lat: 40.9309, lng: 29.1457, plannedTime: "15:30", phone: "+90 532 111 22 14" },
  { id: '15', name: 'Emre Uçar',         address: 'Maltepe – Küçükyalı Sahil',     lat: 40.9277, lng: 29.1485, plannedTime: "16:00", phone: "+90 532 111 22 15" },
  { id: '16', name: 'İpek Gür',          address: 'Maltepe – Feyzullah Cd.',       lat: 40.9350, lng: 29.1568, plannedTime: "16:30", phone: "+90 532 111 22 16" },
  { id: '17', name: 'Kerem Efe',         address: 'Maltepe – Tugay Yolu Cd.',      lat: 40.9420, lng: 29.1600, plannedTime: "17:00", phone: "+90 532 111 22 17" },
  { id: '18', name: 'Naz Acar',          address: 'Maltepe – Altayçeşme Cd.',      lat: 40.9398, lng: 29.1499, plannedTime: "17:30", phone: "+90 532 111 22 18" },
  { id: '19', name: 'Canan Sezer',       address: 'Maltepe – Yalı Sahil',          lat: 40.9359, lng: 29.1535, plannedTime: "18:00", phone: "+90 532 111 22 19" },
  { id: '20', name: 'Kaan Er',           address: 'Maltepe – Dragos Mah.',         lat: 40.9290, lng: 29.1599, plannedTime: "18:30", phone: "+90 532 111 22 20" },
  { id: '21', name: 'Buse Aksoy',        address: 'Maltepe – Cevizli Cd.',         lat: 40.9325, lng: 29.1644, plannedTime: "19:00", phone: "+90 532 111 22 21" },
  { id: '22', name: 'Tolga Kurt',        address: 'Maltepe – Altayçeşme Sahil',    lat: 40.9384, lng: 29.1510, plannedTime: "19:30", phone: "+90 532 111 22 22" },
];

const salesRep = { id: 'rep-1', name: 'Satış Uzmanı', lat: 40.9360, lng: 29.1500 };

type LatLng = [number, number];

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const fmtKm = (km: number | null) =>
  km == null ? "—" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km) + " km";

function RouteMapModern() {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [orderedCustomers, setOrderedCustomers] = useState(customers);
  const [loading, setLoading] = useState(false);
  const [startName, setStartName] = useState<string | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Harita ve marker referansları
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Panel aç/kapa + swipe
  const [panelOpen, setPanelOpen] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) setPanelOpen(false);
    if (dx > 50) setPanelOpen(true);
    touchStartX.current = null;
  };

  const abortRef = useRef<AbortController | null>(null);

  const handleOptimize = async () => {
    const repPos: LatLng = [salesRep.lat, salesRep.lng];

    const tripPoints = [
      { kind: "rep" as const, lat: repPos[0], lng: repPos[1] },
      ...customers.map(c => ({ kind: "cust" as const, lat: c.lat, lng: c.lng, ref: c })),
    ];

    const coords = tripPoints.map(p => `${p.lng},${p.lat}`).join(";");
    const tripUrl =
      `https://router.project-osrm.org/trip/v1/driving/${coords}` +
      `?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const res = await fetch(tripUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`OSRM trip error: ${res.status}`);
      const data = await res.json();
      if (data.code !== "Ok" || !data.trips?.[0]) throw new Error("Trip not found");

      const orderedByTrip = data.waypoints
        .map((wp: any, inputIdx: number) => ({ inputIdx, order: wp.waypoint_index }))
        .sort((a: any, b: any) => a.order - b.order)
        .map((x: any) => tripPoints[x.inputIdx]);

      const sortedCustomers = orderedByTrip
        .filter(p => p.kind === "cust")
        .map(p => (p as any).ref);
      setOrderedCustomers(sortedCustomers);

      const firstCustomerAfterRep = orderedByTrip.find(p => p.kind === "cust") as any;
      setStartName(firstCustomerAfterRep?.ref?.name ?? null);

      const geom = data.trips[0].geometry;
      const latlngs: LatLng[] = geom.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      setRouteCoords(latlngs);

      const totalMeters: number = data.trips[0].distance;
      setRouteKm(totalMeters / 1000);
    } catch (e) {
      console.error(e);
      const seq: LatLng[] = [
        [salesRep.lat, salesRep.lng],
        ...orderedCustomers.map(c => [c.lat, c.lng] as LatLng),
      ];
      let acc = 0;
      for (let i = 1; i < seq.length; i++) acc += haversineKm(seq[i - 1], seq[i]);
      setRouteKm(acc);
      setRouteCoords(seq);
    } finally {
      setLoading(false);
    }
  };

  // Ortak vurgu: liste/harita tıklamasında aynı
  const highlightCustomer = (c: typeof customers[number], index: number, pan = true) => {
    setSelectedId(c.id);
    const m = markerRefs.current[c.id];
    if (pan && mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
    }
    if (m) m.openPopup();
    const el = document.getElementById(`cust-row-${c.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="relative h-[520px] w-full rounded-2xl overflow-hidden shadow-xl">
      {/* pulse animasyonu */}
      <style>{`
        .pulse-wrap { position: relative; }
        .pulse-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          animation: pulse-ring 1.2s ease-out infinite;
          background: rgba(255,107,0,0.25);
          transform: scale(1);
          z-index: -1;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.9; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      <MapContainer
        center={[40.936, 29.15]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Satış uzmanı */}
        <Marker position={[salesRep.lat, salesRep.lng]} icon={redCarIcon}>
          <Popup><b>{salesRep.name}</b></Popup>
        </Marker>

        {/* Müşteriler (iki yönlü vurgu) */}
        {orderedCustomers.map((c, i) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={createNumberIcon(i + 1, selectedId === c.id)}
            zIndexOffset={1000 - i}
            ref={(ref) => {
              if (ref) {
                // @ts-ignore leaflet instance
                markerRefs.current[c.id] = ref;
              }
            }}
            eventHandlers={{ click: () => highlightCustomer(c, i, true) }}
          >
            <Popup>
              <div className="space-y-1">
                <div><b>{i + 1}. {c.name}</b></div>
                <div>{c.address}</div>
                <div>Saat: {c.plannedTime}</div>
                {/* 📞 tel linki */}
                <div>
                  Tel:{" "}
                  <a
                    href={toTelHref(c.phone)}
                    className="text-[#0099CB] font-semibold underline"
                    aria-label={`${c.name} aramak için tıklayın`}
                  >
                    {c.phone}
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Rota çizgisi */}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} pathOptions={{ color: "#0099CB", weight: 7 }} />
        )}
      </MapContainer>

      {/* SOL PANEL */}
      <div
        className={`absolute top-4 left-4 z-10 transition-transform duration-300 ${panelOpen ? "translate-x-0" : "-translate-x-[85%]"}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-white/90 rounded-xl shadow-md px-6 py-4 flex flex-col gap-3 min-w-[280px] max-w-sm">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-[#0099CB]" />
            <span className="font-semibold text-gray-700 text-base select-none">Rota</span>
            <button onClick={() => setPanelOpen(o => !o)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100">
              {panelOpen ? <ChevronLeft className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
            </button>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`text-sm font-semibold rounded-lg px-4 py-2 transition ${loading ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-[#0099CB] text-white hover:opacity-90"}`}
          >
            {loading ? "Rota Hesaplanıyor…" : "Rotayı optimize et"}
          </button>

          <div className="text-xs text-gray-600">
            {startName ? <>İlk müşteri: <b>{startName}</b></> : "Başlangıç (rep → ilk müşteri) optimizasyonla belirlenecek."}
          </div>

          <div className="text-xs text-gray-700 font-semibold">
            Toplam mesafe: <span className="text-[#0099CB]">{fmtKm(routeKm)}</span>
          </div>

          {/* Liste */}
          <div className="max-h-64 overflow-auto pr-1">
            {orderedCustomers.map((c, i) => {
              const selected = selectedId === c.id;
              return (
                <div
                  id={`cust-row-${c.id}`}
                  key={c.id}
                  className={`flex items-center gap-2 p-2 rounded transition ${selected ? "bg-[#0099CB]/10 ring-1 ring-[#0099CB]/30" : "hover:bg-gray-50"}`}
                >
                  <button
                    onClick={() => highlightCustomer(c, i, true)}
                    className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-white focus:outline-none ${selected ? "bg-[#FF6B00]" : "bg-[#0099CB]"}`}
                    title={`${i + 1}. müşteriyi vurgula`}
                  >
                    {i + 1}
                  </button>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.address}</div>
                    {/* 📞 listede tel linki */}
                    <a
                      href={toTelHref(c.phone)}
                      className="text-xs text-[#0099CB] underline"
                      aria-label={`${c.name} aramak için tıklayın`}
                      onClick={(e) => e.stopPropagation()} // satır click'ine karışmasın
                    >
                      {c.phone}
                    </a>
                  </div>
                  <span className="ml-auto text-xs text-gray-700 font-semibold">{c.plannedTime}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!panelOpen && (
          <button onClick={() => setPanelOpen(true)} className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white/90 border border-gray-200 rounded-full p-1 shadow" aria-label="Paneli aç">
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="rounded-lg bg-white shadow px-5 py-3 text-sm font-semibold text-gray-700">Rota Hesaplanıyor…</div>
        </div>
      )}
    </div>
  );
}

export default RouteMapModern;
