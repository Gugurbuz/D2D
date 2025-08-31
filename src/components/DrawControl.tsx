// src/components/DrawControl.tsx
import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

type Props = {
  onCreated: (layer: L.Layer) => void;
};

const DrawControl: React.FC<Props> = ({ onCreated }) => {
  const map = useMap();

  useEffect(() => {
    const draw = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false,   // <-- KRİTİK: Alan tooltip'ini kapat
          metric: true,      // (opsiyonel) metre-km kullan
          shapeOptions: { color: '#0099CB', weight: 2 }
        },
        // Diğerlerini kapatalım (ihtiyaç yoksa)
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
      },
      edit: false
    });

    map.addControl(draw);

    const handleCreated = (e: any) => {
      onCreated(e.layer as L.Layer);
      // Çizilen polygonu haritaya eklemek istiyorsanız:
      if (e.layer && map) (e.layer as L.Polygon).addTo(map);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(draw);
    };
  }, [map, onCreated]);

  return null;
};

export default DrawControl;
