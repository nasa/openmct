**Software Name: 35N (35 November)**

Signals Intelligence Platform

Build Implementation Guide

*Full Technical Depth — Ordered by Dependency*


# **0. Overview & Build Order**

This guide is ordered by build dependency. Complete each phase before starting the next. Each section contains exact commands, file paths, environment variables, and dependency notes.

The platform is: Open MCT + Vue 3 module frontend · Vercel Edge Functions (API layer) · Railway (relay server + cron seeds) · Upstash Redis (cache) · Convex (auth/billing DB).

### **Build Phases**

| **Phase** | **What You Build** | **Blockers** |
| :- | :- | :- |
| 0 | Decisions: auth provider, payments, API tier arch | None |
| 1 | Repo, tooling, monorepo structure, env setup | Phase 0 |
| 2 | Open MCT shell, Vue Signal modules, map engine | Phase 1 |
| 3 | Vercel edge gateway + sebuf proto pipeline | Phase 2 |
| 4 | Railway relay server (AIS, OpenSky, Telegram, OREF) | Phase 3 |
| 5 | Upstash Redis + Railway seed cron jobs | Phase 4 |
| 6 | Core collection integrations (all APIs) | Phase 5 |
| 7 | Intelligence engine (CII, convergence, correlation) | Phase 6 |
| 8 | AI/ML pipeline (LLM chain, browser ONNX, RAG) | Phase 7 |
| 9 | Convex schema + Clerk auth + Stripe billing | Phase 3 |
| 10 | Deployment: Vercel + Railway + Cloudflare R2 | All |


# **1. Pre-Build Decisions**

## **1.1 Authentication Provider**

Decision: Clerk via `@clerk/clerk-js` headless SDK.

Rationale: the app runs in Open MCT with Vue modules (not React). `clerk-js` exposes `mountSignIn(element)` / `mountSignUp(element)` for DOM mounting in plugin views. First-class Convex webhook sync.

*NOTE: Prototype `mountSignIn()` inside an Open MCT view provider before committing. The headless SDK is less documented than framework wrappers.*

## **1.2 Payment Provider**

Decision: Stripe Checkout (hosted). Handles SCA/3DS automatically. Stripe Customer Portal for self-service billing.

Products to create in Stripe test mode before writing any billing code:

- 35N Pro Monthly — $X/mo
- 35N Pro Annual — $X/yr
- 35N API Starter — $Y/mo (1,000 req/day, 5 webhook rules)
- 35N API Business — $Z/mo (50,000 req/day, unlimited webhooks)

## **1.3 API Tier Architecture**

Pro (dashboard) and API (programmatic access) are separate Stripe products. A user can have either or both. A single entitlements projection table in Convex derives access from all active subscriptions. Rate limits are per `rateLimitTier`, not per product.

| **Tier** | **req/day** | **req/min** | **Webhook Rules** |
| :- | :- | :- | :- |
| free\_anon | 100 | 5 | 0 |
| free\_authed | 500 | 10 | 0 |
| pro | 10,000 | 60 | 0 |
| api\_starter | 1,000 | 30 | 5 |
| api\_business | 50,000 | 300 | unlimited |


# **2. Repository & Toolchain Setup**

## **2.1 Prerequisites**

| **Tool** | **Version** | **Purpose** |
| :- | :- | :- |
| Node.js | >=18.14.2 <23 | Runtime for Open MCT build, edge functions, relay, and seed scripts |
| Go | 1\.21+ | buf + sebuf code generation |
| buf CLI | latest | Proto linting + code gen orchestrator |

## **2.2 Repository Initialization**

```bash
git clone https://github.com/nasa/openmct.git 35N && cd 35N

npm install

npm run start

# Install buf + sebuf plugins

make install   # see Makefile below
```

### **Makefile**

```makefile
.PHONY: install generate check

install:
	go install github.com/bufbuild/buf/cmd/buf@latest
	go install github.com/SebastienMelki/sebuf/cmd/protoc-gen-ts-client@latest
	go install github.com/SebastienMelki/sebuf/cmd/protoc-gen-ts-server@latest
	go install github.com/SebastienMelki/sebuf/cmd/protoc-gen-openapiv3@latest
	npm install

generate:
	buf generate

check: generate
	npx tsc --noEmit
```

## **2.3 Directory Structure**

```
35N/
├── proto/35N/{domain}/v1/          # protobuf definitions
├── src/generated/client/           # generated TS clients (checked in)
├── src/generated/server/           # generated TS server stubs (checked in)
├── server/35N/{domain}/v1/         # RPC handler implementations
├── api/                            # Vercel edge functions (legacy + gateway)
├── src/
│   ├── plugins/
│   │   └── signal/                 # Open MCT Signal module plugin
│   │       ├── plugin.js
│   │       ├── types/
│   │       ├── views/
│   │       ├── telemetry/
│   │       ├── objects/
│   │       └── services/
│   ├── components/                 # Shared map wrappers and reusable UI
│   ├── services/                   # Data fetching, intelligence engines
│   ├── config/                     # Static datasets (bases, cables, etc.)
│   ├── workers/                    # Web Worker for ML/clustering
│   └── utils/
├── scripts/
│   ├── ais-relay.cjs              # Railway relay server
│   └── seeds/                     # seed-*.mjs cron scripts
├── convex/                         # Convex DB schema + mutations
└── docs/api/                       # Generated OpenAPI specs
```


## **2.4 Environment Variables — Full Reference**

*NOTE: All variables listed. Mark REQUIRED vs OPTIONAL.*

### **Vercel (Production)**

| **Variable** | **Required** | **Description** |
| :- | :- | :- |
| CONVEX\_URL | YES | Convex deployment URL |
| STRIPE\_SECRET\_KEY | YES | Stripe secret key |
| STRIPE\_WEBHOOK\_SECRET | YES | Stripe webhook signing secret |
| STRIPE\_PRO\_MONTHLY\_PRICE\_ID | YES | Stripe price ID for Pro Monthly |
| STRIPE\_PRO\_ANNUAL\_PRICE\_ID | YES | Stripe price ID for Pro Annual |
| STRIPE\_API\_STARTER\_PRICE\_ID | YES | Stripe price ID for API Starter |
| STRIPE\_API\_BUSINESS\_PRICE\_ID | YES | Stripe price ID for API Business |
| CLERK\_SECRET\_KEY | YES | Clerk secret key |
| CLERK\_WEBHOOK\_SECRET | YES | Clerk webhook signing secret |
| UPSTASH\_REDIS\_REST\_URL | YES | Upstash Redis REST URL |
| UPSTASH\_REDIS\_REST\_TOKEN | YES | Upstash Redis REST token |
| WS\_RELAY\_URL | YES | Railway relay HTTPS URL (server-side) |
| RELAY\_SHARED\_SECRET | YES | Shared secret for relay auth (must match Railway) |
| GROQ\_API\_KEY | YES | Groq LLM API key |
| OPENROUTER\_API\_KEY | OPTIONAL | OpenRouter fallback LLM |
| CLOUDFLARE\_API\_TOKEN | YES | Cloudflare Radar internet outages |
| EIA\_API\_KEY | YES | US Energy Information Administration |
| FRED\_API\_KEY | YES | Federal Reserve Economic Data |
| FINNHUB\_API\_KEY | YES | Stock quotes (primary) |
| NASA\_FIRMS\_API\_KEY | YES | NASA satellite fire detection |
| WINDY\_API\_KEY | OPTIONAL | Windy webcam layer |
| AVIATIONSTACK\_API | OPTIONAL | Airport delays (international) |
| ICAO\_API\_KEY | OPTIONAL | ICAO NOTAM (MENA airports) |
| WTO\_API\_KEY | OPTIONAL | WTO trade policy data |
| WINGBITS\_API\_KEY | OPTIONAL | Military aircraft enrichment |
| UCDP\_ACCESS\_TOKEN | OPTIONAL | UCDP conflict events |
| SENTRY\_DSN | OPTIONAL | Error tracking |

### **Railway (Relay Server)**

| **Variable** | **Required** | **Description** |
| :- | :- | :- |
| AISSTREAM\_API\_KEY | YES | AIS vessel tracking websocket feed |
| RELAY\_SHARED\_SECRET | YES | Must match Vercel value exactly |
| RELAY\_AUTH\_HEADER | REC | Default: `x-relay-key` |
| OPENSKY\_CLIENT\_ID | YES | OpenSky OAuth2 client ID |
| OPENSKY\_CLIENT\_SECRET | YES | OpenSky OAuth2 client secret |
| ACLED\_USERNAME | YES | ACLED account email used for OAuth password grant |
| ACLED\_PASSWORD | YES | ACLED account password used to mint and refresh bearer tokens |
| UPSTASH\_REDIS\_REST\_URL | YES | Same Upstash instance as Vercel |
| UPSTASH\_REDIS\_REST\_TOKEN | YES | Same Upstash token as Vercel |
| TELEGRAM\_API\_ID | YES | Telegram MTProto API ID |
| TELEGRAM\_API\_HASH | YES | Telegram MTProto API hash |
| TELEGRAM\_SESSION\_STRING | YES | GramJS session string (generated once) |
| OREF\_PROXY\_URL | YES | Residential Israeli exit IP proxy |
| PORT | NO | Default: 3004 |
| ALLOW\_VERCEL\_PREVIEW\_ORIGINS | NO | Set true for preview deploy CORS |

### **Local Development (Server `.env` + Webpack DefinePlugin)**

