# Requirements Document

## Introduction

This feature adds an Apple Weather-inspired map card to the weather app's main dashboard. The card appears as a tile alongside existing weather tiles and displays all saved locations as interactive pins on an interactive map. Each pin shows a brief weather label (temperature or condition). The card can expand to a fullscreen map view for closer inspection. The visual style follows the frosted-glass, dark-overlay aesthetic already established in the app.

## Glossary

- **MapCard**: The map tile/card component rendered within the dashboard tile grid.
- **MapPin**: A marker placed on the map at a saved location's coordinates, showing a weather label.
- **WeatherLabel**: A small callout displayed above a MapPin showing the location's temperature or weather condition.
- **FullscreenMapView**: The expanded, fullscreen overlay of the map that opens when the user activates the MapCard.
- **Location**: A location persisted in the app's store (typed as `Location` in `types.ts`), having `id`, `latitude`, `longitude`, and an associated `WeatherSnapshot` in its `weather` field.
- **Dashboard**: The main content area of the app where tiles are displayed, rendered by `TileGrid` in `Tiles.tsx`.
- **TileGrid**: The existing grid component in `Tiles.tsx` that lays out all weather tiles.
- **WeatherSnapshot**: The weather data object associated with each `Location`, containing `temperature_c`, `condition`, and related fields.
- **MapTileProvider**: The external tile layer service (e.g., OpenStreetMap) supplying the base map imagery.

---

## Requirements

### Requirement 1: Map Card Tile in Dashboard

**User Story:** As a user, I want to see a map card in the dashboard so that I can view all my saved locations on a map at a glance.

#### Acceptance Criteria

1. THE `TileGrid` SHALL render the `MapCard` component as a tile within the dashboard grid.
2. THE `MapCard` SHALL occupy a visually distinct tile slot styled consistently with existing tiles using the frosted-glass aesthetic (semi-transparent background, border, rounded corners, backdrop blur).
3. THE `MapCard` SHALL display a header with a map icon and the label "Map" matching the existing `TileShell` header pattern.
4. THE `MapCard` SHALL span two columns in the grid so that the map container is at least 400px wide on desktop viewports.
5. WHEN the store contains zero `Location` entries, THE `MapCard` SHALL render the map container with a centered overlay message reading "No saved locations".

---

### Requirement 2: Display Saved Locations as Map Pins

**User Story:** As a user, I want to see pins for all my saved locations on the map so that I can immediately tell where each location is.

#### Acceptance Criteria

1. WHEN the `MapCard` renders, THE `MapCard` SHALL display exactly one `MapPin` for each `Location` in the store, positioned at that location's `latitude` and `longitude` coordinates.
2. WHEN the store contains zero `Location` entries, THE `MapCard` SHALL display the map without any pin markers.
3. WHEN a `Location` is added to the store, THE `MapCard` SHALL add the corresponding `MapPin` to the map without a page reload.
4. WHEN a `Location` is removed from the store, THE `MapCard` SHALL remove the corresponding `MapPin` from the map without a page reload.
5. IF a `Location` is the currently selected location (`selectedId` in the store), THE `MapCard` SHALL render its `MapPin` with a visually distinct style compared to unselected pins.

---

### Requirement 3: Weather Labels on Pins

**User Story:** As a user, I want each map pin to show a weather label so that I can read the temperature or condition directly on the map without tapping.

#### Acceptance Criteria

1. WHEN a `Location`'s `WeatherSnapshot` has a finite numeric `temperature_c`, THE `MapPin` SHALL display a `WeatherLabel` showing the temperature rounded to the nearest integer followed by the degree symbol (e.g., "24°").
2. WHEN a `Location`'s `WeatherSnapshot` has a non-finite or null `temperature_c` and a non-null `condition`, THE `MapPin` SHALL display a `WeatherLabel` showing the `condition` string truncated to 12 characters with a trailing ellipsis ("…") if the string exceeds 12 characters.
3. WHEN a `Location`'s `WeatherSnapshot` has both a non-finite or null `temperature_c` and a null `condition`, THE `MapPin` SHALL display a `WeatherLabel` showing "--".
4. THE `WeatherLabel` SHALL be styled as a small pill with a dark semi-transparent background, white text, and a drop-shadow, positioned vertically centered above and not overlapping the pin marker.

