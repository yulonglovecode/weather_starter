# Implementation Plan: Weather Map Card

## Overview

Add an interactive map tile to the existing dashboard using `react-leaflet` (already a declared dependency). The feature introduces `MapCard`, `FullscreenMapView`, `MapController`, and `MapPin` components, a pure `formatWeatherLabel` utility, two new icons, and a suite of property-based and unit tests with `fast-check`.

## Tasks

- [x] 1. Add icons and export `TileShell`
  - [x] 1.1 Add `MapPinIcon` and `ExpandIcon` to `frontend/src/components/icons.tsx`
    - Add `MapPinIcon` (small map-pin/location marker SVG) and `ExpandIcon` (expand/arrows-pointing-out SVG) following the existing `IconProps` pattern
    - _Requirements: 1.3, 5.1_

  - [x] 1.2 Export `TileShell` from `frontend/src/components/Tiles.tsx`
    - Change `function TileShell` to `export function TileShell` so `MapCard` can import it
    - _Requirements: 1.2, 1.3_

- [x] 2. Implement `formatWeatherLabel` utility
  - [x] 2.1 Create `frontend/src/components/mapUtils.ts` with the `formatWeatherLabel` pure function
    - Implement the three-branch logic: finite `temperature_c` → `"${Math.round(temperature_c)}°"`, non-finite/null with non-null `condition` → truncate to 12 chars + `"…"`, otherwise → `"--"`
    - Export `formatWeatherLabel(weather: WeatherSnapshot): string`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Write property tests for `formatWeatherLabel` (Properties 1–4)
    - Install `fast-check` as a dev dependency: `npm install -D fast-check` in `frontend/`
    - Create `frontend/src/components/__tests__/formatWeatherLabel.property.test.ts`
    - **Property 1: Weather label finite temperature display** — generator: arbitrary finite `number` for `temperature_c`; assert output === `${Math.round(temperature_c)}°`
    - **Property 2: Weather label condition fallback** — generator: null/NaN `temperature_c`, arbitrary non-null string `condition`; assert output is full string (≤ 12) or `condition.slice(0,12) + "…"` (> 12)
    - **Property 3: Weather label null fallback** — generator: null/NaN `temperature_c`, null `condition`; assert output === `"--"`
    - **Property 4: Weather label output length bound** — generator: null/NaN `temperature_c`, arbitrary non-null string `condition`; assert `output.length <= 13`
    - Each property must run ≥ 100 iterations
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 3. Implement `MapController` component
  - [x] 3.1 Create `frontend/src/components/MapController.tsx`
    - Implement `MapController({ locations, padding }: MapControllerProps): null` using `useMap()` from `react-leaflet`
    - `useEffect` keyed on `locations`: zero entries → `map.setView([0, 0], 2)`; one entry → `map.setView([lat, lng], 12)`; two or more → `map.fitBounds(bounds, { padding: [padding, padding] })` guarded so only finite-coordinate entries are included
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint — Ensure all tests pass so far
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `MapPin` component
  - [x] 5.1 Create `frontend/src/components/MapPin.tsx`
    - Implement `MapPin({ location, isSelected, onSelect }: MapPinProps): JSX.Element` using `react-leaflet`'s `<Marker>` with a custom `DivIcon`
    - Unselected pin: 12 × 12 px circle, `bg-sky-400`, white border
    - Selected pin: 20 × 20 px circle (≥ 1.5× unselected), `bg-amber-400`, white border, drop-shadow
    - `WeatherLabel` pill rendered above the pin circle inside the `DivIcon` HTML: dark semi-transparent background, white text, drop-shadow
    - Register `click` event handler via `eventHandlers` to call `onSelect(location.id)`
    - Attach `keydown` listener via `useEffect` on the underlying Leaflet marker element for `Enter` / `Space` → `onSelect(location.id)`
    - Import and call `formatWeatherLabel` from `mapUtils.ts` for the label text
    - _Requirements: 2.1, 2.5, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2_

  - [x] 5.2 Write property tests for pin count and selection (Properties 5–7)
    - Create `frontend/src/components/__tests__/MapCard.property.test.tsx`
    - **Property 5: Pin count matches location count** — generator: arbitrary array (0–20 valid `Location` objects); assert rendered marker DOM element count equals `locations.length`
    - **Property 6: Selected pin visual distinction** — generator: arbitrary array of `Location` objects and arbitrary `selectedId` (one of the ids, or null); assert exactly the pins matching `selectedId` carry the selected CSS class, all others do not
    - **Property 7: Pin click triggers correct selection** — generator: arbitrary array (1–10 `Location` objects), arbitrary index to click; assert mock `select` is called once with `locations[clickedIndex].id`
    - Each property must run ≥ 100 iterations
    - **Validates: Requirements 2.1, 2.5, 7.1, 7.2, 7.4**

