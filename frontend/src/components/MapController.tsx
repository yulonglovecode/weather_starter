import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { Location } from '../types';

interface MapControllerProps {
  locations: Location[];
  padding: number;
}

export function MapController({ locations, padding }: MapControllerProps): null {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) {
      map.setView([0, 0], 2);
    } else if (locations.length === 1) {
      const { latitude: lat, longitude: lng } = locations[0];
      map.setView([lat, lng], 12);
    } else {
      const finiteLocations = locations.filter(
        ({ latitude: lat, longitude: lng }) => isFinite(lat) && isFinite(lng),
      );

      if (finiteLocations.length === 0) {
        map.setView([0, 0], 2);
        return;
      }

      const bounds: LatLngBoundsExpression = finiteLocations.map(
        ({ latitude: lat, longitude: lng }) => [lat, lng] as [number, number],
      );

      map.fitBounds(bounds, { padding: [padding, padding] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  return null;
}
