# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Open MCT (Open Mission Control Technologies) is a browser-based mission control framework built by NASA Ames, used for visualizing and interacting with telemetry data. It's a plugin-based single-page application: nearly the entire built-in feature set (plots, imagery, display layouts, tables, notifications, etc.) is implemented as plugins registered through the same public API available to third-party integrators.

## Commands

Node version is pinned via `.nvmrc` (`nvm use`). Install with `npm install`.

### Build & run
- `npm start` — dev server at http://localhost:8080 (webpack dev config)
- `npm run start:prod` — prod webpack config
- `npm run build` — production build + generate TS declarations (`dist/types`)
- `npm run clean` — removes `dist`, `node_modules`, `coverage`, `html-test-results`, and e2e test-results/nyc output (full reset — `npm install` is required afterward)

### Lint & format
- `npm run lint` — runs `lint:js` + `lint:vue` + `lint:spelling`
- `npm run lint:fix` — auto-fix JS/Vue lint issues
- ESLint + Prettier (`plugin:prettier/recommended`) enforce style; cspell checks spelling across `**/*.{js,md,vue}`

### Unit tests (Jasmine + Karma)
- `npm test` — full suite, headless Chrome
- `npm run test:debug` — `KARMA_DEBUG=true`, runs in a real Chrome window for interactive debugging
- Spec files are colocated with source and named `*Spec.js` (e.g. `src/foo/Bar.js` → `src/foo/BarSpec.js`); Karma auto-discovers anything matching that pattern under `src/`
- To run a single spec/suite, it's usually fastest to temporarily prefix the relevant `describe`/`it` with an `f` (Jasmine's "focused" variant) in the spec file, then `npm test` — remember to remove it before committing

### e2e / visual / performance tests (Playwright, in `e2e/` workspace)
- First run `npx playwright install` to fetch the browser builds pinned by this Playwright version — a stale/partial `~/Library/Caches/ms-playwright` (e.g. from another project) will fail with `Executable doesn't exist` even though *some* Chromium is cached
- `npm run test:e2e:ci` — the standard functional suite (excludes `@couchdb` and `@generatedata` tagged tests)
- `npm run test:e2e:local` — run against a config meant for local iteration
- `npm run test:e2e:watch` — Playwright UI mode
- Run a single test by name: `npx playwright test --config=e2e/playwright-ci.config.js --project=chrome --grep "<test name>"`
- `npm run test:e2e:couchdb` — tests tagged `@couchdb` (needs CouchDB persistence backend), run with `--workers=1`
- `npm run test:e2e:visual:ci` / `:full` — Percy.io visual regression (no-op without a `PERCY_TOKEN`)
- `npm run test:e2e:a11y` — accessibility checks (axe + Playwright)
- `npm run test:e2e:checksnapshots` / `test:e2e:updatesnapshots` — pixel snapshot tests (discouraged, see `e2e/README.md`); must be run inside the official Playwright Docker image to match CI
- Full guidance, including writing new tests and CI architecture, lives in `e2e/README.md` and `TESTING.md`

## Architecture

### Bootstrapping (`src/MCT.js`, `openmct.js`)
`openmct.js` instantiates a singleton `MCT` (extends `EventEmitter`) and exports it as the default/`window.openmct` object. The `MCT` constructor wires up all core APIs as properties on itself (`this.telemetry`, `this.objects`, `this.composition`, `this.time`, `this.types`, `this.actions`, `this.user`, `this.editor`, `this.router`, etc. — see `src/MCT.js` for the full list) and installs a set of always-on plugins. An application then calls `openmct.install(plugin)` for any additional plugins it wants, and finally `openmct.start(domElement)` to mount the Vue app (`src/ui/layout/AppLayout.vue`) and start routing.

### Plugin pattern
Almost everything is a plugin: a factory function that returns an `install(openmct)` function, e.g. `src/plugins/clock/plugin.js` exports `ClockPlugin(options)` → `function install(openmct) { ... }`. Plugins register with the various registries/APIs on the `openmct` instance (`openmct.types.addType(...)`, `openmct.objectViews.addProvider(...)`, `openmct.composition.addPolicy(...)`, etc.) rather than being wired in centrally. `src/plugins/plugins.js` is the master export of all built-in plugins (as `openmct.plugins.X`), most of which are opt-in — an application enables them explicitly. A handful of plugins are installed unconditionally in the `MCT` constructor itself (these are considered core, not optional).