```bash
# Server-side values (.env): used by relay/seed/API handlers
CLERK_PUBLISHABLE_KEY=pk_test_...

WS_RELAY_URL=ws://localhost:3004

OPENSKY_RELAY_URL=http://localhost:3004/opensky

MAP_INTERACTION_MODE=flat   # or globe

PMTILES_URL=                   # leave blank to use OpenFreeMap

# API keys for local dev (copy from your team vault)

GROQ_API_KEY=gsk_...

ACLED_USERNAME=analyst@example.com

ACLED_PASSWORD=...

UPSTASH_REDIS_REST_URL=https://...

UPSTASH_REDIS_REST_TOKEN=...
```

```javascript
// Client values are injected at build time in .webpack/webpack.*.mjs via DefinePlugin.
// Example constants:
//   __SIGNAL_WS_RELAY_URL__
//   __SIGNAL_OPENSKY_RELAY_URL__
//   __SIGNAL_MAP_INTERACTION_MODE__
//   __SIGNAL_PMTILES_URL__
```


# **3. Frontend — Open MCT + Vue Signal Modules**

## **3.1 Plugin Registration**

Build Signal as an Open MCT plugin, not a standalone SPA shell.

```javascript
// src/plugins/signal/plugin.js

import { installSignalObjectProvider } from "./objects/signal-object-provider";
import { installSignalTelemetryProvider } from "./telemetry/signal-telemetry-provider";
import { installSignalViewProvider } from "./views/signal-view-provider";

export default function SignalPlugin() {
  return function install(openmct) {
    openmct.types.addType("signal.element", {
      name: "Signal Element",
      description: "Signals intelligence module",
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
      },
      cssClass: "icon-telemetry"
    });

    installSignalObjectProvider(openmct);
    installSignalTelemetryProvider(openmct);
    installSignalViewProvider(openmct);
  };
}
```

## **3.2 Signal Module Layout**

Each Signal element is a module under one plugin namespace.

```
src/plugins/signal/
├── plugin.js
├── types/
│   └── signal-types.js
├── objects/
│   └── signal-object-provider.js
├── telemetry/
│   └── signal-telemetry-provider.js
├── views/
│   ├── signal-view-provider.js
│   ├── SignalView.vue
│   └── SignalMapView.vue
├── inspectors/
│   └── SignalInspector.vue
└── services/
  ├── useSignalPolling.js
  └── signal-api.js
```

## **3.3 Vue View Provider Pattern**

Use Open MCT object view providers with Vue components and `utils/mount`.

```javascript
// src/plugins/signal/views/signal-view-provider.js
import mount from "utils/mount";
import SignalView from "./SignalView.vue";

export function installSignalViewProvider(openmct) {
  openmct.objectViews.addProvider({
    key: "signal.element.view",
    name: "Signal View",
    cssClass: "icon-telemetry",
    canView(domainObject) {
      return domainObject.type === "signal.element";
    },
    canEdit(domainObject) {
      return domainObject.type === "signal.element";
    },
    view(domainObject) {
      let destroyView;

      return {
        show(element) {
          const { destroy } = mount(
            {
              el: element,
              components: { SignalView },
              provide: { openmct, domainObject },
              template: "<SignalView />"
            },
            {
              app: openmct.app,
              element
            }
          );

          destroyView = destroy;
        },
        destroy() {
          if (destroyView) {
            destroyView();
          }
        }
      };
    },
    priority() {
      return 1;
    }
  });
}
```

## **3.4 Polling Composable**

All data-fetching Signal modules use one shared composable with exponential backoff, hidden-tab throttling, and manual refresh.

```javascript
// src/plugins/signal/services/useSignalPolling.js

export function useSignalPolling(
  fn,
  baseInterval,
  hiddenMultiplier = 5
) {
  let timer = null;
  let backoff = 1;
  const maxBackoff = 4;

  const stop = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (reason) => {
    const hidden = document.visibilityState === "hidden";
    const delay = baseInterval * backoff * (hidden ? hiddenMultiplier : 1);
    timer = window.setTimeout(() => void run(reason), delay);
  };

  const run = async (reason) => {
    try {
      await fn(reason);
      backoff = 1;
    } catch {
      backoff = Math.min(backoff * 2, maxBackoff);
    }
    schedule("interval");
  };

  return {
    start: () => schedule("startup"),
    stop,
    triggerNow: () => {
      stop();
      void run("manual");
    }
  };
}
```

## **3.5 Map Engine**

Two engines: flat map (deck.gl + MapLibre) and 3D globe (globe.gl + Three.js). Switchable via Settings or webpack-defined `__SIGNAL_MAP_INTERACTION_MODE__`. Preference persisted to object metadata.

### **Flat Map Dependencies**

```bash
npm install deck.gl @deck.gl/layers @deck.gl/geo-layers
npm install maplibre-gl
npm install supercluster   # marker clustering
```

### **Globe Dependencies**

```bash
npm install globe.gl three
npm install satellite.js   # SGP4 orbital propagation for satellite layer
```

### **Layer Registry**

All 49 layer definitions live in one file consumed by both renderers. Adding a layer is a single-file operation.

```typescript
// src/config/map-layer-definitions.ts

export type MapRenderer = "flat" | "globe" | "both";

export interface LayerDef {
  id: string;
  labelKey: string;        // i18n key
  fallbackLabel: string;
  renderers: MapRenderer[];
  defaultEnabled: boolean;
  mobileEnabled: boolean;
  premiumOnly?: boolean;
}

function def(d: LayerDef): LayerDef { return d; }

export const LAYER_DEFS: LayerDef[] = [
  def({ id: "conflicts",    fallbackLabel: "Conflicts",    renderers: ["both"], defaultEnabled: true,  mobileEnabled: true }),
  def({ id: "hotspots",     fallbackLabel: "Hotspots",     renderers: ["both"], defaultEnabled: true,  mobileEnabled: true }),
  def({ id: "sanctions",    fallbackLabel: "Sanctions",    renderers: ["both"], defaultEnabled: true,  mobileEnabled: true }),
  def({ id: "protests",     fallbackLabel: "Protests",     renderers: ["both"], defaultEnabled: true,  mobileEnabled: false }),
  def({ id: "bases",        fallbackLabel: "Mil. Bases",   renderers: ["both"], defaultEnabled: true,  mobileEnabled: false }),
  def({ id: "nuclear",      fallbackLabel: "Nuclear",      renderers: ["both"], defaultEnabled: true,  mobileEnabled: false }),
  def({ id: "jamming",      fallbackLabel: "GPS Jamming",  renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "satellites",   fallbackLabel: "Satellites",   renderers: ["globe"],defaultEnabled: false, mobileEnabled: false }),
  def({ id: "cables",       fallbackLabel: "Cables",       renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "pipelines",    fallbackLabel: "Pipelines",    renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "outages",      fallbackLabel: "Outages",      renderers: ["both"], defaultEnabled: true,  mobileEnabled: true  }),
  def({ id: "apt",          fallbackLabel: "APT Groups",   renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "cyber",        fallbackLabel: "Cyber IOCs",   renderers: ["globe"],defaultEnabled: false, mobileEnabled: false }),
  def({ id: "ais",          fallbackLabel: "Ships (AIS)",  renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "flights",      fallbackLabel: "Mil. Flights", renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "natural",      fallbackLabel: "Natural",      renderers: ["both"], defaultEnabled: true,  mobileEnabled: true  }),
  def({ id: "weather",      fallbackLabel: "Weather",      renderers: ["both"], defaultEnabled: true,  mobileEnabled: true  }),
  def({ id: "fires",        fallbackLabel: "Fires (FIRMS)",renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "daynight",     fallbackLabel: "Day/Night",    renderers: ["flat"], defaultEnabled: false, mobileEnabled: false }),
  def({ id: "cii",          fallbackLabel: "CII Heatmap",  renderers: ["both"], defaultEnabled: false, mobileEnabled: false }),
  // ... add remaining layers following same pattern
];
```

## **3.6 Open MCT Plugin Placement Map (Signal)**

Use the existing Open MCT plugin neighborhoods under `src/plugins/` and keep Signal isolated as one feature plugin.

| **Signal Concern** | **Primary Path** | **Open MCT Neighbor (Reference)** | **Notes** |
| :- | :- | :- | :- |
| Plugin entry + install wiring | `src/plugins/signal/plugin.js` | `src/plugins/plugins.js` | Register Signal once in central plugin assembly. |
| Object type + creation defaults | `src/plugins/signal/plugin.js` + `src/plugins/signal/objects/` | `example/dataVisualization/plugin.js` | Define `openmct.types.addType` and default model shape in one place. |
| View provider + Vue mount lifecycle | `src/plugins/signal/views/signal-view-provider.js` | `example/dataVisualization/ExampleDataVisualizationSourceViewProvider.js` | Follow `show()` / `destroy()` lifecycle and `utils/mount` pattern. |
| Telemetry metadata/realtime/historical providers | `src/plugins/signal/telemetry/` | `example/generator/plugin.js` | Keep provider registration in `plugin.js`; keep provider logic in dedicated files. |
| Inspector integration | `src/plugins/signal/inspectors/` | `src/plugins/inspectorViews/` | Add focused inspectors for module-specific context and controls. |
| Map-specific view(s) | `src/plugins/signal/views/SignalMapView.vue` | `src/plugins/imagery/` | Use map view as an object view, not as an app-level shell. |
| Persisted object model + composition rules | `src/plugins/signal/objects/` | `src/plugins/folderView/` and `src/plugins/flexibleLayout/` | Keep composition policy explicit so Signal objects compose predictable child types. |
| Shared client services and polling | `src/plugins/signal/services/` | `src/plugins/notebook/` and `src/plugins/plan/` | Avoid cross-plugin coupling; expose pure functions used by views/providers. |
| Optional workers | `src/workers/` with wrappers in `src/plugins/signal/services/` | `example/generator/generatorWorker.js` | Keep worker boundaries explicit and message payloads typed/documented. |

