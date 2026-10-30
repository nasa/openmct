# AGENTS.md

Guidance for AI coding assistants (Claude Code, Gemini CLI, and other agentic tools)
working in this repository.

**Human contributors:** start with [CONTRIBUTING.md](CONTRIBUTING.md) instead. This file
adds no policy of its own — it orients an agent and routes it to the canonical docs below.

`CLAUDE.md` and `GEMINI.md` exist only so that tools which look for a vendor-specific
filename find this file. They contain a single import line and no content. Support for
another tool is one more one-line file; no assistant gets privileged instructions.

## Where the canonical docs live

Read the relevant document before working in that area rather than inferring conventions
from surrounding code. Do not restate their contents here — these files are the source of
truth and this one goes stale if it duplicates them.

| Topic | Document |
| --- | --- |
| Contribution process, branching, merging, code standards, commit format | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Public plugin-authoring API reference | [API.md](API.md) |
| Test strategy, coverage, CI troubleshooting | [TESTING.md](TESTING.md) |
| Writing and running Playwright tests, fixtures, CI architecture | [e2e/README.md](e2e/README.md) |
| Security policy and vulnerability reporting | [SECURITY.md](SECURITY.md) |
| Release process and notable-change policy | [docs/src/process/release.md](docs/src/process/release.md) |
| Common coding pitfalls (clean code, function design, Vue and API usage) | [docs/src/process/common-coding-pitfalls.md](docs/src/process/common-coding-pitfalls.md) |

## Attribution

Agents should disclose their involvement in contributions. Use an `Assisted-by:` commit
trailer naming the tool, for example:

```text
Assisted-by: Claude Code
```

## Review scope

Do not flag issues that `npm run lint` already catches — ESLint, Prettier, and cspell run
in CI. Spend review effort on what automated checks cannot verify: API compatibility for
third-party plugin authors, test coverage of the changed code path, and adherence to the
conventions in CONTRIBUTING.md that no linter enforces.

## Commands

Node version is pinned via `.nvmrc` (`nvm use`). Install with `npm install`.

### Build and run

- `npm start` — dev server at http://localhost:8080 (webpack dev config)
- `npm run start:prod` — prod webpack config
- `npm run build` — production build plus TS declarations (`dist/types`)
- `npm run clean` — removes `dist`, `node_modules`, `coverage`, `html-test-results`, and
  e2e test-results/nyc output. This is a full reset; `npm install` is required afterward.

### Lint and format

- `npm run lint` — runs `lint:js` + `lint:vue` + `lint:spelling`
- `npm run lint:fix` — auto-fix JS/Vue lint issues

### Unit tests (Jasmine + Karma)

- `npm test` — full suite, headless Chrome
- `npm run test:debug` — `KARMA_DEBUG=true`, runs in a real Chrome window for interactive
  debugging
- Specs are colocated with source and named `*Spec.js` (`src/foo/Bar.js` →
  `src/foo/BarSpec.js`). Karma auto-discovers anything matching that pattern under `src/`.
- To run a single spec or suite, temporarily prefix the relevant `describe`/`it` with `f`
  (Jasmine's "focused" variant), then `npm test`. Remove it before committing.

### e2e, visual, and performance tests (Playwright, in the `e2e/` workspace)

- Run `npx playwright install` first to fetch the browser builds pinned by this Playwright
  version. A stale or partial `~/Library/Caches/ms-playwright` from another project fails
  with `Executable doesn't exist` even though *some* Chromium is cached.
- `npm run test:e2e:ci` — the standard functional suite (excludes `@couchdb` and
  `@generatedata` tagged tests)
- `npm run test:e2e:local` — config meant for local iteration
- `npm run test:e2e:watch` — Playwright UI mode
- Single test by name:
  `npx playwright test --config=e2e/playwright-ci.config.js --project=chrome --grep "<test name>"`
- `npm run test:e2e:couchdb` — tests tagged `@couchdb`, needs a CouchDB persistence
  backend, run with `--workers=1`
- `npm run test:e2e:visual:ci` / `:full` — Percy.io visual regression, a no-op without a
  `PERCY_TOKEN`
- `npm run test:e2e:a11y` — accessibility checks (axe + Playwright)
- `npm run test:e2e:checksnapshots` / `test:e2e:updatesnapshots` — pixel snapshot tests.
  These are discouraged (see [e2e/README.md](e2e/README.md)) and must run inside the
  official Playwright Docker image to match CI.

## Architecture

Open MCT is a browser-based mission control framework built by NASA Ames for visualizing
and interacting with telemetry data. It is a plugin-based single-page application: nearly
the entire built-in feature set (plots, imagery, display layouts, tables, notifications)
is implemented as plugins registered through the same public API available to third-party
integrators.

### Bootstrapping (`src/MCT.js`, `openmct.js`)

`openmct.js` instantiates a singleton `MCT` (extends `EventEmitter`) and exports it as the
default and as `window.openmct`. The `MCT` constructor wires up the core APIs as properties
on itself (`this.telemetry`, `this.objects`, `this.composition`, `this.time`, `this.types`,
`this.actions`, `this.user`, `this.editor`, `this.router`, and more — see `src/MCT.js` for
the full list) and installs a set of always-on plugins. An application then calls
`openmct.install(plugin)` for anything else it wants, and finally
`openmct.start(domElement)` to mount the Vue app (`src/ui/layout/AppLayout.vue`) and start
routing.

### Plugin pattern

Almost everything is a plugin: a factory function returning an `install(openmct)` function.
For example `src/plugins/clock/plugin.js` exports `ClockPlugin(options)` →
`function install(openmct) { ... }`. Plugins register against the registries and APIs on
the `openmct` instance (`openmct.types.addType(...)`,
`openmct.objectViews.addProvider(...)`, `openmct.composition.addPolicy(...)`) rather than
being wired in centrally. `src/plugins/plugins.js` is the master export of built-in plugins
(as `openmct.plugins.X`), most of which are opt-in. A handful are installed unconditionally
in the `MCT` constructor; those are core, not optional.

## Rules

- [API.md](API.md) is the canonical reference for the public plugin-authoring API. Consult
  it before changing any signature under `src/api/`. Those are contracts for external
  plugin authors, not just internal callers, and changes require senior developer
  approval. TypeScript declarations are generated (`emitDeclarationOnly`) from
  `src/api/**/*.js` only, per `tsconfig.json`.
- Generated code must follow
  [docs/src/process/common-coding-pitfalls.md](docs/src/process/common-coding-pitfalls.md)
  in addition to the standards in [CONTRIBUTING.md](CONTRIBUTING.md).
- Deviating from any documented convention requires two-party agreement between author
  and reviewer.
