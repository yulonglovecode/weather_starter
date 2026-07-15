# AGENTS.md — Weather Starter

Reference for AI agents and developers working in this codebase.

---

## Commands

All commands run from the **repo root** unless noted.

### Development

```bash
# Start the full stack in dev mode (backend + frontend via Vite middleware)
npm run dev
```

The dev script launches the backend with `tsx watch` through `portless`, which
provides a stable local URL. The backend also serves the Vite dev server as
middleware, so a single port (`localhost:1355` by default) serves everything.
The port is configurable via `PORTLESS_PORT` in `.env`.

### Build

```bash
# Build both workspaces: frontend (vite build) then backend (tsc)
npm run build

# Build frontend only (from repo root)
npm run build -w frontend

# Build backend only
npx tsc -p backend/tsconfig.json
```

### Type checking (no emit)

```bash
# Frontend
cd frontend && npx tsc --noEmit

# Backend is checked as part of build; no separate noEmit script exists
```

### Tests

```bash
# Run all tests (backend API tests + frontend unit/property tests)
npm test

# Watch mode
npm run test:watch

# Backend tests only (Node environment, Vitest from repo root)
npx vitest run --config vitest.config.ts

# Frontend tests only (jsdom environment, Vitest from frontend/)
cd frontend && npx vitest run
```

Test suite breakdown:

- **Backend** (`vitest.config.ts` at root): integration tests in
  `backend/src/**/*.test.ts`, run with `pool: forks` and
  `fileParallelism: false`. Each test suite creates an isolated SQLite
  database in a temp directory.
- **Frontend** (`frontend/vitest.config.ts`): unit and property-based tests
  in `frontend/src/**/*.test.{ts,tsx}`. Uses `jsdom` environment and
  `@testing-library/react`. Property tests use `fast-check` (≥100 runs each).

### Linting

```bash
# ESLint (config at repo root, covers both workspaces)
npx eslint .

# Prettier check
npx prettier --check .

# Prettier fix
npx prettier --write .
```

ESLint uses `typescript-eslint`, `eslint-plugin-react`, and
`eslint-plugin-react-hooks`. Prettier runs on pre-commit via Husky
(`.husky/pre-commit`).

### Database

```bash
# Generate a new migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate
```

Migrations are SQLite files in `backend/drizzle/`. The schema source of truth
is `backend/src/schema.ts`. The database path defaults to
`backend/weather.db` and is overridable via `DATABASE_PATH` env var.

### Utilities

```bash
# Health-check the running server and report any missing env / config issues
npm run doctor

# Reset the local database (deletes all locations)
npm run reset
```

---

## Environment Variables

Copy `.env.example` to `.env` at the repo root.

| Variable          | Default              | Description                                           |
| ----------------- | -------------------- | ----------------------------------------------------- |
| `WEATHER_API_KEY` | _(empty)_            | Optional data.gov.sg API key for higher rate limits   |
| `PORTLESS_PORT`   | `1355`               | Local dev server port                                 |
| `PORTLESS_HTTPS`  | `0`                  | Set to `1` to enable HTTPS in dev                     |
| `DATABASE_PATH`   | `backend/weather.db` | SQLite database file location                         |
| `LOG_LEVEL`       | `info`               | Pino log level (`silent` in tests)                    |
| `PORT`            | `3000`               | HTTP port when running `node dist/server.js` directly |

For the frontend Vite dev server, copy `frontend/.env.local.example` to
`frontend/.env.local` (only needed when running frontend independently from
the backend):

| Variable            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `VITE_BACKEND_PORT` | Backend port for API proxying                     |
| `VITE_API_TARGET`   | Full API base URL (overrides `VITE_BACKEND_PORT`) |

---

## Architecture

### Repository layout

```
weather_starter/
├── backend/              # Express API + SQLite persistence
│   ├── src/
│   │   ├── server.ts     # App factory + entry point
│   │   ├── db.ts         # Drizzle ORM layer (all DB queries)
│   │   ├── schema.ts     # Drizzle table definition + WeatherSnapshot type
│   │   ├── weather.ts    # Singapore weather API client
│   │   ├── logger.ts     # Pino logger (stdout + rolling file)
│   │   └── routes/
│   │       └── locations.ts  # Express router for /api/locations
│   ├── drizzle/          # Auto-generated SQL migrations
│   └── tsconfig.json     # NodeNext ESM, emits to dist/
├── frontend/             # React SPA
│   ├── src/
│   │   ├── main.tsx      # React entry point
│   │   ├── App.tsx       # Root component, mounts ThemeProvider + StoreProvider
│   │   ├── api.ts        # Fetch wrappers for backend REST endpoints
│   │   ├── types.ts      # Shared TypeScript interfaces (Location, WeatherSnapshot)
│   │   ├── components/   # UI components (see below)
│   │   ├── state/
│   │   │   └── store.tsx # React context store (locations, selectedId, CRUD actions)
│   │   └── theme/
│   │       ├── themes.ts        # Theme registry (id, label, CSS values)
│   │       └── ThemeContext.tsx  # ThemeProvider + useTheme hook
│   ├── index.css         # Tailwind base + per-theme CSS overrides
│   ├── tailwind.config.js
│   └── vite.config.ts    # Vite + @vitejs/plugin-react + frontman plugin
├── scripts/              # Node utility scripts (dev, start, doctor, reset)
├── drizzle.config.ts     # Drizzle Kit config (points at backend schema)
├── vitest.config.ts      # Backend test config (Node environment)
└── package.json          # Root workspace (npm workspaces: frontend, backend)
```

