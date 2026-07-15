/**
 * Property-based tests for `formatWeatherLabel`.
 *
 * Feature: weather-map-card
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatWeatherLabel } from '../mapUtils';
import type { WeatherSnapshot } from '../../types';

/** Build a minimal WeatherSnapshot for testing. */
function makeWeather(temperature_c: number | null, condition: string | null): WeatherSnapshot {
  return {
    temperature_c,
    condition,
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

/**
 * Property 1: Weather label finite temperature display
 *
 * Feature: weather-map-card, Property 1: Weather label finite temperature display
 * Validates: Requirements 3.1
 */
describe('Property 1: Weather label finite temperature display', () => {
  it('returns Math.round(temperature_c) + "°" for any finite temperature', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.option(fc.string(), { nil: null }),
        (temperature_c, condition) => {
          const weather = makeWeather(temperature_c, condition);
          const result = formatWeatherLabel(weather);
          expect(result).toBe(`${Math.round(temperature_c)}°`);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 2: Weather label condition fallback
 *
 * Feature: weather-map-card, Property 2: Weather label condition fallback
 * Validates: Requirements 3.2
 */
describe('Property 2: Weather label condition fallback', () => {
  it('returns full condition (≤12) or first 12 chars + "…" (>12) when temperature is non-finite/null', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null as number | null, NaN, Infinity, -Infinity),
        fc.string({ minLength: 1 }),
        (temperature_c, condition) => {
          const weather = makeWeather(temperature_c, condition);
          const result = formatWeatherLabel(weather);
          if (condition.length <= 12) {
            expect(result).toBe(condition);
          } else {
            expect(result).toBe(condition.slice(0, 12) + '…');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 3: Weather label null fallback
 *
 * Feature: weather-map-card, Property 3: Weather label null fallback
 * Validates: Requirements 3.3
 */
describe('Property 3: Weather label null fallback', () => {
  it('returns "--" when temperature is non-finite/null and condition is null', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null as number | null, NaN, Infinity, -Infinity),
        (temperature_c) => {
          const weather = makeWeather(temperature_c, null);
          const result = formatWeatherLabel(weather);
          expect(result).toBe('--');
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 4: Weather label output length bound
 *
 * Feature: weather-map-card, Property 4: Weather label output length bound
 * Validates: Requirements 3.2
 */
describe('Property 4: Weather label output length bound', () => {
  it('output length never exceeds 13 when temperature is non-finite/null with non-null condition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null as number | null, NaN, Infinity, -Infinity),
        fc.string({ minLength: 1 }),
        (temperature_c, condition) => {
          const weather = makeWeather(temperature_c, condition);
          const result = formatWeatherLabel(weather);
          expect(result.length).toBeLessThanOrEqual(13);
        },
      ),
      { numRuns: 100 },
    );
  });
});
