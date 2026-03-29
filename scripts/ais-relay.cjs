/*
 * 35N relay server (subset): OpenSky + health
 *
 * Endpoints:
 *   GET /health        -> public health check
 *   GET /opensky       -> OpenSky states/all passthrough with OAuth2 bearer token
 *   GET /ais/snapshot  -> AIS vessel snapshot (relay-auth protected)
 *
 * Security:
 *   /opensky requires x-relay-key (or RELAY_AUTH_HEADER) matching RELAY_SHARED_SECRET
 *
 * Environment:
 *   PORT=3004
 *   RELAY_SHARED_SECRET=...
 *   RELAY_AUTH_HEADER=x-relay-key
 *   OPENSKY_CLIENT_ID=...
 *   OPENSKY_CLIENT_SECRET=...
 */

const http = require('http');
const WebSocket = require('ws');

const DEFAULT_PORT = 3004;
const AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream';
const OPENSKY_TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const OPENSKY_STATES_URL = 'https://opensky-network.org/api/states/all';

const AIS_QUEUE_LOW_WATERMARK = 1000;
const AIS_QUEUE_HIGH_WATERMARK = 4000;
const AIS_QUEUE_HARD_CAP = 8000;
const AIS_MAX_VESSELS = 20000;
const AIS_TRAIL_MAX_POINTS = 30;
const AIS_SNAPSHOT_INTERVAL_MS = 10_000;
const AIS_QUEUE_FLUSH_INTERVAL_MS = 100;
const AIS_QUEUE_BATCH_SIZE = 300;

const relayAuthHeader = (process.env.RELAY_AUTH_HEADER || 'x-relay-key').toLowerCase();
const relaySecret = process.env.RELAY_SHARED_SECRET || '';

const tokenCache = {
  token: null,
  expiresAt: 0
};

// AIS snapshot store (populated by future AIS WS ingestion worker).
// Keeping this in-memory now allows a stable authenticated endpoint contract.
let aisSnapshot = [];
let aisSnapshotUpdatedAt = 0;
const aisVesselMap = new Map();
const aisMessageQueue = [];

let aisSocket = null;
let aisReconnectTimer = null;
let aisReconnectAttempt = 0;
let aisConnected = false;
let aisLastMessageAt = 0;

const aisStats = {
  enqueued: 0,
  droppedNewestAtHardCap: 0,
  evictedOldestAtHighWatermark: 0,
  processed: 0,
  ignoredWithoutPosition: 0,
  parseErrors: 0,
  queueWarnings: 0
};

let aisSnapshotTimer = null;
let aisQueueFlushTimer = null;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': `content-type, ${relayAuthHeader}`,
    'access-control-allow-methods': 'GET, OPTIONS'
  });
  response.end(JSON.stringify(payload));
}

function handleOptions(response) {
  response.writeHead(204, {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': `content-type, ${relayAuthHeader}`,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-max-age': '86400'
  });
  response.end();
}

function parseNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseEpochMillisFromMessage(report, metadata) {
  const epochSeconds =
    parseNumber(report?.Timestamp) ??
    parseNumber(report?.ReportTimestamp) ??
    parseNumber(metadata?.time_utc) ??
    parseNumber(metadata?.Time_UTC);

  if (epochSeconds !== null && epochSeconds > 0) {
    // AIS timestamps are typically epoch seconds.
    return epochSeconds > 9_999_999_999 ? epochSeconds : epochSeconds * 1000;
  }

  return Date.now();
}

