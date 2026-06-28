import { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useStore } from '../state/store';
import { TileShell } from './Tiles';
import { MapController } from './MapController';
import { MapPin } from './MapPin';
import { FullscreenMapView } from './FullscreenMapView';
import { ExpandIcon, MapPinIcon } from './icons';

export function MapCard(): JSX.Element {
  const { locations, selectedId, select } = useStore();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <TileShell
      icon={<MapPinIcon className="h-3.5 w-3.5" />}
      title="Map"
      className="col-span-2"
    >
      {/* Wrapper with relative positioning for the expand button overlay */}
      <div className="relative">
        {/* Compact map container */}
        <div className="h-48 w-full rounded-lg overflow-hidden">
          <MapContainer
            style={{ width: '100%', height: '100%' }}
            center={[0, 0]}
            zoom={2}
            scrollWheelZoom={false}
            attributionControl={false}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <MapController locations={locations} padding={50} />
            {locations.map((location) => (
              <MapPin
                key={location.id}
                location={location}
                isSelected={location.id === selectedId}
                onSelect={select}
              />
            ))}
          </MapContainer>
        </div>

        {/* "No saved locations" overlay */}
        {locations.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-live="polite"
          >
            <span className="text-xs text-white/60 bg-slate-900/70 px-3 py-1.5 rounded-full backdrop-blur-sm">
              No saved locations
            </span>
          </div>
        )}

        {/* Expand button — top-right corner */}
        <button
          ref={expandButtonRef}
          onClick={() => setIsFullscreen(true)}
          aria-label="Expand map to fullscreen"
          className="absolute top-2 right-2 z-[1000] flex items-center justify-center w-7 h-7 rounded-full bg-slate-800/80 text-white/80 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white backdrop-blur-sm transition-colors"
        >
          <ExpandIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Fullscreen overlay via portal */}
      {isFullscreen &&
        ReactDOM.createPortal(
          <FullscreenMapView
            locations={locations}
            selectedId={selectedId}
            onSelect={select}
            onClose={() => setIsFullscreen(false)}
            expandButtonRef={expandButtonRef}
          />,
          document.body,
        )}
    </TileShell>
  );
}