Implementation order inside Open MCT:

1. Add `src/plugins/signal/plugin.js` and wire it through `src/plugins/plugins.js`.
1. Add Signal type and object/view providers.
1. Add telemetry providers and module services.
1. Add map + inspector modules.
1. Add composition policy and permissions checks.


# **4. Vercel Edge API Gateway — sebuf Proto Pipeline**

## **4.1 Why sebuf**

All JSON API endpoints use sebuf. A `.proto` file defines messages + HTTP annotations. Code generation produces typed TS client, typed TS server stub, and OpenAPI 3.1 spec. No handwritten REST boilerplate. No schema drift between frontend and backend.

## **4.2 buf.gen.yaml**

```yaml
# buf.gen.yaml

version: v2

plugins:
  - plugin: protoc-gen-ts-client
    out: src/generated/client
  - plugin: protoc-gen-ts-server
    out: src/generated/server
  - plugin: protoc-gen-openapiv3
    out: docs/api

inputs:
  - directory: proto
```

## **4.3 Proto Conventions**

| **Convention** | **Rule** |
| :- | :- |
| File naming | One file per message type. One file per RPC pair. Service definition in `service.proto` |
| Field names | `snake_case` throughout |
| Time fields | `int64` with Unix epoch milliseconds. Never `google.protobuf.Timestamp` |
| Time encoding | Always add `(sebuf.http.int64_encoding) = INT64_ENCODING_NUMBER` for number not string |
| Validation | Import `buf/validate/validate.proto`. Annotate all fields. These flow to OpenAPI spec. |
| Route paths | Base: `/api/{domain}/v1`   RPC: `/{verb}-{noun}` kebab-case |
| Comments | Every message, field, service, RPC must have a `//` comment. buf lint enforces this. |

## **4.4 Adding a New RPC — Step by Step**

Example: adding `GetEarthquakeDetails` to `SeismologyService`

1. Create `proto/35N/seismology/v1/get_earthquake_details.proto` with request/response messages
1. Add the rpc to `proto/35N/seismology/v1/service.proto` with `(sebuf.http.config) = {path: "/get-earthquake-details"}`
1. Run: `make check`   # lints + generates. `tsc --noEmit` will FAIL until handler is implemented — this is correct
1. Create `server/35N/seismology/v1/get-earthquake-details.ts` implementing `SeismologyServiceHandler["getEarthquakeDetails"]`
1. Add import to `server/35N/seismology/v1/handler.ts`
1. Run: `npx tsc --noEmit`   # must pass with zero errors

*NOTE: The route is live immediately after step 6. No additional changes to frontend module wiring are needed unless this RPC is consumed by a new Signal module.*

## **4.5 Adding a New Service — Step by Step**

1. Create `proto/35N/{domain}/v1/` directory
1. Define entity messages in `{entity}.proto` files
1. Define request/response messages in `{verb}_{noun}.proto` files
1. Create `service.proto` with `(sebuf.http.service_config) = {base_path: "/api/{domain}/v1"}`
1. Run: `make check`
1. Create `server/35N/{domain}/v1/handler.ts` and individual RPC files
1. Register in `api/[[...path]].ts`: add `createServiceRoutes()` call
1. Register in `src/plugins/signal/plugin.js`: add module installer if this domain powers a new Signal element
1. Create `src/plugins/signal/services/{domain}.js` frontend wrapper with circuit breaker
1. Run: `npx tsc --noEmit`

## **4.6 24 Service Domains**

| **Domain** | **Key RPCs** |
| :- | :- |
| aviation | ListAirportDelays, GetNotamClosures |
| climate | ListClimateAnomalies |
| conflict | ListAcledEvents, ListUcdpEvents |
| cyber | ListCyberThreats |
| displacement | ListDisplacementSummary, ListPopulationExposure |
| economic | GetEnergyPrices, GetFredSeries, GetBisPolicyRates, GetBisExchangeRates, GetBisCredit |
| infrastructure | ListInternetOutages, ListServiceStatuses, GetTemporalBaseline |
| intelligence | ClassifyEvent, GetCountryBrief, GetRiskScores, ListSecurityAdvisories, GetSatelliteTles |
| maritime | GetVesselSnapshot, ListNavWarnings |
| market | GetStockQuotes, GetCryptoQuotes, GetCommodityQuotes, GetEtfFlows, GetStablecoinMarkets |
| military | GetAircraftDetails, GetTheaterPosture, GetUsniFleet |
| news | ListFeedDigest, SummarizeArticle |
| prediction | ListPredictionMarkets |
| research | ListArxivPapers, ListTechEvents |
| seismology | ListEarthquakes, GetEarthquakeDetails |
| supply-chain | GetChokepointScores, GetShippingRates, GetMineralConcentration |
| trade | ListTradeRestrictions, GetTariffTrends, GetTradeFlows, GetCustomsRevenue |
| unrest | ListUnrestEvents |
| wildfire | ListFireDetections |
| giving | GetDonationVolumes |
| positive-events | ListPositiveGeoEvents |
| equity (pro) | GetCompanyFinancials, GetAnalystConsensus, GetValuationMetrics |
| webcam | ListWebcams, GetWebcamImage |
| gpsjam | GetGpsJammingHexes |

## **4.7 Cold-Start Optimization**

Split the gateway into 24 per-domain thin entry points (`api/[domain]/v1/[rpc].ts`). Each imports only its own handler. Do NOT use a monolithic gateway that imports all 24 domains. Cold-start drops from ~500ms to sub-100ms.

```typescript
// api/seismology/v1/[[...rpc]].ts  — per-domain thin entry point

import { createSeismologyServiceRoutes } from "../../../src/generated/server/35N/seismology/v1/service_server";
import { seismologyHandler } from "../../../server/35N/seismology/v1/handler";
import { createGateway } from "../../../server/gateway";

export default createGateway(createSeismologyServiceRoutes(seismologyHandler));
```


# **5. Railway Relay Server**

## **5.1 Why a Relay**

Several upstream APIs block Vercel IP ranges or require persistent connections that edge functions cannot maintain: OpenSky (403s without OAuth tokens), AISStream (persistent WebSocket), Telegram (MTProto), OREF (Akamai WAF blocks datacenter TLS fingerprints), ICAO NOTAM, RSS feeds from certain outlets.

## **5.2 Relay Architecture**

```
// scripts/ais-relay.cjs — single Node.js process serving all relay endpoints

Endpoints:
  WS  /              AIS vessel stream → multiplex to browser clients
  GET /opensky       Military aircraft data (OAuth2 Bearer token)
  GET /telegram/feed Telegram OSINT channel messages
  GET /oref          Israel OREF rocket alert history
  GET /rss           Proxied RSS feeds (domain allowlist enforced)
  GET /icao/notam    ICAO NOTAM queries (MENA airports)
  GET /gdelt         GDELT positive events (31s timeout workaround)
  GET /health        Health check (no auth required)
  GET /metrics       Relay metrics (relay auth required)
```

## **5.3 AIS WebSocket — Backpressure**

AISStream delivers hundreds of position reports/second. Without flow control, slow consumers cause unbounded queue growth.

| **Watermark** | **Threshold** | **Action** |
| :- | :- | :- |
| Low | 1,000 messages | Normal — all messages queued |
| High | 4,000 messages | Warning — oldest messages evicted |
| Hard cap | 8,000 messages | Overflow — new messages dropped until queue drains |

Cap total tracked vessels at 20,000 (most recent position per MMSI). Trail history per vessel: 30 points. Density cells: 2°×2° grid, max 5,000 cells.

## **5.4 Relay Auth**

```javascript
// Every non-public endpoint validates x-relay-key header
// Set RELAY_SHARED_SECRET on both Railway AND Vercel — must match exactly

function validateRelayAuth(req) {
  const key = req.headers[process.env.RELAY_AUTH_HEADER || "x-relay-key"];
  if (key !== process.env.RELAY_SHARED_SECRET) return false;
  return true;
}
```

## **5.5 OpenSky OAuth2 Flow**

```javascript
// Token cached 30 min, auto-refreshed

async function getOpenSkyToken() {
  const cached = tokenCache.get("opensky");
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const resp = await fetch("https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.OPENSKY_CLIENT_ID,
      client_secret: process.env.OPENSKY_CLIENT_SECRET,
    })
  });

  const { access_token, expires_in } = await resp.json();
  tokenCache.set("opensky", { token: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 });
  return access_token;
}
```

## **5.6 Telegram MTProto Setup**

One-time session string generation (run locally, paste result into Railway env var):

```bash
npm install telegram
```

```javascript
// scripts/gen-telegram-session.mjs

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import readline from "readline";

const session = new StringSession("");
const client = new TelegramClient(session, parseInt(API_ID), API_HASH, {});

await client.start({
  phoneNumber: async () => /* prompt */,
  password: async () => /* prompt */,
  phoneCode: async () => /* prompt */,
  onError: console.error,
});

console.log("SESSION:", client.session.save());
// Paste output into TELEGRAM_SESSION_STRING on Railway
```

**CRITICAL: The relay connects with a 60-second startup delay to prevent `AUTH_KEY_DUPLICATED` errors during Railway container restarts. The old container must fully disconnect before the new one authenticates.**

## **5.7 OREF Rocket Alert**

Akamai WAF blocks datacenter TLS fingerprints. Must use `curl` via residential Israeli proxy. Node `fetch` will not work.