### Backend

**Entry point:** `backend/src/server.ts` exports `createApp(options)` which
returns a configured Express application. This separation allows tests to
inject a mock `WeatherClient` and an isolated database path.

**Routing:** `/api/locations` is handled by `createLocationsRouter` in
`backend/src/routes/locations.ts`. All route handlers are thin: they
validate input, delegate to `db.ts` for persistence, and call the
`WeatherClient` interface for weather refreshes.

**Data layer:** `backend/src/db.ts` owns all SQLite access via
`drizzle-orm/sqlite-proxy` wrapping Node's built-in `node:sqlite`
(`DatabaseSync`). Migrations run automatically on startup. All weather fields
are stored as flat columns on the `locations` table; the two JSON columns
(`forecast_periods`, `daily_forecast`) are typed via Drizzle's `$type`.

**Weather client:** `SingaporeWeatherClient` in `backend/src/weather.ts`
fetches from data.gov.sg APIs in parallel (10 concurrent requests). It finds
the nearest station/area to the requested coordinates using squared Euclidean
distance. The `WeatherClient` interface is injected via `createLocationsRouter`
so tests can substitute a stub without any mocking framework.

**Logging:** Pino logger writes to stdout and `backend/logs/app.log`
simultaneously via `pino.multistream`. Silent in tests.

**Frontend serving:** In development, the Express app mounts Vite as
middleware (`middlewareMode: true`). In production, it serves
`frontend/dist/` as static files with SPA fallback.

### Frontend

**State:** A single React context (`src/state/store.tsx`) holds all
application state: the `locations` array, `selectedId`, and async action
functions (`create`, `refresh`, `deleteLocation`). Components consume it via
`useStore()` and `useSelectedLocation()`.

**Theming:** `ThemeProvider` writes two CSS custom properties
(`--body-bg`, `--sidebar-bg`) and a `data-theme` attribute onto `<html>`
whenever the theme changes. Theme selection is persisted to `localStorage`.
Per-theme visual overrides live in `frontend/src/index.css` as
`[data-theme='<id>']` selectors — no components carry theme-conditional
logic.

**Component tree:**

```
App
└── ThemeProvider
    └── StoreProvider
        └── Layout
            ├── Sidebar                  # Location list, search, AddLocationForm
            │   └── SidebarCard × N
            ├── Hero                     # Main content area
            │   ├── HourlyStrip          # 24-hour forecast periods
            │   ├── TenDayForecast       # Daily forecast list with temp range bars
            │   └── TileGrid             # Weather metric tile grid
            │       ├── ConditionTile
            │       ├── AirQualityTile
            │       ├── WindTile
            │       ├── UVTile
            │       ├── TemperatureTile
            │       ├── PrecipitationTile
            │       ├── HumidityTile
            │       ├── AveragesTile
            │       └── MapCard          # Interactive Leaflet map tile
            │           ├── MapController   # Imperative fit-bounds via useMap()
            │           ├── MapPin × N      # DivIcon markers with weather labels
            │           └── FullscreenMapView (portal → document.body)
            └── ThemeSelector            # Fixed top-right dropdown
```

**Map:** `react-leaflet` renders an interactive map inside `MapCard`. Pin
styling and weather labels are built as Leaflet `DivIcon` HTML strings.
`MapController` is a render-null component that drives viewport changes
imperatively (`setView` / `fitBounds`) via `useMap()` inside a `useEffect`
keyed on the locations array. The fullscreen overlay is mounted via
`ReactDOM.createPortal`.

### Data flow

```
User action (add/refresh/delete)
  → useStore() action
    → api.ts fetch → POST/DELETE /api/locations[/:id/refresh]
      → locations.ts route
        → db.ts (SQLite read/write)
        → weather.ts (data.gov.sg parallel fetch) [on create/refresh]
      → JSON response
    → store re-fetches full list → React re-render
```

### Testing patterns

- **Backend integration tests** use `supertest` against a real `createApp`
  instance with an in-process SQLite database in a temp directory and a
  mock `WeatherClient`. Each test file is isolated (`fileParallelism: false`).
- **Frontend unit tests** use `@testing-library/react` with `vi.mock` for
  `react-leaflet`, `leaflet`, `react-dom` (portal), and `useStore`.
- **Frontend property tests** use `fast-check` with ≥100 runs per property,
  covering `formatWeatherLabel` (4 properties) and `MapPin` rendering
  (3 properties: pin count, selection distinction, click dispatch).

### Key constraints

- Coordinates are validated server-side to Singapore bounds
  (lat 1.1–1.5, lon 103.6–104.1).
- Duplicate coordinates are rejected with HTTP 409.
- Weather fetch failures on create return HTTP 201 with unrefreshed data
  rather than failing the creation.
- The frontend stores no weather data itself — all state is fetched from the
  backend on load and after mutations.
