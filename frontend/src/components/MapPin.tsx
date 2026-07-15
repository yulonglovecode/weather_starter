import { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../types';
import { formatWeatherLabel } from './mapUtils';

interface MapPinProps {
  location: Location;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

function buildDivIcon(label: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 20 : 12;
  const color = isSelected ? '#fbbf24' : '#38bdf8'; // amber-400 : sky-400
  const shadow = isSelected ? 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));' : '';

  const labelHtml = `
    <div style="
      position: absolute;
      bottom: ${size + 4}px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      background: rgba(15, 23, 42, 0.75);
      color: #fff;
      font-size: 11px;
      line-height: 1.2;
      padding: 2px 5px;
      border-radius: 4px;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
      pointer-events: none;
    ">${label}</div>
  `;

  const circleHtml = `
    <div
      data-selected="${isSelected}"
      class="${isSelected ? 'map-pin-selected' : 'map-pin-unselected'}"
      style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid #fff;
        ${shadow}
      "
    ></div>
  `;

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      ${labelHtml}
      ${circleHtml}
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapPin({ location, isSelected, onSelect }: MapPinProps): JSX.Element {
  const markerRef = useRef<L.Marker>(null);
  const { latitude, longitude, id, weather } = location;
  const label = formatWeatherLabel(weather);
  const icon = buildDivIcon(label, isSelected);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const el = marker.getElement();
    if (!el) return;

    // Make the marker element focusable for keyboard interaction
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Location pin: ${label}`);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(id);
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [id, label, onSelect]);

  return (
    <Marker
      ref={markerRef}
      position={[latitude, longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(id),
      }}
    />
  );
}
