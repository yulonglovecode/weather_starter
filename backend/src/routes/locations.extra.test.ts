import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeatherProviderError, type WeatherSnapshot } from '../weather.js';

// ---------------------------------------------------------------------------
// Shared weather fixture
// ---------------------------------------------------------------------------

const baseWeather: WeatherSnapshot = {
  condition: 'Partly Cloudy',
  observed_at: '2026-05-04T08:00:00Z',
  source: 'test',
  area: 'Ang Mo Kio',
  valid_period_text: 'Morning',
  temperature_c: 28,
  humidity_percent: 75,
  rainfall_mm: 0,
  wind_speed_knots: 3,
  wind_direction_degrees: 90,
  forecast_low_c: 24,
  forecast_high_c: 33,
  uv_index: 5,
  psi_twenty_four_hourly: 38,
  pm25_one_hourly: 7,
  air_quality_region: 'north',
  forecast_periods: [{ label: 'Morning', forecast: 'Partly Cloudy' }],
  daily_forecast: [
    {
      date: '2026-05-04',
      forecast: 'Partly Cloudy',
      temperature_low_c: 24,
      temperature_high_c: 33,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type App = Awaited<ReturnType<typeof import('../server.js').createApp>>;

async function buildApp(
  tempDir: string,
  weatherClient: { getCurrentWeather: (lat: number, lon: number) => Promise<WeatherSnapshot> },
): Promise<App> {
  process.env.DATABASE_PATH = join(tempDir, 'weather.db');
  process.env.LOG_LEVEL = 'silent';
  // Re-import server each time so db.ts picks up the new DATABASE_PATH.
  // vitest's module cache is cleared between test files via pool:forks.
  const { createApp } = await import('../server.js');
  return createApp({ serveFrontend: false, enableRequestLogging: false, weatherClient });
}

// ---------------------------------------------------------------------------
// Suite 1: GET /api/locations and GET /api/locations/:id
// ---------------------------------------------------------------------------

describe('GET /api/locations', () => {
  let tempDir: string;
  let app: App;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-list-test-'));
    app = await buildApp(tempDir, {
      async getCurrentWeather() {
        return baseWeather;
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns an empty list on a fresh database', async () => {
    const response = await request(app).get('/api/locations').expect(200);
    expect(response.body).toEqual({ locations: [] });
  });

  it('returns all created locations', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.82 })
      .expect(201);
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.36, longitude: 103.83 })
      .expect(201);

    const response = await request(app).get('/api/locations').expect(200);
    expect(response.body.locations).toHaveLength(2);
  });
});

