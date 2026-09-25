# Verification Telemetry Example

This example plugin visualizes verification and provenance event streams in Open MCT.

It treats proof reports, replay reports, lineage events, semantic packet binding, witness
receipts, and mutation rejection as telemetry. The included fixture is static sample data;
the plugin does not verify artifacts cryptographically and does not add any proof-system
runtime dependency.

## Install In A Local Open MCT App

```js
openmct.install(openmct.plugins.example.VerificationTelemetryPlugin());
```

The plugin adds a `Verification Telemetry` root object with a sample capsule and an event
stream. Open the `Verification Timeline` view to inspect the events.

## Data Boundary

The example displays verification reports as telemetry. It distinguishes:

- core verification state;
- replay state;
- lineage events;
- semantic packet binding;
- witness observations;
- mutation rejection;
- display-only scope notes.

Semantic packet data can explain a verified core state, but it does not alter core proof identity.

## Fixture Schema

Each event includes:

```json
{
  "timestamp": 1780000000000,
  "event_id": "evt_000001",
  "event_type": "core_verified",
  "layer": "core",
  "status": "valid",
  "artifact": "sample.phm",
  "artifact_digest": "sha256:...",
  "capsule_id": "phm_sample",
  "branch_id": "branch_main",
  "replay_fingerprint": "sha256:...",
  "packet_digest": null,
  "witness_id": null,
  "mutation_id": null,
  "summary": "Core verification report completed.",
  "details": {},
  "severity": "nominal"
}
```

The adapter exposes both human-readable fields and numeric fields for plotting:

- `status_code`
- `layer_code`
- `severity_code`

## Current Validation Commands

Use the current Open MCT scripts:

```bash
npm test
npm run test:e2e:ci
npm run test:e2e:visual:ci
npm run test:perf:contract
```

For a smaller local check during development:

```bash
npm run lint:js
npm run lint:vue
npm run lint:spelling
```