function decodeAisMessage(messageString) {
  let payload;
  try {
    payload = JSON.parse(messageString);
  } catch {
    aisStats.parseErrors++;
    return null;
  }

  const msg = payload?.Message || {};
  const positionReport =
    msg.PositionReport ||
    msg.StandardClassBPositionReport ||
    msg.ExtendedClassBPositionReport ||
    msg.BaseStationReport ||
    null;

  if (!positionReport) {
    return null;
  }

  const metadata = payload?.MetaData || payload?.Metadata || {};
  const mmsi =
    parseNumber(positionReport.UserID) ||
    parseNumber(positionReport.MMSI) ||
    parseNumber(metadata.MMSI) ||
    null;

  const latitude =
    parseNumber(positionReport.Latitude) ??
    parseNumber(metadata.latitude) ??
    parseNumber(metadata.latitude_dd);
  const longitude =
    parseNumber(positionReport.Longitude) ??
    parseNumber(metadata.longitude) ??
    parseNumber(metadata.longitude_dd);

  if (!mmsi || latitude === null || longitude === null) {
    aisStats.ignoredWithoutPosition++;
    return null;
  }

  const speed = parseNumber(positionReport.Sog) ?? parseNumber(positionReport.SOG);
  const heading =
    parseNumber(positionReport.TrueHeading) ??
    parseNumber(positionReport.Cog) ??
    parseNumber(positionReport.COG);

  const vesselName =
    msg.StaticDataReport?.ReportA?.Name ||
    msg.StaticDataReport?.ReportB?.Name ||
    metadata.ShipName ||
    metadata.shipName ||
    null;

  const timestamp = parseEpochMillisFromMessage(positionReport, metadata);

  return {
    mmsi: String(mmsi),
    latitude,
    longitude,
    speed,
    heading,
    status: positionReport.NavigationStatus ?? metadata.NavigationalStatus ?? null,
    flag: metadata.Flag || metadata.flag || null,
    name: vesselName,
    timestamp,
    receivedAt: Date.now()
  };
}

function evictOldestVessel() {
  let oldestKey = null;
  let oldestSeen = Number.POSITIVE_INFINITY;

  for (const [mmsi, vessel] of aisVesselMap.entries()) {
    if (vessel.lastSeenAt < oldestSeen) {
      oldestSeen = vessel.lastSeenAt;
      oldestKey = mmsi;
    }
  }

  if (oldestKey !== null) {
    aisVesselMap.delete(oldestKey);
  }
}

function upsertVessel(event) {
  const existing = aisVesselMap.get(event.mmsi);
  const base = existing || {
    mmsi: event.mmsi,
    name: event.name,
    latitude: event.latitude,
    longitude: event.longitude,
    heading: event.heading,
    speed: event.speed,
    status: event.status,
    flag: event.flag,
    timestamp: event.timestamp,
    lastSeenAt: event.receivedAt,
    trail: []
  };

  const trail = base.trail || [];
  trail.push({
    latitude: event.latitude,
    longitude: event.longitude,
    timestamp: event.timestamp
  });
  if (trail.length > AIS_TRAIL_MAX_POINTS) {
    trail.splice(0, trail.length - AIS_TRAIL_MAX_POINTS);
  }

  const merged = {
    ...base,
    name: event.name || base.name || event.mmsi,
    latitude: event.latitude,
    longitude: event.longitude,
    heading: event.heading,
    speed: event.speed,
    status: event.status,
    flag: event.flag,
    timestamp: event.timestamp,
    lastSeenAt: event.receivedAt,
    trail
  };

  aisVesselMap.set(event.mmsi, merged);

  while (aisVesselMap.size > AIS_MAX_VESSELS) {
    evictOldestVessel();
  }
}

function enqueueAisMessage(rawData) {
  if (aisMessageQueue.length >= AIS_QUEUE_HARD_CAP) {
    aisStats.droppedNewestAtHardCap++;
    return;
  }

  if (aisMessageQueue.length >= AIS_QUEUE_HIGH_WATERMARK) {
    aisMessageQueue.shift();
    aisStats.evictedOldestAtHighWatermark++;
  }

  if (aisMessageQueue.length >= AIS_QUEUE_LOW_WATERMARK) {
    aisStats.queueWarnings++;
  }

  aisMessageQueue.push(rawData);
  aisStats.enqueued++;
}

function flushAisMessageQueue() {
  const toProcess = Math.min(AIS_QUEUE_BATCH_SIZE, aisMessageQueue.length);

  for (let index = 0; index < toProcess; index++) {
    const raw = aisMessageQueue.shift();
    const decoded = decodeAisMessage(raw);

    if (decoded) {
      upsertVessel(decoded);
      aisStats.processed++;
      aisLastMessageAt = decoded.receivedAt;
    }
  }
}