```javascript
// Poll oref.org.il via curl through residential proxy

const { execSync } = require("child_process");

function fetchOref() {
  const cmd = `curl -s --proxy ${process.env.OREF_PROXY_URL} ` +
    `-H "Referer: https://www.oref.org.il/" ` +
    `-H "X-Requested-With: XMLHttpRequest" ` +
    `"https://www.oref.org.il/WarningMessages/History/AlertsHistory.json"`;
  return JSON.parse(execSync(cmd, { timeout: 10000 }).toString());
}
```


# **6. Upstash Redis + Seed Pipeline**

## **6.1 Three-Tier Cache Pattern**

Every external API call passes through this chain. Implement as `cachedFetchJson()` shared across all handlers.

```
Request
  → [1] In-memory Map (per edge function instance, 60–900s TTL)
  → [2] Upstash Redis (cross-user, cross-instance, 120–900s TTL)
  → [3] Upstream API
         └── on error: serve stale data from cache
```

```typescript
// server/_shared/redis.ts

const inFlight = new Map<string, Promise<any>>();

export async function cachedFetchJson<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T | null> {
  // In-flight dedup — prevents thundering herd on cache miss
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async () => {
    // Check Redis
    const cached = await redis.get(key);
    if (cached && cached !== "__WM_NEG__") return JSON.parse(cached as string);
    if (cached === "__WM_NEG__") return null;

    try {
      const data = await fetchFn();
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      return data;
    } catch (e) {
      // Negative cache: prevent hammering downed API
      await redis.setex(key, 120, "__WM_NEG__");
      return null;
    }
  })();

  inFlight.set(key, promise);
  promise.finally(() => inFlight.delete(key));
  return promise;
}
```

## **6.2 Bootstrap Hydration**

On page load, fire two parallel requests to `/api/bootstrap` to pre-fetch 38 datasets in a single Redis pipeline call. Signal modules call `getHydratedData(key)` on init; if data is present, skip the API call and render immediately.

```javascript
// Fast tier (s-maxage=1200, stale-while-revalidate=300)
FAST_KEYS = [
  "seismology:earthquakes:v1", "infra:outages:v1", "market:stocks-bootstrap:v1",
  "market:commodities-bootstrap:v1", "market:crypto:v1", "correlation:cards-bootstrap:v1",
  "intelligence:advisories-bootstrap:v1", "prediction:markets-bootstrap:v1",
  "news:insights:v1", "aviation:delays-bootstrap:v1", "conflict:iran-events:v1",
]

// Slow tier (s-maxage=7200, stale-while-revalidate=1800)
SLOW_KEYS = [
  "economic:bis-policy:v1", "economic:bis-exchange:v1", "economic:bis-credit:v1",
  "wildfire:fires:v1", "climate:anomalies:v1", "cyber:threats-bootstrap:v2",
  "market:etf-flows:v1", "supply_chain:shipping:v2", "unrest:events:v1",
  "conflict:ucdp-events:v1", "natural:events:v1", "market:gulf-quotes:v1",
  "market:stablecoins:v1", "intelligence:satellites:tle:v1",
]
```

## **6.3 Railway Seed Scripts**

Each seed is a self-contained `.mjs` file. Runs on Node 20+. Writes two keys: a canonical domain key and a bootstrap key. Schedule on Railway as cron services.

| **Seed Script** | **Data Source** | **Interval** | **Bootstrap Key** |
| :- | :- | :- | :- |
| seed-earthquakes.mjs | USGS M4.5+ | 5 min | seismology:earthquakes:v1 |
| seed-market-quotes.mjs | Yahoo Finance (staggered) | 5 min | market:stocks-bootstrap:v1 |
| seed-commodity-quotes.mjs | Yahoo Finance | 5 min | market:commodities-bootstrap:v1 |
| seed-crypto-quotes.mjs | CoinGecko | 5 min | market:crypto:v1 |
| seed-internet-outages.mjs | Cloudflare Radar | 5 min | infra:outages:v1 |
| seed-insights.mjs | Groq LLM world brief | 10 min | news:insights:v1 |
| seed-prediction-markets.mjs | Polymarket Gamma API | 10 min | prediction:markets-bootstrap:v1 |
| seed-unrest-events.mjs | ACLED + GDELT | 15 min | unrest:events:v1 |
| seed-natural-events.mjs | USGS + GDACS + NASA EONETS | 10 min | natural:events:v1 |
| seed-airport-delays.mjs | FAA + AviationStack + ICAO | 10 min | aviation:delays-bootstrap:v1 |
| seed-cyber-threats.mjs | Feodo/URLhaus/OTX/AbuseIPDB | 10 min | cyber:threats-bootstrap:v2 |
| seed-fire-detections.mjs | NASA FIRMS VIIRS | 10 min | wildfire:fires:v1 |
| seed-climate-anomalies.mjs | Open-Meteo ERA5 | 15 min | climate:anomalies:v1 |
| seed-correlation.mjs | Cross-domain engine | 5 min | correlation:cards-bootstrap:v1 |
| seed-iran-events.mjs | LiveUAMap geocoded | 10 min | conflict:iran-events:v1 |
| seed-ucdp-events.mjs | UCDP GED API | 15 min | conflict:ucdp-events:v1 |
| seed-conflict-intel.mjs | ACLED+HAPI+PizzINT+GDELT | 15 min | conflict:acled:v1:all:0:0 |
| seed-forecasts.mjs | Groq LLM + multi-domain | 15 min | forecast:predictions:v2 |
| seed-economy.mjs | EIA + FRED + spending | 15 min | (multiple keys) |
| seed-supply-chain-trade.mjs | FRED + WTO + Treasury | 6 hr | supply\_chain:shipping:v2 |
| seed-security-advisories.mjs | 24 gov RSS feeds | 1 hr | intelligence:advisories-bootstrap:v1 |
| seed-usni-fleet.mjs | USNI News WP-JSON (curl) | 6 hr | usni-fleet:sebuf:v1 |
| seed-gdelt-intel.mjs | GDELT 2.0 Doc API (8 topics) | 1 hr | intelligence:gdelt-intel:v1 |
| seed-satellite-tles.mjs | CelesTrak NORAD TLEs | 2 hr | intelligence:satellites:tle:v1 |
| seed-gpsjam.mjs | GPSJam.org H3 hexes | 6 hr | intelligence:gpsjam:v2 |
| seed-etf-flows.mjs | Yahoo Finance | 15 min | market:etf-flows:v1 |
| seed-gulf-quotes.mjs | Yahoo Finance (GCC markets) | 10 min | market:gulf-quotes:v1 |
| seed-stablecoin-markets.mjs | CoinGecko | 10 min | market:stablecoins:v1 |

## **6.4 Seed Script Pattern**

```javascript
// scripts/seeds/seed-earthquakes.mjs

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function run() {
  const resp = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson");
  const data = await resp.json();
  const normalized = data.features.map(f => ({ /* normalize to proto shape */ }));

  const pipeline = redis.pipeline();
  pipeline.setex("seismology:earthquakes:v1", 1800, JSON.stringify(normalized));
  pipeline.setex("seed-meta:seismology:earthquakes", 604800, JSON.stringify({
    fetchedAt: Date.now(),
    recordCount: normalized.length,
  }));
  await pipeline.exec();

  console.log(`Seeded ${normalized.length} earthquakes`);
}

run().catch(console.error);
```


# **7. Collection Integrations**

## **7.1 Military Flight Tracking (OpenSky)**

Requires Railway relay due to Vercel IP blocks. OpenSky OAuth2 Bearer tokens cached 30 minutes.

| **Step** | **Action** |
| :- | :- |
| 1 | Register at opensky-network.org. Create API client in account settings. |
| 2 | Set `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` on Railway. |
| 3 | Relay implements OAuth2 client credentials flow, caches token 30 min. |
| 4 | Query: `GET https://opensky-network.org/api/states/all?lamin=&lomin=&lamax=&lomax=` with Bearer token. |
| 5 | Enrich via Wingbits API (registration, owner, operator, model). Batch up to 50 aircraft per request. |
| 6 | Classify confidence: Confirmed/Likely/Possible/Civilian based on owner/operator keyword match. |

### **Military Callsign Patterns**

```
TRANSPORT: ["RCH", "REACH", "MOOSE", "HERKY", "EVAC", "DUSTOFF", "SPAR", "BOXER"]
FIGHTER:   ["VIPER", "EAGLE", "RAPTOR", "STRIKE", "SWORD", "DAGGER", "TIGER"]
RECCE:     ["SIGNT", "COBRA", "RIVET", "JSTARS", "AWACS", "COMPASS", "SENIOR"]
TANKER:    ["POLO", "REACH", "DRACO", "ZINC", "SHELL"]
```

## **7.2 AIS Vessel Tracking**

AISStream.io WebSocket. Relay multiplexes one upstream connection to all browser clients.

| **Step** | **Action** |
| :- | :- |
| 1 | Get API key from aisstream.io |
| 2 | Relay maintains persistent WS to `wss://stream.aisstream.io/v0/stream` |
| 3 | Subscribe message: `{ APIKey, BoundingBoxes: [[-90,-180],[90,180]], FiltersShipMMSI: [] }` |
| 4 | On each position update, add to vessel map (key: MMSI, value: latest position) |
| 5 | Cap at 20,000 vessels. Trail per vessel: 30 points. Evict oldest on overflow. |
| 6 | Detect dark ships: >60 min AIS gap in monitored regions → flag for sanctions/military analysis. |
| 7 | Serve snapshot to clients via `GET /ais/snapshot` every 10 seconds. |

## **7.3 GPS Jamming (GPSJam)**