### Key APIs (`src/api/*`)
- **ObjectAPI** (`objects`) — CRUD and identification for *domain objects* (anything that can appear in the tree: telemetry points, layouts, folders, etc.), backed by pluggable persistence providers
- **CompositionAPI** (`composition`) — parent/child containment relationships between domain objects (what shows up nested under what in the tree)
- **TelemetryAPI** (`telemetry`) — registers telemetry providers and request/subscribe interfaces for streaming and historical data
- **TypeRegistry** (`types`) — defines domain object types (creatable or not, their forms, icons, initializers)
- **TimeAPI** (`time`) — the app's global time/clock context (bounds, ticking, time systems) that most views subscribe to
- **ActionsAPI**, **StatusAPI**, **UserAPI**, **AnnotationAPI**, **FaultManagementAPI**, **FormsAPI** — action menus, object status decorations, user/role awareness, tagging/annotations, fault workflows, and dynamic form generation, respectively

Registries for pluggable UI surfaces: `ViewRegistry` (object views + inspector views), `ToolbarRegistry` (edit-mode toolbars), `InspectorViewRegistry`. Views are chosen based on object type and current `Selection` (`src/selection/Selection.js`).

### Directory layout
- `src/api/` — the core, mostly-stable public APIs described above
- `src/plugins/` — the bulk of features (70+ plugins), one directory per plugin, each typically containing `plugin.js` (the install function), a `pluginSpec.js` (Jasmine tests for the whole plugin), and feature-organized subfolders (not type-organized — see "organize by feature" in Code Guidelines below)
- `src/ui/` — the Vue application shell: `layout/` (top-level `AppLayout.vue`, tree, toolbar), `router/` (`ApplicationRouter`, `Browse`), `inspector/`, `preview/`, `registries/`, `composables/`
- `src/selection/` — cross-cutting selection state used by inspector/toolbar to react to what's selected
- `example/` — sample plugins (data generators, example fault/user/imagery providers) used for local dev and as reference implementations for third-party plugin authors; treated as legacy-style code (excluded from strict lint config as `LEGACY_FILES`)
- `e2e/` — a separate npm workspace containing all Playwright tests, fixtures (`appActions.js`, `pluginFixtures.js`), and Playwright configs for each test flavor (ci/local/mobile/performance/visual/watch)

### Public API surface
`API.md` is the canonical reference for the public plugin-authoring API — consult it before changing signatures on anything under `src/api/`, since those are contracts for external plugin authors, not just internal callers. TypeScript declarations are generated (`emitDeclarationOnly`) from `src/api/**/*.js` only, per `tsconfig.json`.

## Code conventions

These come from `CONTRIBUTING.md`; ESLint/Prettier enforce a subset automatically but not all of it:
- Classes and Vue components: `PascalCase`; methods/variables/functions: `camelCase`; true constants: `SCREAMING_SNAKE_CASE` and always `const`
- File names match their default export (e.g. `SomeClassName.js`); function-exporting files use camelCase filenames
- Prefer named `function` declarations over `const fn = () => {}`; anonymous functions should be arrow functions and kept short
- Always use ES6 `class`/inheritance, never the old prototypal pattern
- Organize code by feature, not by type (a plugin's row/column/etc. subfolders each hold their own `.js`/`.vue` pair, rather than global `components/`/`collections/` folders — see the example in `CONTRIBUTING.md`)
- Unit test specs live next to the code they test, not in a parallel test tree
- No "magic" literals — pull them into named constants
- Deviating from any of the above requires two-party (author + reviewer) agreement

## Commit / PR conventions (from `CONTRIBUTING.md`)
- Subject line prefixed with a bracketed subsystem tag, e.g. `[Documentation] ...`; subject ≤54 chars, body lines ≤72 chars
- PRs must reference the issue they address (`Addresses #1234` / `Closes #1234`)
- API changes require senior developer approval