---

### Requirement 4: Map Auto-Fit to Saved Locations

**User Story:** As a user, I want the map to automatically pan and zoom to fit all my saved locations so that I do not have to manually navigate the map.

#### Acceptance Criteria

1. WHEN the `MapCard` first renders with at least one `Location`, THE `MapCard` SHALL fit the map viewport to include all `Location` coordinates with at least 50px of padding on each side.
2. WHEN `Location` entries change (additions or deletions) and the store still contains at least one `Location`, THE `MapCard` SHALL re-fit the map viewport to include all current `Location` coordinates with at least 50px of padding on each side.
3. WHEN the store contains exactly one `Location`, THE `MapCard` SHALL center the map on that location's coordinates at a zoom level of 12.
4. IF the last `Location` is deleted and the store contains zero entries, THE `MapCard` SHALL reset the map view to zoom level 2 centered at coordinates (0, 0).

---

### Requirement 5: Expand to Fullscreen Map View

**User Story:** As a user, I want to expand the map card to fullscreen so that I can explore the map in more detail.

#### Acceptance Criteria

1. THE `MapCard` SHALL display an expand control (icon button) in its top-right corner that has non-zero dimensions, is not hidden, and is reachable via keyboard navigation.
2. WHEN the user activates the expand control, THE `MapCard` SHALL open the `FullscreenMapView` overlay rendered at 100vw × 100vh above all other page content.
3. THE `FullscreenMapView` SHALL display the same set of `MapPin` markers and `WeatherLabel` callouts as the compact `MapCard`, including the selected-location visual distinction, reflecting the current store state.
4. THE `FullscreenMapView` SHALL display a close control (icon button) in its top-right corner that has non-zero dimensions, is not hidden, and is reachable via keyboard navigation.
5. WHEN the user activates the close control in the `FullscreenMapView`, THE `FullscreenMapView` SHALL close, focus SHALL return to the expand control, and the dashboard SHALL be fully interactive.
6. WHEN the `FullscreenMapView` is open, THE `FullscreenMapView` SHALL move initial focus to the close control and SHALL trap keyboard focus within the overlay.
7. WHEN the `FullscreenMapView` is open and the user presses the Escape key, THE `FullscreenMapView` SHALL close, focus SHALL return to the expand control, and the dashboard SHALL be fully interactive.
8. WHEN the `FullscreenMapView` opens, THE `FullscreenMapView` SHALL fit the map viewport to include all current `Location` coordinates with at least 60px of padding on each side.

---

### Requirement 6: Map Tile Provider and Styling

**User Story:** As a user, I want the map to have a dark, visually cohesive style so that it blends with the app's overall design.

#### Acceptance Criteria

1. THE `MapCard` SHALL use the `react-leaflet` library with a tile layer that renders land and water areas in dark or near-black tones, consistent with the app's dark theme.
2. THE `MapCard` SHALL suppress the default Leaflet attribution UI in the compact tile view.
3. THE `FullscreenMapView` SHALL display the tile provider's attribution text in a position that is visible and not obscured by any overlay element.
4. WHILE the `MapCard` is displayed in the compact tile view, THE `MapCard` SHALL disable scroll-wheel zoom to prevent accidental zoom while the user scrolls the dashboard.
5. THE `FullscreenMapView` SHALL enable zoom buttons, drag-to-pan, and scroll-wheel zoom interaction controls.

---

### Requirement 7: Selected Location Highlight

**User Story:** As a user, I want the currently selected location's pin to be visually distinguished so that I can quickly identify it on the map.

#### Acceptance Criteria

1. IF a `Location` is the currently selected location (`selectedId` in the store), THE corresponding `MapPin` SHALL render at least 1.5× the diameter of unselected pins and in a differentiated accent color.
2. WHEN the user clicks or presses Enter/Space on a `MapPin`, THE `MapCard` SHALL call the store's `select` action with the corresponding `Location`'s `id`.
3. WHEN the `selectedId` in the store changes, THE `MapCard` SHALL update the visual distinction of all `MapPin` markers to reflect the new selection without a page reload.
4. WHEN `selectedId` in the store is null, THE `MapCard` SHALL render all `MapPin` markers in the default (unselected) style.