```javascript
// seed-gpsjam.mjs
// Fetches H3 resolution-4 hexes with bad_aircraft_ratio
// Source: https://gpsjam.org/geo.json?lat=33&lon=35&z=4&date=YYYY-MM-DD
```

Classification thresholds:

```
  Low:    0–2%   bad aircraft  →  hidden (too noisy)
  Medium: 2–10%  bad aircraft  →  amber hex on map
  High:   >10%   bad aircraft  →  red hex on map
```

Region tagging (12 zones):

```
  Iran-Iraq, Levant, Ukraine-Russia, Baltic, Mediterranean, Black Sea,
  Arctic, Caucasus, Central Asia, Horn of Africa, Korean Peninsula, South China Sea
```

CII contribution: `min(35, highCount × 5 + mediumCount × 2)` → security component

## **7.4 ACLED Protest/Conflict Data**

```
// ACLED OAuth flow. Do NOT store a static ACLED_ACCESS_TOKEN in env.
// Access tokens expire after 24h; refresh tokens expire after 14 days.
// Store ACLED_USERNAME and ACLED_PASSWORD on the server, mint bearer tokens
// server-side, cache them in memory/Redis, and refresh automatically.

POST https://acleddata.com/oauth/token
  Content-Type: application/x-www-form-urlencoded
  username={ACLED_USERNAME}
  password={ACLED_PASSWORD}
  grant_type=password
  client_id=acled

// Then call the ACLED endpoint with Authorization: Bearer {access_token}

GET https://acleddata.com/api/acled/read?_format=json
  Authorization: Bearer {access_token}
  &event_date={START}|{END}
  &event_date_where=BETWEEN
  &event_type=Protests|Riots|Battles|Explosions/Remote violence|Violence against civilians
  &fields=event_id_cnty|event_date|event_type|sub_event_type|country|latitude|longitude|fatalities|notes
  &limit=5000

// Severity classification:
//   High:   fatalities > 0 OR event_type IN [Riots, Battles]
//   Medium: standard protests/demonstrations
//   Low:    default
```

Implementation notes:

- ACLED collection should run from Railway seed/relay processes, not the browser.
- Cache the OAuth token with an expiry margin and refresh it before expiry.
- Vercel should read ACLED-derived datasets from Redis/bootstrap endpoints rather than holding ACLED credentials in the frontend deployment.

## **7.5 GDELT Integration (Three Uses)**

| **Use** | **Endpoint** | **Purpose** |
| :- | :- | :- |
| Protest events | api.gdeltproject.org/api/v2/geo/geo?query=...&format=GeoJSON | 7-day protest geolocation |
| Topic intelligence | api.gdeltproject.org/api/v2/doc/doc?query=...&mode=artlist | Cyber/Military/Nuclear/Sanctions feeds |
| Tension pairs | Batch GPR API for 6 country pairs | Bilateral tension scores |

*NOTE: GDELT GEO API calls take ~31 seconds sequential. Run from Railway relay on a 15-minute cron, NOT from Vercel edge functions (25s timeout). Write result to Redis. Vercel reads Redis only.*

## **7.6 Cyber Threat IOC Feeds**

| **Feed** | **URL** | **IOC Type** |
| :- | :- | :- |
| Feodo Tracker | feodotracker.abuse.ch/downloads/ipblocklist\_aggressive.json | C2 servers |
| URLhaus | urlhaus-api.abuse.ch/v1/urls/recent/limit/1000 | Malware hosts |
| C2IntelFeeds | raw.githubusercontent.com/montysecurity/C2-Tracker/main/data/all.txt | C2 servers |
| AlienVault OTX | otx.alienvault.com/api/v1/indicators/... | Mixed IOCs |
| AbuseIPDB | api.abuseipdb.com/api/v2/blacklist?limit=10000 | Malicious IPs |
| Ransomware.live | api.ransomware.live/v1/recentvictims | Ransomware ops |

Geo-enrich each IP: ipinfo.io primary, freeipapi.com fallback. Cache results 24h. 16 parallel lookups, 12s timeout, max 250 IPs per run.

## **7.7 Satellite TLE Tracking**

```javascript
// seed-satellite-tles.mjs
// Fetch from CelesTrak — two groups

const GROUPS = [
  "https://celestrak.org/SOCRATES/query.php?GROUP=military&FORMAT=json",
  "https://celestrak.org/SOCRATES/query.php?GROUP=resource&FORMAT=json",
];

// Filter patterns for intelligence-relevant satellites:
const INCLUDE = [
  /YAOGAN/, /GAOFEN/, /JILIN/,         // Chinese recon
  /COSMOS 24\d\d/, /COSMOS 25\d\d/,   // Russian recon
  /COSMO-SKYMED/, /TERRASAR/, /PAZ/,   // Commercial SAR
  /WORLDVIEW/, /SKYSAT/, /PLEIADES/,   // Commercial optical
  /SENTINEL/,                          // EU SAR/optical
];

// In browser: satellite.js SGP4 propagation every 3 seconds
// initSatRecs() once → propagatePositions() every 3s
// Each satellite: lat/lng/altitude + 15-point trail + ground footprint
```

## **7.8 OREF Rocket Alerts (Israel)**

```javascript
// 1,480 Hebrew → English location translations
// Source: pikud-haoref-api/cities.json
// History bootstrap (two-phase):
//   Phase 1: Load from Redis (filter entries older than 7 days)
//   Phase 2: If Redis empty, fetch from OREF API with exponential backoff
//            (3 attempts, delays 3s/6s/12s + jitter)
// Live polling: every 5 minutes via curl through residential proxy
// CII integration:
//   Active alerts → Israel conflict component + min(25, alertCount × 5) up to +50
//   24h history:  3–9 alerts → +5, 10+ alerts → +10 blend boost
// Wave detection: group siren records by timestamp within 5-minute windows
```

## **7.9 Prediction Markets (Polymarket)**

Polymarket uses Cloudflare JA3 TLS fingerprint blocking. All server-side Node.js requests are blocked. Use this 4-tier fetch chain:

1. Bootstrap hydration — Redis cache (`prediction:markets-bootstrap:v1`). Zero network if fresh (<20 min).
1. Sebuf RPC — reads Redis. Sub-100ms.
1. Browser-direct fetch — browser TLS fingerprint passes Cloudflare. Always works.

*NOTE: Never proxy Polymarket through Node.js on Vercel. It will 403. Browser-direct is the primary path.*


# **8. Intelligence Engine**

## **8.1 Country Instability Index (CII)**

### **Score Formula**

```
finalScore = baseline × 0.40 + eventScore × 0.60

baseline = per-country static risk (0–50). See COUNTRY_BASELINES config.

eventScore = blend of 4 components:
  unrest      × 0.25
  conflict    × 0.30
  security    × 0.20
  information × 0.25

─── UNREST SCORE (0–100) ───────────────────────────────────

// Democracy detection: multiplier < 0.7 = democratic
if (isDemocracy) {
  base = min(50, log2(protestCount + 1) × 12);  // log dampening
} else {
  base = min(50, protestCount × 8);              // linear
}

fatalityBoost  = min(30, totalFatalities × 5);
outageBoost    = severity === "TOTAL" ? 30 : severity === "MAJOR" ? 15 : 5; // capped 50
unrest         = min(100, base + fatalityBoost + outageBoost);

─── CONFLICT SCORE (0–100) ─────────────────────────────────

acledWeighted  = battles×3 + explosions×4 + civilianViolence×5; // capped 50
fatalityScore  = min(40, sqrt(acledFatalities) × 4);
civilianBoost  = min(10, civilianEvents × 2);
iranStrikeBoost = iranStrikeSeverity × weight;  // up to 50
orefBoost      = isIsrael ? (25 + min(25, activeAlertCount × 5)) : 0;
conflict       = min(100, acledWeighted + fatalityScore + civilianBoost + iranStrikeBoost + orefBoost);

─── SECURITY SCORE (0–100) ─────────────────────────────────

jammingScore   = min(35, highHexCount × 5 + mediumHexCount × 2);
security       = jammingScore;  // GPS jamming only for now

─── FLOORS ─────────────────────────────────────────────────

if (ucdpIntensity >= 2) finalScore = max(finalScore, 70);  // active war
if (ucdpIntensity === 1) finalScore = max(finalScore, 50); // minor conflict
if (advisoryLevel === DNT) finalScore = max(finalScore, 60);
if (advisoryLevel === RECONSIDER) finalScore = max(finalScore, 50);

─── SUPPLEMENTAL BOOSTS ────────────────────────────────────

advisoryBoost  = { DNT: 15, RECONSIDER: 10, CAUTION: 5 }[advisory] ?? 0;
orefBlendBoost = isIsrael && activeAlerts > 0 ? 15 + (history24h >= 10 ? 10 : history24h >= 3 ? 5 : 0) : 0;
climateBoost   = min(15, climateSeverityScore × 3);
cyberBoost     = min(10, cyberThreatCount × 0.5);
fireBoost      = min(8, activeFireCount × 0.2);
```

### **24 Tier 1 Countries**