- [x] 6. Implement `FullscreenMapView` component
  - [x] 6.1 Create `frontend/src/components/FullscreenMapView.tsx`
    - Implement `FullscreenMapView({ locations, selectedId, onSelect, onClose, expandButtonRef }: FullscreenMapViewProps): JSX.Element`
    - Render with `position: fixed; inset: 0; z-index: 9999` covering 100vw × 100vh
    - Render `MapContainer` with zoom buttons, drag, and scroll-wheel zoom enabled; show attribution at bottom-right (Leaflet default, `attributionControl` prop = true)
    - Render `MapController` with `padding={60}` inside the container
    - Render all `MapPin` markers reflecting current `locations`, `selectedId`, and `onSelect`
    - Render a close button (top-right corner) using `CloseIcon`; on activation call `onClose` and return focus to `expandButtonRef.current`
    - Move initial focus to the close button on mount via `useEffect`
    - Trap keyboard focus within the overlay (`Tab` / `Shift+Tab` cycle among focusable children)
    - Close on `Escape` keydown, returning focus to `expandButtonRef.current`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.3, 6.5_

- [x] 7. Implement `MapCard` component
  - [x] 7.1 Create `frontend/src/components/MapCard.tsx`
    - Implement `MapCard(): JSX.Element`
    - Read `locations`, `selectedId`, `select` from `useStore()`
    - Manage `isFullscreen: boolean` local state; hold `expandButtonRef = useRef<HTMLButtonElement>(null)`
    - Render `TileShell` with `MapPinIcon` and title `"Map"`, `className="col-span-2"`
    - Render compact `MapContainer` (scroll-wheel zoom disabled via `scrollWheelZoom={false}`, attribution suppressed via `attributionControl={false}`)
    - Render `MapController` with `padding={50}` inside the compact container
    - Render one `MapPin` per location, passing `isSelected={location.id === selectedId}` and `onSelect={select}`
    - Render "No saved locations" centered overlay when `locations.length === 0`
    - Render expand button (top-right, `ref={expandButtonRef}`, keyboard-accessible) using `ExpandIcon`; clicking sets `isFullscreen(true)`
    - When `isFullscreen` is true, render `FullscreenMapView` via `ReactDOM.createPortal(…, document.body)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 6.1, 6.2, 6.4, 7.3, 7.4_

  - [x] 7.2 Write unit tests for `MapCard`
    - Create `frontend/src/components/__tests__/MapCard.test.tsx`
    - Test: renders "No saved locations" overlay when `locations` is empty
    - Test: renders `n` pins for `n` locations (smoke: 1 and 3 locations)
    - Test: selected pin has the selected CSS class; unselected pins do not
    - Test: clicking a pin calls `select` with the correct location `id`
    - Test: expand button opens the fullscreen overlay
    - Test: close button in `FullscreenMapView` closes the overlay and returns focus to the expand button
    - Test: pressing `Escape` inside `FullscreenMapView` closes the overlay
    - Test: `formatWeatherLabel` with a concrete finite temperature
    - Test: `formatWeatherLabel` with condition exactly 12 characters (no ellipsis)
    - Test: `formatWeatherLabel` with condition of 13 characters (truncated + `"…"`)
    - Test: `formatWeatherLabel` with both null → returns `"--"`
    - _Requirements: 1.5, 2.1, 2.5, 3.1, 3.2, 3.3, 5.2, 5.5, 5.7, 7.2_

- [x] 8. Wire `MapCard` into `TileGrid`
  - [x] 8.1 Update `frontend/src/components/Tiles.tsx` to render `MapCard` inside `TileGrid`
    - Import `MapCard` from `./MapCard`
    - Add `<MapCard />` as a child of the grid `<div>` in `TileGrid`, placed after the existing tiles
    - Confirm no TypeScript or lint errors
    - _Requirements: 1.1, 1.4_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- `react-leaflet` and `@types/leaflet` are already declared in `frontend/package.json`; no additional runtime dependency is needed.
- `fast-check` must be installed as a dev dependency before running the property tests (`npm install -D fast-check` inside `frontend/`).
- Each task references specific requirements for full traceability.
- Checkpoints ensure incremental validation.
- Property tests validate the four `formatWeatherLabel` invariants and the three component-level invariants (pin count, selection distinction, click dispatch).
- Unit tests validate concrete examples, accessibility interactions, and edge cases.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["5.1"] },
    { "id": 3, "tasks": ["5.2", "6.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "8.1"] }
  ]
}
```
