/**
 * Unit tests for MapCard component.
 *
 * Validates: Requirements 1.5, 2.1, 2.5, 3.1, 3.2, 3.3, 5.2, 5.5, 5.7, 7.2
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Location, WeatherSnapshot } from '../../types';
import { formatWeatherLabel } from '../mapUtils';

// ---------------------------------------------------------------------------
// Mock leaflet — L.divIcon must return an object with html accessible
// ---------------------------------------------------------------------------
vi.mock('leaflet', () => {
  return {
    default: {
      divIcon: (opts: { html: string; className?: string; iconAnchor?: number[] }) => ({
        options: { html: opts.html },
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock react-leaflet — MapContainer, TileLayer, and Marker render as plain divs
// ---------------------------------------------------------------------------
vi.mock('react-leaflet', () => {
  const Marker = React.forwardRef(function Marker(
    {
      icon,
      eventHandlers,
    }: {
      icon?: { options: { html: string } };
      eventHandlers?: { click?: () => void };
      position?: [number, number];
      children?: React.ReactNode;
    },
    _ref: React.Ref<unknown>,
  ) {
    return (
      <div
        data-testid="marker"
        onClick={eventHandlers?.click}
        dangerouslySetInnerHTML={icon ? { __html: icon.options.html } : { __html: '' }}
      />
    );
  });
  Marker.displayName = 'Marker';

  function MapContainer({ children }: { children?: React.ReactNode; [key: string]: unknown }) {
    return <div data-testid="map-container">{children}</div>;
  }

  function TileLayer(_props: Record<string, unknown>) {
    return <div data-testid="tile-layer" />;
  }

  function useMap() {
    return {
      setView: vi.fn(),
      fitBounds: vi.fn(),
    };
  }

  return { Marker, MapContainer, TileLayer, useMap };
});

// ---------------------------------------------------------------------------
// Mock react-dom createPortal to render directly into the DOM
// ---------------------------------------------------------------------------
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    default: {
      ...actual,
      createPortal: (node: React.ReactNode) => node,
    },
    createPortal: (node: React.ReactNode) => node,
  };
});

// ---------------------------------------------------------------------------
// Mock useStore
// ---------------------------------------------------------------------------
vi.mock('../../state/store', () => ({
  useStore: vi.fn(),
}));

import { useStore } from '../../state/store';
import { MapCard } from '../MapCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWeather(overrides: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    temperature_c: 22,
    condition: 'Sunny',
    observed_at: null,
    source: null,
    area: null,
    valid_period_text: null,
    humidity_percent: null,
    rainfall_mm: null,
    wind_speed_knots: null,
    wind_direction_degrees: null,
    forecast_low_c: null,
    forecast_high_c: null,
    uv_index: null,
    psi_twenty_four_hourly: null,
    pm25_one_hourly: null,
    air_quality_region: null,
    forecast_periods: [],
    daily_forecast: [],
    ...overrides,
  };
}

function makeLocation(id: number, overrides: Partial<Location> = {}): Location {
  return {
    id,
    latitude: 1.3521 + id * 0.01,
    longitude: 103.8198 + id * 0.01,
    created_at: '2024-01-01T00:00:00Z',
    weather: makeWeather(),
    ...overrides,
  };
}

function makeDefaultStore(
  overrides: {
    locations?: Location[];
    selectedId?: number | null;
    select?: ReturnType<typeof vi.fn>;
  } = {},
) {
  return {
    locations: [],
    selectedId: null,
    isAdding: false,
    isLoading: false,
    refreshingId: null,
    deletingId: null,
    error: null,
    select: vi.fn(),
    setAdding: vi.fn(),
    create: vi.fn(),
    refresh: vi.fn(),
    deleteLocation: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MapCard unit tests', () => {
  // -----------------------------------------------------------------------
  // Test 1: Renders "No saved locations" overlay when locations is empty
  // -----------------------------------------------------------------------
  it('renders "No saved locations" overlay when locations is empty', () => {
    vi.mocked(useStore).mockReturnValue(makeDefaultStore({ locations: [] }) as any);
    render(<MapCard />);
    expect(screen.getByText('No saved locations')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test 2a: Renders 1 pin for 1 location
  // -----------------------------------------------------------------------
  it('renders 1 marker for 1 location', () => {
    const locations = [makeLocation(1)];
    vi.mocked(useStore).mockReturnValue(makeDefaultStore({ locations }) as any);
    const { container } = render(<MapCard />);
    const markers = container.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBe(1);
  });

  // -----------------------------------------------------------------------
  // Test 2b: Renders 3 pins for 3 locations
  // -----------------------------------------------------------------------
  it('renders 3 markers for 3 locations', () => {
    const locations = [makeLocation(1), makeLocation(2), makeLocation(3)];
    vi.mocked(useStore).mockReturnValue(makeDefaultStore({ locations }) as any);
    const { container } = render(<MapCard />);
    const markers = container.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBe(3);
  });

  // -----------------------------------------------------------------------
  // Test 3: Selected pin has selected CSS class; unselected pins do not
  // -----------------------------------------------------------------------
  it('selected pin has map-pin-selected class; unselected pins have map-pin-unselected', () => {
    const locations = [makeLocation(1), makeLocation(2), makeLocation(3)];
    vi.mocked(useStore).mockReturnValue(
      makeDefaultStore({ locations, selectedId: 2 }) as any,
    );
    const { container } = render(<MapCard />);
    const markers = container.querySelectorAll('[data-testid="marker"]');

    // Marker at index 0 → location id=1 (unselected)
    expect(markers[0].innerHTML).toContain('map-pin-unselected');
    expect(markers[0].innerHTML).not.toContain('map-pin-selected');

    // Marker at index 1 → location id=2 (selected)
    expect(markers[1].innerHTML).toContain('map-pin-selected');
    expect(markers[1].innerHTML).not.toContain('map-pin-unselected');

    // Marker at index 2 → location id=3 (unselected)
    expect(markers[2].innerHTML).toContain('map-pin-unselected');
    expect(markers[2].innerHTML).not.toContain('map-pin-selected');
  });

  // -----------------------------------------------------------------------
  // Test 4: Clicking a pin calls select with the correct location id
  // -----------------------------------------------------------------------
  it('clicking a pin calls select with the correct location id', () => {
    const select = vi.fn();
    const locations = [makeLocation(10), makeLocation(20), makeLocation(30)];
    vi.mocked(useStore).mockReturnValue(
      makeDefaultStore({ locations, select }) as any,
    );
    const { container } = render(<MapCard />);
    const markers = container.querySelectorAll('[data-testid="marker"]');

    // Click the second marker (location id=20)
    fireEvent.click(markers[1] as HTMLElement);
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(20);
  });

  // -----------------------------------------------------------------------
  // Test 5: Expand button opens the fullscreen overlay
  // -----------------------------------------------------------------------
  it('expand button opens the fullscreen overlay', async () => {
    const locations = [makeLocation(1)];
    vi.mocked(useStore).mockReturnValue(makeDefaultStore({ locations }) as any);
    render(<MapCard />);

    // Fullscreen dialog should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the expand button
    const expandButton = screen.getByRole('button', { name: /expand map to fullscreen/i });
    await userEvent.click(expandButton);

    // Fullscreen overlay should now be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test 6: Close button in FullscreenMapView closes the overlay and returns
  //         focus to the expand button
  // -----------------------------------------------------------------------
  it('close button closes the fullscreen overlay and returns focus to expand button', async () => {
    const locations = [makeLocation(1)];
    vi.mocked(useStore).mockReturnValue(makeDefaultStore({ locations }) as any);
    render(<MapCard />);

    // Open fullscreen
    const expandButton = screen.getByRole('button', { name: /expand map to fullscreen/i });
    await userEvent.click(expandButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click the close button inside the fullscreen view
    const closeButton = screen.getByRole('button', { name: /close fullscreen map/i });
    await userEvent.click(closeButton);

    // Overlay should be gone
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Focus should return to the expand button
    expect(document.activeElement).toBe(expandButton);
  });

  // -----------------------------------------------------------------------
  // Test 7: Pressing Escape inside FullscreenMapView closes the overlay
  // -----------------------------------------------------------------------
  it('pressing Escape inside FullscreenMapView closes the overlay', async () => {
    const locations = [makeLocation(1)];
    vi.mocked(useStore).mockReturnValue(makeDefaultStore({ locations }) as any);
    render(<MapCard />);

    // Open fullscreen
    const expandButton = screen.getByRole('button', { name: /expand map to fullscreen/i });
    await userEvent.click(expandButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Press Escape key inside the dialog
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    // Overlay should be gone
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests 8–11: formatWeatherLabel pure function
// ---------------------------------------------------------------------------

describe('formatWeatherLabel', () => {
  // -----------------------------------------------------------------------
  // Test 8: Finite temperature → rounded with degree symbol
  // -----------------------------------------------------------------------
  it('returns rounded temperature with degree symbol for finite temperature_c (e.g., 24.7 → "25°")', () => {
    const weather = makeWeather({ temperature_c: 24.7, condition: 'Sunny' });
    expect(formatWeatherLabel(weather)).toBe('25°');
  });

  // -----------------------------------------------------------------------
  // Test 9: Condition exactly 12 characters → no ellipsis
  // -----------------------------------------------------------------------
  it('returns condition unchanged when it is exactly 12 characters (no ellipsis)', () => {
    const condition = '123456789012'; // exactly 12 chars
    expect(condition.length).toBe(12);
    const weather = makeWeather({ temperature_c: null, condition });
    expect(formatWeatherLabel(weather)).toBe(condition);
  });

  // -----------------------------------------------------------------------
  // Test 10: Condition of 13 characters → truncated to 12 + "…"
  // -----------------------------------------------------------------------
  it('truncates condition to 12 characters + "…" when condition is 13 characters', () => {
    const condition = '1234567890123'; // 13 chars
    expect(condition.length).toBe(13);
    const weather = makeWeather({ temperature_c: null, condition });
    expect(formatWeatherLabel(weather)).toBe('123456789012…');
  });

  // -----------------------------------------------------------------------
  // Test 11: Both temperature_c and condition are null → returns "--"
  // -----------------------------------------------------------------------
  it('returns "--" when both temperature_c and condition are null', () => {
    const weather = makeWeather({ temperature_c: null, condition: null });
    expect(formatWeatherLabel(weather)).toBe('--');
  });
});
