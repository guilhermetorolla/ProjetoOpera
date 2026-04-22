import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export default function MapEvents({ onMapClick, setMapInstance }: any) {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}
