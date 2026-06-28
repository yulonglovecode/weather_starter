import type { WeatherSnapshot } from '../types';

/**
 * Formats a weather snapshot into a short display label for map pins.
 *
 * Branch logic:
 * 1. Finite `temperature_c` → `"${Math.round(temperature_c)}°"`
 * 2. Non-finite/null `temperature_c` with non-null `condition` →
 *    full string if ≤ 12 chars, otherwise first 12 chars + `"…"`
 * 3. Otherwise → `"--"`
 */
export function formatWeatherLabel(weather: WeatherSnapshot): string {
  const { temperature_c, condition } = weather;

  if (temperature_c !== null && isFinite(temperature_c)) {
    return `${Math.round(temperature_c)}°`;
  }

  if (condition !== null) {
    return condition.length > 12 ? condition.slice(0, 12) + '…' : condition;
  }

  return '--';
}
