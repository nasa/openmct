# Copilot Handoff

This file is a restart note for future Copilot sessions in this repository.

## Current State

- Repo: 35N built on Open MCT + Vue 3.
- Frontend Signal plugin work has moved beyond EONET-only modules.
- Current focus is deployment readiness and provider auth hardening, not greenfield UI work.

## What Is Already Implemented

### Signal modules and frontend wiring

- Added first non-EONET operational modules:
  - Military Flights
  - AIS Vessels
  - GPS Jamming
- Signal type registry was expanded to cover these modules.
- Signal telemetry routing/metadata was updated for:
  - OpenSky
  - AIS
  - GPSJam
- Shared Signal view was extended to render module-specific stats/details.
- Signal map view/provider scaffolding was added.
- Map wrapper/components were introduced for flat/globe rendering scaffolding.
- A duplicate template error in SignalMapView.vue was fixed.
- Related lint/style issues were cleaned up.

### Relay and upstream hardening

- scripts/ais-relay.cjs now handles protected relay endpoints.
- Relay auth uses a shared-secret header, defaulting to x-relay-key.
- OpenSky flow is implemented end-to-end:
  - relay auth
  - OAuth client-credentials token fetch
  - token cache with refresh margin
  - protected /opensky endpoint
- AIS snapshot flow is implemented end-to-end:
  - relay auth
  - protected /ais/snapshot endpoint
- AIS realtime ingestion is implemented:
  - websocket client to AISStream
  - reconnect/backoff handling
  - queue watermarks/backpressure behavior
  - vessel state tracking by MMSI
  - trail retention
  - snapshot rebuilding
  - health metrics

## What Has Been Validated Locally

- node --check passes for scripts/ais-relay.cjs.
- eslint passed for src/plugins/signal/services/opensky-data.js.
- npm ls confirmed ws is installed.
- Relay auth behavior was smoke-tested:
  - unauthorized snapshot requests returned 401
  - authorized snapshot requests returned 200
- Live AIS validation was completed with real upstream data.
- Live OpenSky validation was completed with real upstream data.

## Important Architecture Decisions

- Open MCT remains the shell. Signal is an Open MCT plugin, not a separate SPA.
- Vue views should continue to use the existing Open MCT view-provider pattern with utils/mount.
- Build-time client constants belong in webpack DefinePlugin, not ad hoc runtime globals.
- Railway is the correct place for long-lived upstream connections and sensitive provider credentials.
- Vercel should prefer consuming cached/bootstrap data rather than directly holding every upstream credential.

## Auth And Credential Decisions

- Do not store secrets in this file.
- A relay shared secret is required on both Vercel and Railway and must match exactly.
- OpenSky uses OAuth client credentials on the relay.
- ACLED must not be modeled as a static token integration.
- ACLED should use server-side OAuth password grant with:
  - ACLED_USERNAME
  - ACLED_PASSWORD
- ACLED bearer tokens should be minted/refreshed server-side and cached in memory/Redis.

## Build Guide Change Already Made

35N_Build_Guide.md was updated so that:

- Vercel no longer assumes ACLED_ACCESS_TOKEN is a required env var.
- Railway/server-side env now uses ACLED_USERNAME and ACLED_PASSWORD.
- The ACLED section now documents OAuth token exchange/refresh instead of static-token usage.
- Vercel is expected to consume ACLED-derived cached/bootstrap outputs rather than own ACLED credentials.

## Known Good Files To Inspect First On Resume

- scripts/ais-relay.cjs
- src/plugins/signal/types/signal-types.js
- src/plugins/signal/telemetry/signal-telemetry-provider.js
- src/plugins/signal/views/SignalView.vue
- src/plugins/signal/views/SignalMapView.vue
- src/plugins/signal/views/signal-view-provider.js
- src/plugins/signal/services/opensky-data.js
- src/plugins/signal/services/ais-data.js
- src/plugins/signal/services/gpsjam-data.js
- src/config/map-layer-definitions.js
- .webpack/webpack.common.mjs
- 35N_Build_Guide.md

## What Is Still Pending

### High priority

- Implement actual ACLED runtime integration code.
  - The guide is corrected, but repo code for ACLED OAuth-backed collection is still not in place.
- Continue deployment credential collection and placement review.
- Replace temporary/non-production-safe provider tokens before real deployment.

### Broader platform work not yet completed

- Vercel gateway/sebuf domain implementation is still largely ahead.
- Many Railway seed scripts described in the guide are not yet implemented.
- Convex, Clerk, and Stripe infrastructure is still pending.
- Additional relay-backed providers like Telegram, OREF, ICAO, and others remain future work.

## Cloudflare Radar Note

- Correct permission scope is narrow Radar read access.
- A temporary token was accepted for short-term use only.
- It is not production-safe if it is tied to a personal IP and/or short expiry.

## Resume Plan

When returning, start in this order:

1. Re-read scripts/ais-relay.cjs and 35N_Build_Guide.md.
2. Confirm current env expectations without printing or persisting secrets.
3. Implement ACLED runtime code next, unless deployment credential collection is the immediate task.
4. If moving toward deployment, validate each credential for:
   - correct scope
   - correct host placement (Vercel vs Railway)
   - production suitability

## Guardrails For Future Sessions

- Do not reintroduce static ACLED token assumptions.
- Do not move long-lived upstream auth or websocket responsibilities into the browser.
- Do not store plaintext secrets in repo files.
- Prefer minimal edits that preserve the existing Open MCT plugin structure.
- Expect the worktree may contain unrelated user changes; do not revert them unless explicitly asked.

## Quick Summary

The current codebase already has the first non-EONET Signal modules wired, OpenSky relay auth/token flow working, AIS relay auth working, and live AIS websocket ingestion working. The main unfinished gap from the last phase is turning the corrected ACLED OAuth design into actual runtime code, then continuing deployment preparation with production-safe credentials.