describe('GET /api/locations/:id', () => {
  let tempDir: string;
  let app: App;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-get-test-'));
    app = await buildApp(tempDir, {
      async getCurrentWeather() {
        return baseWeather;
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns a location by id', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.3, longitude: 103.8 })
      .expect(201);

    const response = await request(app)
      .get(`/api/locations/${created.body.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      latitude: 1.3,
      longitude: 103.8,
    });
  });

  it('returns 404 for an unknown id', async () => {
    const response = await request(app).get('/api/locations/99999').expect(404);
    expect(response.body).toMatchObject({ detail: 'Location not found' });
  });
});

// ---------------------------------------------------------------------------
// Suite 2: POST /api/locations — input validation
// ---------------------------------------------------------------------------

describe('POST /api/locations — validation', () => {
  let tempDir: string;
  let app: App;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-validation-test-'));
    app = await buildApp(tempDir, {
      async getCurrentWeather() {
        return baseWeather;
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns 422 when latitude is missing', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ longitude: 103.82 })
      .expect(422);
    expect(response.body).toMatchObject({ detail: expect.stringContaining('latitude') });
  });

  it('returns 422 when longitude is missing', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35 })
      .expect(422);
    expect(response.body).toMatchObject({ detail: expect.stringContaining('longitude') });
  });

  it('returns 422 when coordinates are not numbers', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 'abc', longitude: 'xyz' })
      .expect(422);
    expect(response.body.detail).toBeTruthy();
  });

  it('returns 422 for coordinates outside Singapore — too far north', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 2.0, longitude: 103.82 })
      .expect(422);
    expect(response.body.detail).toMatch(/Singapore/i);
  });

  it('returns 422 for coordinates outside Singapore — wrong longitude', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 100.0 })
      .expect(422);
    expect(response.body.detail).toMatch(/Singapore/i);
  });

  it('accepts coordinates on the exact boundary (lat 1.1, lon 103.6)', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.1, longitude: 103.6 })
      .expect(201);
  });

  it('accepts coordinates on the exact boundary (lat 1.5, lon 104.1)', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.5, longitude: 104.1 })
      .expect(201);
  });

  it('returns 409 for duplicate coordinates', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.25, longitude: 103.75 })
      .expect(201);

    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.25, longitude: 103.75 })
      .expect(409);

    expect(response.body.detail).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Suite 3: POST /api/locations — weather fetch failure on create
// ---------------------------------------------------------------------------

describe('POST /api/locations — weather fetch failure', () => {
  let tempDir: string;
  let app: App;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-fetch-fail-test-'));
    app = await buildApp(tempDir, {
      async getCurrentWeather() {
        throw new WeatherProviderError('API unavailable');
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns 201 with unrefreshed data when weather fetch fails', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    // Location was created; weather fields remain at default "Not refreshed" state
    expect(response.body.id).toBeDefined();
    expect(response.body.latitude).toBe(1.35);
    expect(response.body.weather.condition).toBe('Not refreshed');
  });
});

// ---------------------------------------------------------------------------
// Suite 4: POST /api/locations/:id/refresh
// ---------------------------------------------------------------------------

describe('POST /api/locations/:id/refresh', () => {
  let tempDir: string;
  let app: App;
  const weatherMock = {
    getCurrentWeather: vi.fn<() => Promise<WeatherSnapshot>>(),
  };

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-refresh-test-'));
    weatherMock.getCurrentWeather.mockResolvedValue(baseWeather);
    app = await buildApp(tempDir, weatherMock);
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    weatherMock.getCurrentWeather.mockResolvedValue(baseWeather);
  });

  it('returns 404 when refreshing an unknown location', async () => {
    const response = await request(app)
      .post('/api/locations/99999/refresh')
      .expect(404);
    expect(response.body).toMatchObject({ detail: 'Location not found' });
  });

  it('updates and returns the location with refreshed weather', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.3, longitude: 103.7 })
      .expect(201);

    const updatedWeather: WeatherSnapshot = {
      ...baseWeather,
      condition: 'Heavy Rain',
      temperature_c: 24,
    };
    weatherMock.getCurrentWeather.mockResolvedValueOnce(updatedWeather);

    const response = await request(app)
      .post(`/api/locations/${created.body.id}/refresh`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      weather: {
        condition: 'Heavy Rain',
        temperature_c: 24,
      },
    });
  });

  it('returns 502 when the weather provider fails during refresh', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.4, longitude: 103.9 })
      .expect(201);

    weatherMock.getCurrentWeather.mockRejectedValueOnce(
      new WeatherProviderError('Rate limit exceeded'),
    );

    const response = await request(app)
      .post(`/api/locations/${created.body.id}/refresh`)
      .expect(502);

    expect(response.body).toMatchObject({ detail: 'Rate limit exceeded' });
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Utility endpoints
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  let tempDir: string;
  let app: App;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-health-test-'));
    app = await buildApp(tempDir, {
      async getCurrentWeather() {
        return baseWeather;
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns healthy status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'healthy' });
  });
});

describe('POST /api/logs', () => {
  let tempDir: string;
  let app: App;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-logs-test-'));
    app = await buildApp(tempDir, {
      async getCurrentWeather() {
        return baseWeather;
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('accepts a valid frontend event', async () => {
    await request(app)
      .post('/api/logs')
      .send({ event: 'location.selected', page: '/home' })
      .expect(204);
  });

  it('accepts an event with metadata', async () => {
    await request(app)
      .post('/api/logs')
      .send({ event: 'theme.changed', metadata: { theme: 'dark' } })
      .expect(204);
  });

  it('returns 422 when event is missing', async () => {
    const response = await request(app).post('/api/logs').send({}).expect(422);
    expect(response.body).toMatchObject({ detail: expect.stringContaining('event') });
  });

  it('returns 422 when event name is invalid (contains uppercase)', async () => {
    const response = await request(app)
      .post('/api/logs')
      .send({ event: 'Location.Selected' })
      .expect(422);
    expect(response.body).toMatchObject({ detail: expect.stringContaining('event') });
  });

  it('returns 422 when event name is too short', async () => {
    const response = await request(app).post('/api/logs').send({ event: 'a' }).expect(422);
    expect(response.body).toMatchObject({ detail: expect.stringContaining('event') });
  });
});
