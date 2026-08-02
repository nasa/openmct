Astonishing Sparkline plugin for Open MCT

Contributor-focused README

Purpose
- This plugin provides an Open MCT view provider that renders an animated canvas-based sparkline for numeric telemetry streams.
- The files added are intended for review and integration by maintainers.

Repository placement
- src/plugins/astonishing-sparkline/index.js
- src/plugins/astonishing-sparkline/styles.css

Target Open MCT versions
- Developed and lightly tested against Open MCT 1.x. Verify compatibility with the target upstream version before merging.

Local testing (developer steps)
1. Clone your fork and create a feature branch for changes:
   git clone https://github.com/AMateos91/openmct.git
   cd openmct
   git checkout -b astonishing-sparkline

2. Install dependencies and run the dev server:
   npm install
   npm run dev   # or the repo's documented dev command

3. Wire the plugin into your local app entry (e.g., src/main.js):
   import astonishingSparkline from './plugins/astonishing-sparkline/index.js';
   import './plugins/astonishing-sparkline/styles.css';
   openmct.install(astonishingSparkline());

4. Launch the app and open a telemetry-enabled domain object. Select "Astonishing Sparkline" from the view menu.

Testing checklist for PR submission
- [ ] Build completes locally (npm run build).
- [ ] Lint passes (run repository ESLint/format checks).
- [ ] Basic functionality verified: sparkline appears and updates for a numeric telemetry stream.
- [ ] No console errors or obvious memory leaks after several minutes of runtime.
- [ ] Files are added only under src/plugins/astonishing-sparkline/ (no unrelated changes).

Coding standards and style
- Follow the repository's ESLint and Prettier configuration. Fix lint errors before opening a PR.
- Keep changes scoped and minimal; prefer adding tests for non-trivial logic where possible.

Commit & PR guidance
- Use a feature branch (do not commit directly to main of upstream).
- Sign commits if upstream requires DCO: add Signed-off-by lines, or follow the project's contributor agreement.
- PR title: "Add Astonishing Sparkline plugin (src/plugins/astonishing-sparkline)"
- PR description: include summary, testing steps, compatibility notes, and the checklist above.

CI and maintainer notes
- This change is additive and should not alter existing behavior; CI failures related to unrelated areas must be investigated separately.
- Maintainers: if you prefer this as a registry/type extension instead of an objectViews provider, request changes and I will update the branch.

Contact
- Author: AMateos91
- For clarifications or requested changes, please comment on the PR with specific guidance (target Open MCT version, style rules, or additional tests required).
