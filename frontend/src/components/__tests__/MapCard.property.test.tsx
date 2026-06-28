/**
 * Property-based tests for MapPin component rendering.
 *
 * Feature: weather-map-card
 * Validates: Requirements 2.1, 2.5, 7.1, 7.2, 7.4
 *
 * These tests render MapPin components directly (not the full MapCard) to
 * avoid Leaflet map initialisation complexity.  react-leaflet's Marker is
 * mocked to render a plain <div> whose innerHTML is set to the DivIcon HTML
 * string produced by MapPin, so the CSS classes land in the real DOM.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { Location, WeatherSnapshot } from '../../types';

// ---------------------------------------------------------------------------
// Mock leaflet — L.divIcon must return an object whose html field is accessible
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
// Mock react-leaflet — Marker renders the DivIcon HTML into the DOM via a div
// ---------------------------------------------------------------------------
vi.mock('react-leaflet', () => {
  // Use forwardRef so that MapPin's markerRef doesn't throw
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
  return { Marker };
});

// Import MapPin AFTER the mocks are declared so it picks up the mocked modules
import { MapPin } from '../MapPin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWeather(): WeatherSnapshot {
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
  };
}

/** Fast-check arbitrary for a single valid Location */
const arbLocation: fc.Arbitrary<Location> = fc.record({
  id: fc.integer({ min: 1, max: 100_000 }),
  latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  weather: fc.constant(makeWeather()),
});

/** Array of 0–20 distinct-id locations */
const arbLocations = fc
  .array(arbLocation, { minLength: 0, maxLength: 20 })
  .map((locs) => {
    // Ensure unique ids by re-assigning monotonically
    return locs.map((loc, idx) => ({ ...loc, id: idx + 1 }));
  });

/** Array of 1–10 distinct-id locations */
const arbLocations1to10 = fc
  .array(arbLocation, { minLength: 1, maxLength: 10 })
  .map((locs) => locs.map((loc, idx) => ({ ...loc, id: idx + 1 })));

// ---------------------------------------------------------------------------
// Property 5: Pin count matches location count
//
// Feature: weather-map-card, Property 5: Pin count matches location count
// Validates: Requirements 2.1, 2.2
// ---------------------------------------------------------------------------
describe('Property 5: Pin count matches location count', () => {
  beforeEach(() => cleanup());

  it('renders exactly locations.length markers for any array of 0–20 locations', () => {
    fc.assert(
      fc.property(arbLocations, (locations) => {
        cleanup();
        const onSelect = vi.fn();
        const { container } = render(
          <>
            {locations.map((loc) => (
              <MapPin
                key={loc.id}
                location={loc}
                isSelected={false}
                onSelect={onSelect}
              />
            ))}
          </>,
        );
        const markers = container.querySelectorAll('[data-testid="marker"]');
        expect(markers.length).toBe(locations.length);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Selected pin visual distinction
//
// Feature: weather-map-card, Property 6: Selected pin visual distinction
// Validates: Requirements 2.5, 7.1, 7.4
// ---------------------------------------------------------------------------
describe('Property 6: Selected pin visual distinction', () => {
  beforeEach(() => cleanup());

  it('exactly the pins matching selectedId carry map-pin-selected; all others carry map-pin-unselected', () => {
    // Arbitrary: array of locations + optional selectedId (one of the ids, or null)
    const arb = arbLocations.chain((locs) => {
      if (locs.length === 0) {
        return fc.constant({ locations: locs, selectedId: null as number | null });
      }
      return fc.oneof(
        fc.constant({ locations: locs, selectedId: null as number | null }),
        fc
          .integer({ min: 0, max: locs.length - 1 })
          .map((idx) => ({ locations: locs, selectedId: locs[idx].id })),
      );
    });

    fc.assert(
      fc.property(arb, ({ locations, selectedId }) => {
        cleanup();
        const onSelect = vi.fn();
        const { container } = render(
          <>
            {locations.map((loc) => (
              <MapPin
                key={loc.id}
                location={loc}
                isSelected={loc.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </>,
        );

        locations.forEach((loc) => {
          const marker = container.querySelector(`[data-testid="marker"]:nth-child(${loc.id})`);
          if (!marker) return; // guard — should always be present

          const markerHtml = marker.innerHTML;
          const hasSelected = markerHtml.includes('map-pin-selected');
          const hasUnselected = markerHtml.includes('map-pin-unselected');

          if (loc.id === selectedId) {
            expect(hasSelected).toBe(true);
            expect(hasUnselected).toBe(false);
          } else {
            expect(hasUnselected).toBe(true);
            expect(hasSelected).toBe(false);
          }
        });
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Pin click triggers correct selection
//
// Feature: weather-map-card, Property 7: Pin click triggers correct selection
// Validates: Requirements 7.2
// ---------------------------------------------------------------------------
describe('Property 7: Pin click triggers correct selection', () => {
  beforeEach(() => cleanup());

  it("clicking any pin calls onSelect exactly once with that pin's location.id", () => {
    const arb = arbLocations1to10.chain((locs) =>
      fc
        .integer({ min: 0, max: locs.length - 1 })
        .map((clickedIndex) => ({ locations: locs, clickedIndex })),
    );

    fc.assert(
      fc.property(arb, ({ locations, clickedIndex }) => {
        cleanup();
        const onSelect = vi.fn();
        const { container } = render(
          <>
            {locations.map((loc) => (
              <MapPin
                key={loc.id}
                location={loc}
                isSelected={false}
                onSelect={onSelect}
              />
            ))}
          </>,
        );

        const markers = container.querySelectorAll('[data-testid="marker"]');
        const targetMarker = markers[clickedIndex] as HTMLElement;
        fireEvent.click(targetMarker);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(locations[clickedIndex].id);
      }),
      { numRuns: 100 },
    );
  });
});