| **Country** | **Baseline** | **Multiplier** | **Notes** |
| :- | :- | :- | :- |
| Syria | 50 | 0\.7 | Active civil war floor: 50 |
| Ukraine | 50 | 0\.7 | Active war floor: 55 |
| Yemen | 50 | 0\.7 | Active civil war floor: 50 |
| Myanmar | 45 | 0\.8 | Coup + civil conflict |
| North Korea | 45 | 3\.0 | Any protest is exceptional |
| Cuba | 45 | 2\.5 | Authoritarian suppression |
| Iran | 40 | 2\.0 | Regional flashpoint |
| Israel | 40 | 0\.7 | Active Gaza conflict + OREF integration |
| Pakistan | 38 | 1\.5 | Nuclear + insurgency |
| Venezuela | 38 | 1\.8 | Economic collapse + suppression |
| Russia | 35 | 2\.5 | Active war theater, authoritarian |
| China | 30 | 2\.5 | Any protest highly significant |
| Saudi Arabia | 30 | 2\.0 | Authoritarian, regional power |
| Taiwan | 28 | 1\.8 | Cross-strait tensions |
| Turkey | 25 | 1\.2 | Regional instability |
| India | 25 | 1\.0 | Large democracy, occasional unrest |
| Mexico | 25 | 1\.1 | Organized crime + political |
| Brazil | 20 | 0\.8 | Democratic, routine protests |
| UAE | 15 | 2\.0 | Authoritarian, low unrest expected |
| Poland | 10 | 0\.8 | NATO frontline, democratic |
| Germany | 8 | 0\.7 | Democratic, media-heavy |
| France | 8 | 0\.7 | Democratic, routine protests |
| UK | 8 | 0\.7 | Democratic, media-heavy |
| United States | 8 | 0\.6 | Democratic, massive news volume |


## **8.2 Geographic Convergence Detection**

```typescript
// 1°×1° geographic cells, 24-hour window
// 4 event types tracked: protests, military_flights, vessels, earthquakes

interface GeoCell {
  cellKey: string;  // "${floor(lat)}_${floor(lon)}"
  eventTypes: Set<string>;
  events: GeoEvent[];
  lastUpdated: number;
}

// Scoring:
typeScore  = eventTypes.size × 25;   // max 100 (4 types)
countBoost = min(25, totalEvents × 2);
score      = min(100, typeScore + countBoost);

// Alert thresholds:
//   score >= 80  AND eventTypes.size >= 4 → CRITICAL
//   score >= 60  AND eventTypes.size >= 3 → HIGH
//   score >= 40  AND eventTypes.size >= 3 → MEDIUM

// Fire alert when convergence detected, 2-hour cooldown per cell
// Reverse-geocode via hotspot/conflict/waterway name databases
```

## **8.3 Strategic Risk Score**

```
compositeScore =
  convergenceScore × 0.30
  + ciiRiskScore   × 0.50
  + infraScore     × 0.20
  + theaterBoost   (0–25)
  + breakingBoost  (0–15)

convergenceScore = min(100, convergenceAlertCount × 25)

ciiRiskScore = weighted average of top-5 CII countries
  weights = [0.40, 0.25, 0.20, 0.10, 0.05]
  bonus   = min(20, countriesAbove50 × 5)

infraScore = min(100, cascadeAlertCount × 25)

theaterBoost = Σ theaters:
  min(10, floor((aircraft + vessels) / 5)) + (strikeCapable ? 5 : 0)
  capped at 25. Halved if posture data is stale.

breakingBoost = critical alerts +15, high alerts +8, capped 15, expires 30 min

Trend: delta ≥ +3 = escalating, ≤ -3 = de-escalating, else stable

Suppress CII spike alerts for 15 minutes after module init (learning period)
```

## **8.4 Cross-Domain Signal Correlation Engine**

Runs every refresh cycle. Compares current state to previous snapshot. Emits typed signals with confidence scores.

| **Signal Type** | **Detection Logic** | **Cooldown** |
| :- | :- | :- |
| prediction\_leads\_news | Polymarket prob shift >5% with no matching headlines | 2 hr |
| news\_leads\_markets | News velocity spike before equity price move 15–60 min | 2 hr |
| silent\_divergence | Market moves ≥2% with no correlated news after entity search | 6 hr |
| velocity\_spike | News cluster sources/hr ≥6 from Tier 1–2 | 30 min |
| keyword\_spike | Trending term ≥3× 7-day baseline, ≥2 source diversity | 30 min |
| convergence | 3+ signal types in same 1°×1° cell | 2 hr |
| triangulation | Same entity in news + military tracking + market signals | 2 hr |
| flow\_drop | Pipeline disruption keywords detected | 6 hr |
| flow\_price\_divergence | Flow drop news + oil price stable (<$1.50 move) | 6 hr |
| hotspot\_escalation | Multi-component score threshold + rising trend | 2 hr |
| military\_surge | Theater 2× baseline, transport ≥5, fighters ≥4 | 2 hr |
| sector\_cascade | Multiple same-sector equities move same direction | 30 min |
| explained\_market\_move | Market ≥2% + matching news cluster causal keywords | 6 hr |
| geo\_convergence | Convergence alert from spatial binning system | 2 hr |

## **8.5 Focal Point Detector**

```
FocalScore = NewsScore + SignalScore + CorrelationBonus

NewsScore (0–40):
  base     = min(20, mentionCount × 4)
  velocity = min(10, newsVelocity × 2)
  conf     = avgConfidence × 10

SignalScore (0–40):
  types    = signalTypes.size × 10
  count    = min(15, signalCount × 3)
  severity = highSeverityCount × 5

CorrelationBonus (0–20):
  +10 if entity in BOTH news AND signals
  +5  if news keywords match signal types (e.g., "military" + military_flight)
  +5  if related entities also have signals

Urgency:
  score > 70 OR signalTypes ≥ 3  → CRITICAL (red)
  score > 50 OR signalTypes ≥ 2  → ELEVATED (orange)
  default                         → WATCH (yellow)
```

66 entities in registry. Types: company(38), country(11), index(3), commodity(6), sector(5), crypto(3)


# **9. AI / ML Pipeline**

## **9.1 LLM Provider Chain**

4-tier fallback. Never blocks UI. Keyword classifier runs instantly; LLM refines async.

| **Tier** | **Provider** | **Model** | **Condition** |
| :- | :- | :- | :- |
| 1 | Ollama / LM Studio | Auto-discovered local model | `OLLAMA_API_URL` configured |
| 2 | Groq | Llama 3.1 8B (temp 0.3) | `GROQ_API_KEY` configured |
| 3 | OpenRouter | Multi-model fallback | `OPENROUTER_API_KEY` configured |
| 4 | Browser T5 (ONNX) | T5-small via Transformers.js | Always available |

## **9.2 Threat Classification Pipeline**

Every news item passes through 3 stages. UI never waits — keyword result shown immediately, ML and LLM refine async.

1. Keyword classifier (instant) — ~120 keywords, 14 categories, 4 severity tiers. Word-boundary regex to prevent "war" matching "award". Source: `keyword`.
1. Browser ML (async) — Transformers.js NER + sentiment + topic. No API call. Source: `ml`.
1. LLM classifier (batched async) — collect into batch queue, fire parallel `classifyEvent` RPCs. Groq Llama 3.1 8B at temp 0. Redis cache 24h per headline hash. LLM result overrides keyword ONLY if confidence higher. Source: `llm`.

*NOTE: LLM classifier auto-pauses queue on 500-series errors with exponential backoff. Prevents wasting API quota during outages.*

## **9.3 World Brief Generation**

```javascript
// src/services/summarization.ts
// 1. Collect top headlines (scored by importance algorithm)
// 2. Deduplicate by Jaccard similarity > 0.6 — reduces prompt 20–40%
// 3. Attempt Tier 1 → 2 → 3 → 4 in sequence
// 4. Cache in Redis: summary:v3:{mode}:{variant}:{lang}:{headlineHash}  TTL: 24h
//    → 1,000 concurrent users trigger exactly ONE LLM call

const SYSTEM_PROMPT = `You are a senior signals intelligence analyst.
Produce a 3-paragraph situation brief covering: (1) most significant
military/conflict developments, (2) geopolitical shifts, (3) economic
warfare indicators. No hedging. Direct assessment. Cite source names.`;

// Temperature: 0.3 (analytic consistency)
// Max tokens: 1,500
// Strip chain-of-thought <think> tags from response
```

## **9.4 Headline Scoring Algorithm**

| **Category** | **Base Score** | **Per-Match Bonus** | **Keywords** |
| :- | :- | :- | :- |
| Violence | +100 | +25 | killed, dead, casualty, massacre, crackdown, airstrike |
| Military | +80 | +20 | war, invasion, missile, troops, combat, deployment, fleet |
| Unrest | +40 | +15 | protest, uprising, coup, riot, revolution, martial law |
| Flashpoint | — | +20 | iran, russia, china, taiwan, ukraine, north korea, hamas, nato |
| Crisis | — | +10 | sanctions, escalation, breaking, urgent, humanitarian |
| Demotion | — | -15 | CEO, earnings, stock, revenue, startup, streaming, celebrity |

## **9.5 Browser-Side ML (ONNX Runtime Web)**

```bash
npm install @xenova/transformers onnxruntime-web
```

```javascript
// Models (loaded on-demand, cached in IndexedDB after first download):
//   sentence-similarity  — all-MiniLM-L6-v2 (384-dim embeddings)
//   threat-classifier    — custom fine-tuned DistilBERT
//   T5-small             — summarization fallback (~60MB)

// Capability detection cascade:
//   1. WebGPU (navigator.gpu)  — fastest, Chrome 113+
//   2. WebGL                   — GPU via compute shaders
//   3. WASM + SIMD             — CPU fallback

// Guard: skip ML entirely on devices with deviceMemory < 4GB
// Disabled on mobile automatically

// All inference in dedicated Web Worker:
//   src/workers/analysis.worker.ts
//   30-second timeout per request
//   Auto-cleanup on errors
```

## **9.6 Keyword Spike Detection**