function rebuildAisSnapshot() {
  aisSnapshot = Array.from(aisVesselMap.values())
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, AIS_MAX_VESSELS)
    .map((vessel) => ({
      mmsi: vessel.mmsi,
      name: vessel.name,
      latitude: vessel.latitude,
      longitude: vessel.longitude,
      heading: vessel.heading,
      speed: vessel.speed,
      status: vessel.status,
      flag: vessel.flag,
      timestamp: Math.floor(vessel.timestamp / 1000),
      trail: vessel.trail
    }));

  aisSnapshotUpdatedAt = Date.now();
}

function scheduleAisReconnect() {
  if (aisReconnectTimer) {
    return;
  }

  const attempt = aisReconnectAttempt + 1;
  const delayMs = Math.min(30_000, 1000 * 2 ** Math.min(6, aisReconnectAttempt));

  aisReconnectTimer = setTimeout(() => {
    aisReconnectTimer = null;
    aisReconnectAttempt = attempt;
    connectAisStream();
  }, delayMs);
}

function connectAisStream() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.warn('[35n-relay] AISSTREAM_API_KEY missing; AIS websocket disabled');
    return;
  }

  try {
    aisSocket = new WebSocket(AISSTREAM_URL);
  } catch (error) {
    console.error('[35n-relay] Failed to create AIS websocket:', error.message);
    scheduleAisReconnect();
    return;
  }

  aisSocket.on('open', () => {
    aisConnected = true;
    aisReconnectAttempt = 0;

    const subscription = {
      APIKey: apiKey,
      BoundingBoxes: [
        [
          [-90, -180],
          [90, 180]
        ]
      ],
      FiltersShipMMSI: []
    };

    aisSocket.send(JSON.stringify(subscription));
    console.log('[35n-relay] AIS websocket connected');
  });

  aisSocket.on('message', (data) => {
    const raw = typeof data === 'string' ? data : data.toString('utf8');
    enqueueAisMessage(raw);
  });

  aisSocket.on('error', (error) => {
    console.warn('[35n-relay] AIS websocket error:', error.message);
  });

  aisSocket.on('close', () => {
    aisConnected = false;
    console.warn('[35n-relay] AIS websocket disconnected; scheduling reconnect');
    scheduleAisReconnect();
  });
}

function startAisWorkers() {
  if (!aisQueueFlushTimer) {
    aisQueueFlushTimer = setInterval(flushAisMessageQueue, AIS_QUEUE_FLUSH_INTERVAL_MS);
  }

  if (!aisSnapshotTimer) {
    aisSnapshotTimer = setInterval(rebuildAisSnapshot, AIS_SNAPSHOT_INTERVAL_MS);
  }

  connectAisStream();
}

function stopAisWorkers() {
  if (aisReconnectTimer) {
    clearTimeout(aisReconnectTimer);
    aisReconnectTimer = null;
  }

  if (aisQueueFlushTimer) {
    clearInterval(aisQueueFlushTimer);
    aisQueueFlushTimer = null;
  }

  if (aisSnapshotTimer) {
    clearInterval(aisSnapshotTimer);
    aisSnapshotTimer = null;
  }

  if (aisSocket) {
    try {
      aisSocket.close();
    } catch {
      // no-op on shutdown
    }
    aisSocket = null;
  }
}

function validateRelayAuth(request) {
  // If no secret configured, allow requests for local bootstrap/dev only.
  if (!relaySecret) {
    return true;
  }

  const provided = request.headers[relayAuthHeader];
  return provided === relaySecret;
}

function requireRelayAuth(request, response) {
  if (validateRelayAuth(request)) {
    return true;
  }

  sendJson(response, 401, {
    error: 'unauthorized',
    message: `Missing or invalid relay auth header (${relayAuthHeader})`
  });
  return false;
}

