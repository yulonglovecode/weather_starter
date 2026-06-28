import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Location } from '../types';
import { MapController } from './MapController';
import { MapPin } from './MapPin';
import { CloseIcon } from './icons';

interface FullscreenMapViewProps {
  locations: Location[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  expandButtonRef: React.RefObject<HTMLButtonElement>;
}

const FOCUSABLE_SELECTORS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function FullscreenMapView({
  locations,
  selectedId,
  onSelect,
  onClose,
  expandButtonRef,
}: FullscreenMapViewProps): JSX.Element {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move initial focus to the close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Handle keyboard events: Escape to close, Tab/Shift+Tab for focus trapping
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        expandButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement;

        if (e.shiftKey) {
          // Shift+Tab: if on first focusable, wrap to last
          if (active === first || !overlay.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last focusable, wrap to first
          if (active === last || !overlay.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    overlay.addEventListener('keydown', handleKeyDown);
    return () => {
      overlay.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, expandButtonRef]);

  const handleClose = () => {
    onClose();
    expandButtonRef.current?.focus();
  };

  return (
    <div
      ref={overlayRef}
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="w-screen h-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen map view"
    >
      {/* Close button — top-right corner */}
      <button
        ref={closeButtonRef}
        onClick={handleClose}
        aria-label="Close fullscreen map"
        style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10000 }}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white backdrop-blur-sm"
      >
        <CloseIcon className="h-4 w-4" />
      </button>

      {/* Fullscreen map */}
      <MapContainer
        style={{ width: '100%', height: '100%' }}
        center={[0, 0]}
        zoom={2}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <MapController locations={locations} padding={60} />
        {locations.map((location) => (
          <MapPin
            key={location.id}
            location={location}
            isSelected={location.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
    </div>
  );
}
