import { useEffect, useState } from "react";

type Location = { lat: number; lng: number };

export function useCurrentLocation(isDemoMode: boolean, demoCoords: Location = { lat: 40.9923, lng: 29.0275 }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // ✅ Demo modunda mock koordinat
      setLocation(demoCoords);
      setError(null);
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Tarayıcınız konum servisini desteklemiyor.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Konum alınamadı:", err);
        setError("Konum izni gerekli. Lütfen cihaz ayarlarından açın.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isDemoMode, demoCoords]);

  return { location, error, loading };
}