async function getOpenSkyToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(OPENSKY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenSky token request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();

  if (!data.access_token || !data.expires_in) {
    throw new Error('OpenSky token response missing access_token or expires_in');
  }

  // Refresh 60s early to avoid edge expiry.
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + Math.max(60, data.expires_in - 60) * 1000;

  return tokenCache.token;
}

async function fetchOpenSkyStates(url) {
  const token = await getOpenSkyToken();

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    // Token may have expired/been revoked; clear cache and retry once.
    tokenCache.token = null;
    tokenCache.expiresAt = 0;

    const retryToken = await getOpenSkyToken();
    const retry = await fetch(url, {
      headers: {
        authorization: `Bearer ${retryToken}`
      }
    });

    if (!retry.ok) {
      const text = await retry.text();
      throw new Error(`OpenSky states retry failed (${retry.status}): ${text.slice(0, 300)}`);
    }

    return retry.json();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenSky states failed (${response.status}): ${text.slice(0, 300)}`);
  }

  return response.json();
}

function buildOpenSkyUrl(requestUrl) {
  const query = new URL(requestUrl, 'http://localhost').searchParams;
  const upstream = new URL(OPENSKY_STATES_URL);

  // Pass through optional OpenSky bounding box values.
  for (const key of ['lamin', 'lomin', 'lamax', 'lomax']) {
    const value = query.get(key);
    if (value !== null && value !== '') {
      upstream.searchParams.set(key, value);
    }
  }

  return upstream.toString();
}

async function handleOpenSky(request, response) {
  if (!requireRelayAuth(request, response)) {
    return;
  }

  try {
    const upstreamUrl = buildOpenSkyUrl(request.url);
    const data = await fetchOpenSkyStates(upstreamUrl);

    sendJson(response, 200, {
      source: 'opensky-relay',
      fetchedAt: Date.now(),
      ...data
    });
  } catch (error) {
    sendJson(response, 502, {
      error: 'opensky_upstream_failed',
      message: error.message
    });
  }
}

function handleAisSnapshot(request, response) {
  if (!requireRelayAuth(request, response)) {
    return;
  }

  sendJson(response, 200, {
    source: 'ais-relay',
    fetchedAt: Date.now(),
    snapshotUpdatedAt: aisSnapshotUpdatedAt || null,
    vessels: aisSnapshot
  });
}

function handleHealth(response) {
  sendJson(response, 200, {
    status: 'ok',
    service: '35n-relay',
    openskyTokenCached: Boolean(tokenCache.token) && Date.now() < tokenCache.expiresAt,
    aisSnapshotCount: aisSnapshot.length,
    aisVesselCount: aisVesselMap.size,
    aisConnected,
    aisQueueDepth: aisMessageQueue.length,
    aisLastMessageAt: aisLastMessageAt || null,
    aisSnapshotUpdatedAt: aisSnapshotUpdatedAt || null,
    aisStats,
    relayAuthHeader,
    relayAuthConfigured: Boolean(relaySecret)
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, 'http://localhost');

  if (request.method === 'OPTIONS') {
    handleOptions(response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    handleHealth(response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/opensky') {
    await handleOpenSky(request, response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/ais/snapshot') {
    handleAisSnapshot(request, response);
    return;
  }

  sendJson(response, 404, {
    error: 'not_found',
    message: `${request.method} ${requestUrl.pathname} is not implemented in this relay yet`
  });
});

server.listen(process.env.PORT || DEFAULT_PORT, () => {
  const port = process.env.PORT || DEFAULT_PORT;
  startAisWorkers();

  console.log(`[35n-relay] listening on http://localhost:${port}`);
  console.log(`[35n-relay] auth header: ${relayAuthHeader}`);
  console.log(
    `[35n-relay] relay auth ${relaySecret ? 'enabled (RELAY_SHARED_SECRET set)' : 'disabled (dev mode)'}`
  );
});

for (const signalName of ['SIGINT', 'SIGTERM']) {
  process.on(signalName, () => {
    stopAisWorkers();
    process.exit(0);
  });
}