```javascript
// Every RSS headline tokenized into terms
// 2-hour rolling window vs 7-day baseline (refreshed hourly)
// Spike fires when ALL conditions met:
//   absolute count > 5 mentions
//   current count > baseline × 3
//   source diversity >= 2 unique RSS feeds
//   30-minute cooldown since last spike for this term

// Special tokenization:
//   CVE identifiers: CVE-\d{4}-\d+
//   APT/FIN designators: APT\d+, FIN\d+
//   Compound world leader names: "Xi Jinping", "Kim Jong Un" (12 entries)

// Term registry capped at 10,000 entries, LRU eviction
// Detected spikes auto-summarized via Groq (rate-limited 5/hour)
```


# **10. Convex — Auth, Schema & Billing**

## **10.1 First-Time Convex Setup**

```bash
npm install convex
npx convex login
npx convex init        # creates .env.local with CONVEX_URL
npx convex deploy      # push schema + functions
```

## **10.2 Schema**

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId:          v.string(),
    email:            v.string(),
    name:             v.string(),
    stripeCustomerId: v.optional(v.string()),
    referralCode:     v.string(),
    referralCount:    v.number(),
    createdAt:        v.number(),
    updatedAt:        v.number(),
  })
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"])
  .index("by_stripe", ["stripeCustomerId"])
  .index("by_referral", ["referralCode"]),

  subscriptions: defineTable({
    userId:               v.id("users"),
    stripeSubscriptionId: v.string(),
    product:              v.union(v.literal("pro"), v.literal("api_starter"), v.literal("api_business")),
    status:               v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("trialing")),
    currentPeriodStart:   v.number(),
    currentPeriodEnd:     v.number(),
    cancelAtPeriodEnd:    v.boolean(),
    createdAt:            v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_stripe_id", ["stripeSubscriptionId"]),

  entitlements: defineTable({
    userId:         v.id("users"),   // unique constraint enforced in mutation
    dashboardTier:  v.union(v.literal("free"), v.literal("pro")),
    apiTier:        v.union(v.literal("none"), v.literal("starter"), v.literal("business")),
    rateLimitTier:  v.string(),
    features:       v.array(v.string()),
    derivedFrom:    v.array(v.id("subscriptions")),
    computedAt:     v.number(),
  })
  .index("by_user", ["userId"]),

  stripeEvents: defineTable({
    eventId:     v.string(),
    processedAt: v.number(),
    eventType:   v.string(),
  })
  .index("by_event_id", ["eventId"]),

  apiKeys: defineTable({
    userId:    v.id("users"),
    keyHash:   v.string(),    // SHA-256 only — never store plaintext
    prefix:    v.string(),    // first 8 chars for UI display
    name:      v.string(),
    scopes:    v.array(v.string()),
    tier:      v.union(v.literal("starter"), v.literal("business")),
    expiresAt: v.optional(v.number()),
    lastUsedAt:v.optional(v.number()),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_hash", ["keyHash"]),

  usage: defineTable({
    apiKeyId:  v.id("apiKeys"),
    date:      v.string(),    // YYYY-MM-DD
    endpoint:  v.string(),
    count:     v.number(),
  })
  .index("by_key_date", ["apiKeyId", "date"]),

  auditLog: defineTable({
    userId:   v.id("users"),
    action:   v.string(),
    resource: v.string(),
    metadata: v.any(),
    ip:       v.optional(v.string()),
    createdAt:v.number(),
  })
  .index("by_user", ["userId"]),

  registrations: defineTable({
    email:           v.string(),
    normalizedEmail: v.string(),
    registeredAt:    v.number(),
    source:          v.optional(v.string()),
    appVersion:      v.optional(v.string()),
  })
  .index("by_normalized_email", ["normalizedEmail"]),
});
```

## **10.3 Stripe Webhook Handler**

Implement as Convex HTTP action. All 5 events must be idempotent. Always reconcile from Stripe object — do not use forward-only state machine.

| **Event** | **Action** |
| :- | :- |
| checkout.session.completed | Create subscription record, link to user, call `recomputeEntitlements()` |
| invoice.paid | Update `currentPeriodEnd` on subscription |
| invoice.payment\_failed | Set status to `past_due`, send warning email via Resend |
| customer.subscription.updated | Call `stripe.subscriptions.retrieve()` and reconcile full object |
| customer.subscription.deleted | Set status to `canceled`, call `recomputeEntitlements()` |

```javascript
// convex/stripe-webhook.ts (HTTP action)
// CRITICAL: Check stripeEvents table by event.id before processing
//           Duplicate events must be idempotent — no double processing
// CRITICAL: Every subscription change → recomputeEntitlements(userId)
//           AND delete Redis cache key: ent:{userId}
//           Cache invalidation must be ACTIVE (immediate delete), not passive (TTL)
```

## **10.4 Entitlement Gating in Gateway**

```typescript
// server/gateway.ts — inject after validateApiKey()

async function checkEntitlement(userId: string, endpoint: string) {
  // 1. Check Redis cache: ent:{userId}  TTL: 60s
  const cached = await redis.get(`ent:${userId}`);
  if (cached) return JSON.parse(cached as string);

  // 2. Cache miss → query Convex
  const ent = await convex.query(api.entitlements.getByUserId, { userId });

  // 3. Populate cache
  await redis.setex(`ent:${userId}`, 60, JSON.stringify(ent));
  return ent;
}

// Fail-closed: if BOTH Redis AND Convex unavailable → return 503
// Never grant access when entitlement system is down
// 403 response format:
// { error: "Upgrade required", requiredPlan: "pro", upgradeUrl: "/pro" }
```


# **11. CORS Configuration**

Two parallel implementations — one for standalone edge functions, one for sebuf gateway. Both use same allowlist.

```
// Allowed origin patterns (both api/_cors.js and server/cors.ts):

(*.)?35n.app                     // Production + subdomains
35n-*-elie-*.vercel.app          // Vercel preview deploys
localhost:*                      // Local dev
127.0.0.1:*                      // Local dev

// Requests with NO Origin header (server-to-server, curl) → allowed through
// isDisallowedOrigin() only blocks when origin is present AND not on allowlist

// Allowed request headers:
// Content-Type, Authorization, X-35N-Key

// Every response (including errors, 429s, 500s) must include CORS headers
// Preflight OPTIONS must return 204 with CORS headers, no body
```


# **12. Health Endpoints**

## **12.1 /api/health**

Public. No auth. Checks all 57 Redis-backed data keys in a single pipeline call.

| **HTTP Status** | **Overall Status** | **Meaning** |
| :- | :- | :- |
| 200 | HEALTHY | All checks OK |
| 200 | WARNING | Some keys stale or on-demand keys empty |
| 503 | DEGRADED | 1–3 bootstrap keys empty |
| 503 | UNHEALTHY | 4+ bootstrap keys empty |
| 503 | REDIS\_DOWN | Cannot connect to Redis |

## **12.2 /api/seed-health**

Auth required. Checks only `seed-meta:*` keys without fetching data payloads. Use for debugging stale seeds.

## **12.3 Staleness Thresholds**

| **Domain** | **Max Stale (min)** | **Notes** |
| :- | :- | :- |
| Market quotes, crypto, sectors | 30 | High-frequency |
| Earthquakes, unrest, insights | 30 | Critical event data |
| Predictions | 15 | Fast-moving |
| Military flights | 15 | Near-real-time |
| Flight delays (FAA) | 60 | Airport delay snapshots |
| Wildfires, climate | 120 | Slower-moving |
| Cyber threats | 480 | APT data less frequent |
| Satellites (TLE) | 180 | Survives 1 missed 2h cycle |
| GPS jamming | 720 | 6h cycle × 2 |
| BIS data, World Bank | 2880–10080 | Weekly/monthly releases |


# **13. Deployment**

## **13.1 Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Set all environment variables (see Phase 2.4)
vercel env add GROQ_API_KEY production
# ... repeat for all required vars

# Deploy
vercel --prod

# Verify domain
# 35n.app + subdomains: tech.35n.app, finance.35n.app, commodity.35n.app, happy.35n.app
# All served from single Vercel deployment — variant determined by hostname
```

## **13.2 Railway**

```bash
# Deploy relay server
railway init
railway link

# Set environment variables on Railway dashboard:
# AISSTREAM_API_KEY, RELAY_SHARED_SECRET, OPENSKY_CLIENT_ID, etc.

# Deploy relay
railway up

# Add seed cron services (one per seed script)
# In Railway dashboard: New Service → Cron
# Command: node scripts/seeds/seed-earthquakes.mjs
# Schedule: */5 * * * *  (every 5 minutes)
# Repeat for each seed at its configured interval
```

## **13.3 Cloudflare R2 (Static Map Assets)**

```bash
# Create bucket: 35n-maps
# Set custom domain: maps.35n.app (CF-proxied)
# Upload large static files:
rclone copyto public/data/countries.geojson r2:35n-maps/countries.geojson
rclone copyto public/data/country-boundary-overrides.geojson r2:35n-maps/country-boundary-overrides.geojson

# PMTiles (optional self-hosted vector tiles):
# Download from protomaps.com/builds
# Upload to r2:35n-maps/planet.pmtiles (range-request capable)
# Set __SIGNAL_PMTILES_URL__="https://maps.35n.app/planet.pmtiles" via webpack DefinePlugin

# CORS rules on R2: must list each origin explicitly
# Wildcard subdomains NOT supported by R2
# List: https://35n.app, https://tech.35n.app, https://finance.35n.app, etc.
```

## **13.4 Variant-Specific Dev Commands**

```bash
npm run start             # local Open MCT dev server
npm run build:dev         # local dev bundle
npm run build:prod        # production bundle
```


# **14. Static Data Files to Build or Source**

These datasets must be compiled and stored in `src/config/` before the map layers will work:

| **File** | **Records** | **Source / Method** |
| :- | :- | :- |
| bases-expanded.ts | 226 military bases | Manually compiled from open sources. Fields: name, lat, lng, country, operator, type |
| cables.ts | 86 undersea cables | TeleGeography free data (telegeography.com/data/submarine-cable) |
| pipelines.ts | 88 oil/gas pipelines | Manually compiled. Includes multi-segment GeoJSON paths |
| ports.ts | 62 strategic ports | Manually compiled. Fields: name, lat, lng, type, throughput, criticality (0–1) |
| airports.ts | 111 airports | IATA data + manual. 5 regions: Americas, Europe, APAC, MENA, Africa |
| nuclear-facilities.ts | 100+ sites | IAEA PRIS database + public sources. Types: power, weapons, enrichment, research |
| irradiators.ts | Category 1–3 | IAEA tracking data (public). Fields: name, lat, lng, category, material |
| ai-datacenters.ts | 313 clusters | Epoch AI dataset (epochai.org/data/notable-ai-models) |
| spaceports.ts | 12 sites | Manually compiled. Operators: NASA, SpaceX, Roscosmos, CNSA, ESA, ISRO, JAXA |
| minerals.ts | Key mining sites | USGS + manual. Types: lithium, cobalt, rare\_earths. Fields: operator, production, country |
| hotspots.ts | 30+ hotspots | Manually defined. Fields: id, name, lat, lng, keywords[], agencies[], baselineRisk (1–5) |
| conflicts.ts | Active conflicts | Manually compiled from UCDP + ACLED. Updated periodically. |
| waterways.ts | 13 chokepoints | Manually compiled. Fields: name, lat, lng, significance, dependent\_countries[] |
| trade-routes.ts | 19 routes | Manually compiled multi-segment GeoJSON arcs. Types: container, energy, bulk |
| entities.ts | 66 entities | Manually compiled. Types: company, country, index, commodity, sector, crypto |
| feeds.ts | 344+ RSS feeds | Manually curated. Fields: url, name, tier (1–4), category, propagandaRisk, stateAffiliated |
| geo.ts | 217 hubs | Capitals + conflict zones + chokepoints for news geo-location inference |


# **15. Error Tracking & Production Hardening**

## **15.1 Sentry Setup**

```bash
npm install @sentry/browser
```

```javascript
// src/plugins/signal/plugin.js

Sentry.init({
  dsn: __SIGNAL_SENTRY_DSN__,
  environment: __OPENMCT_BUILD_BRANCH__ === "master" ? "production" : "development",
  release: `35n@${__OPENMCT_VERSION__}`,
  tracesSampleRate: 0.1,  // 10% of transactions
  beforeSend(event) {
    // Suppress known unactionable errors
    if (event.message?.length === 1) return null;  // minification artifacts
    const stack = event.exception?.values?.[0]?.stacktrace?.frames;
    if (stack?.some(f => f.filename?.includes("chrome-extension:"))) return null;
    if (stack?.some(f => f.filename?.includes("moz-extension:"))) return null;
    return event;
  }
});

// Chunk reload guard (handles stale assets after deployment):
window.addEventListener("error", (event) => {
  const message = String(event?.message || "");
  if (!message.includes("ChunkLoadError") && !message.includes("Loading chunk")) return;
  if (!sessionStorage.getItem("reloaded")) {
    sessionStorage.setItem("reloaded", "1");
    location.reload();
  }
});
```

## **15.2 Circuit Breaker Pattern**

```typescript
// src/utils/circuit-breaker.ts

export class CircuitBreaker<T> {
  private failures = 0;
  private openUntil = 0;
  private lastGood: T | null = null;

  constructor(
    private readonly name: string,
    private readonly maxFailures = 2,
    private readonly cooldownMs = 300_000  // 5 min
  ) {}

  async execute(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (Date.now() < this.openUntil) {
      return this.lastGood ?? fallback;
    }

    try {
      const result = await fn();
      this.failures = 0;
      this.lastGood = result;
      return result;
    } catch (e) {
      this.failures++;
      if (this.failures >= this.maxFailures) {
        this.openUntil = Date.now() + this.cooldownMs;
        console.warn(`[${this.name}] Circuit open for ${this.cooldownMs/1000}s`);
      }
      return this.lastGood ?? fallback;
    }
  }
}
```


# **16. Build Order Checklist**

Follow this order. Each checkbox must pass before proceeding.

### **Phase 1: Foundation**

1. repo init, Makefile, buf install, `make install` passes
1. Directory structure created (`proto/`, `server/`, `src/generated/`, etc.)
1. `.env` files configured with all required vars
1. `src/plugins/signal/plugin.js` installs cleanly and `npm run start` serves Open MCT locally

### **Phase 2: Frontend Shell**

1. Signal Vue module renders through Open MCT view provider
1. `useSignalPolling` tested with a single mock module
1. Flat map renders (deck.gl + MapLibre, OpenFreeMap tiles)
1. Layer registry wired — toggling a layer shows/hides
1. Signal object can be created from Create menu and opened in view

### **Phase 3: API Gateway**

1. First proto defined (`seismology/v1`), `make generate` passes
1. First handler implemented, `npx tsc --noEmit` passes
1. Vercel dev server serves the endpoint
1. Frontend client calls endpoint and receives data
1. CORS headers correct — browser request succeeds

### **Phase 4: Railway Relay**

1. `ais-relay.cjs` starts locally on port 3004
1. `/health` endpoint returns `{status: "ok"}`
1. AIS WebSocket connects to AISStream and receives messages
1. OpenSky OAuth2 token obtained and cached
1. Relay auth (`x-relay-key`) rejects unauthorized requests

### **Phase 5: Redis + Seeds**

1. Upstash Redis connected from both Vercel and Railway
1. `cachedFetchJson()` working with in-flight deduplication
1. `seed-earthquakes.mjs` writes to Redis and health check shows OK
1. Bootstrap endpoint returns hydration data in single pipeline call
1. Signal module reads hydration cache and skips initial API call

### **Phase 6: Core Collection**

1. Conflicts layer — data rendering on map
1. Military flights layer — OpenSky data via relay
1. AIS vessels layer — WebSocket updating in real time
1. GPS jamming layer — hex cells rendering
1. ACLED protests — dual-source with Haversine dedup
1. Internet outages — Cloudflare Radar data
1. Satellite TLE layer — SGP4 propagation on globe

### **Phase 7: Intelligence Engine**

1. CII scoring computing for all 24 countries
1. Geographic convergence firing alerts when conditions met
1. Strategic Risk score updating from CII + convergence + infrastructure
1. Focal point detector identifying cross-domain entities
1. Signal correlation engine emitting typed signals

### **Phase 8: AI/ML**

1. Keyword classifier running on all incoming news items
1. Groq LLM classifier batching and updating confidence
1. World Brief generating via summarization chain
1. Browser ONNX models loading and running in Web Worker

### **Phase 9: Auth + Billing**

1. Convex schema deployed, all tables created
1. Clerk webhook creates user in Convex on signup
1. Stripe Checkout flow creates subscription and fires webhook
1. Webhook handler recomputes entitlements and invalidates Redis cache
1. Gateway enforces entitlements — free user gets 403 on pro endpoint
1. Pro user gets 200 on same endpoint

### **Phase 10: Deployment**

1. Vercel deployment live at 35n.app
1. Railway relay live and connected
1. All Railway cron seeds running on schedule
1. `/api/health` returns HEALTHY
1. OG images generating correctly per variant


# **Appendix: Key File Reference**

| **File** | **Purpose** |
| :- | :- |
| src/plugins/signal/plugin.js | Open MCT Signal plugin entry point. Registers type, providers, and Vue views |
| src/plugins/signal/views/SignalView.vue | Primary Signal module view. Reactive rendering and interaction |
| src/plugins/signal/services/useSignalPolling.js | Shared polling composable for Signal modules |
| src/components/DeckGLMap.ts | Flat map (deck.gl + MapLibre). Layer system, clustering, CII choropleth |
| src/components/GlobeMap.ts | Globe map (globe.gl + Three.js). Markers, polygons, satellite trails |
| src/plugins/signal/views/SignalMapView.vue | Signal map module. Routes to flat/globe map integration |
| src/utils/circuit-breaker.ts | Circuit breaker. Max failures → cooldown → stale data fallback |
| src/services/country-instability.ts | CII scoring algorithm. All 24 country configs, floor/boost logic |
| src/services/geo-convergence.ts | Geographic convergence detection. 1°×1° grid, event type diversity |
| src/services/signal-aggregator.ts | Central signal collection. Groups by country, detects regional convergence |
| src/services/focal-point-detector.ts | Cross-domain entity correlation. News + military + market + protest |
| src/services/cross-module-integration.ts | Strategic risk score. Alert fusion. 2h/200km deduplication |
| src/services/correlation.ts | 14-signal cross-stream correlation engine |
| src/services/summarization.ts | 4-tier LLM chain. Deduplicate → Ollama → Groq → OpenRouter → T5 |
| src/workers/analysis.worker.ts | Web Worker. Jaccard clustering, ML inference, entity extraction |
| src/config/map-layer-definitions.ts | Single registry for all 49 layer definitions |
| src/config/entities.ts | 66-entity knowledge base for market-news correlation |
| server/gateway.ts | Shared gateway logic: CORS, auth, entitlement check, error boundary |
| server/\_shared/redis.ts | `cachedFetchJson()` with in-flight dedup and negative caching |
| scripts/ais-relay.cjs | Railway relay. AIS WS, OpenSky, Telegram, OREF, RSS proxy |
| convex/schema.ts | Full DB schema: users, subscriptions, entitlements, apiKeys, usage, audit |
