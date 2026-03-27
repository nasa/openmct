/**
 * Central registry for all map layer definitions.
 * Consumed by both the flat map (deck.gl + MapLibre) and the 3D globe (globe.gl).
 * Adding a new layer is a single-file operation here; renderers read this list.
 *
 * @typedef {'flat' | 'globe' | 'both'} MapRenderer
 *
 * @typedef {object} LayerDef
 * @property {string}        id             - Unique stable layer ID.
 * @property {string}        [labelKey]     - i18n lookup key.
 * @property {string}        fallbackLabel  - Human-readable label used when no i18n translation is present.
 * @property {MapRenderer[]} renderers      - Which renderer(s) support this layer.
 * @property {boolean}       defaultEnabled - Whether this layer is enabled by default.
 * @property {boolean}       mobileEnabled  - Whether this layer is shown on mobile viewports.
 * @property {boolean}       [premiumOnly]  - When true the layer is hidden behind a Pro subscription gate.
 */

/** @param {LayerDef} d @returns {LayerDef} */
function def(d) {
  return d;
}

/** @type {LayerDef[]} */
export const LAYER_DEFS = [
  // ── Always-on situational layers ──────────────────────────────────────────
  def({
    id: 'conflicts',
    fallbackLabel: 'Conflicts',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: true
  }),
  def({
    id: 'hotspots',
    fallbackLabel: 'Hotspots',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: true
  }),
  def({
    id: 'sanctions',
    fallbackLabel: 'Sanctions',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: true
  }),
  def({
    id: 'outages',
    fallbackLabel: 'Outages',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: true
  }),
  def({
    id: 'natural',
    fallbackLabel: 'Natural',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: true
  }),
  def({
    id: 'weather',
    fallbackLabel: 'Weather',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: true
  }),

  // ── Military & infrastructure ─────────────────────────────────────────────
  def({
    id: 'bases',
    fallbackLabel: 'Mil. Bases',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: false
  }),
  def({
    id: 'nuclear',
    fallbackLabel: 'Nuclear',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: false
  }),
  def({
    id: 'protests',
    fallbackLabel: 'Protests',
    renderers: ['both'],
    defaultEnabled: true,
    mobileEnabled: false
  }),
  def({
    id: 'flights',
    fallbackLabel: 'Mil. Flights',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'ais',
    fallbackLabel: 'Ships (AIS)',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'jamming',
    fallbackLabel: 'GPS Jamming',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'satellites',
    fallbackLabel: 'Satellites',
    renderers: ['globe'],
    defaultEnabled: false,
    mobileEnabled: false
  }),

  // ── Infrastructure & connectivity ─────────────────────────────────────────
  def({
    id: 'cables',
    fallbackLabel: 'Cables',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'pipelines',
    fallbackLabel: 'Pipelines',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'ports',
    fallbackLabel: 'Ports',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'airports',
    fallbackLabel: 'Airports',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),

  // ── Intelligence overlays ─────────────────────────────────────────────────
  def({
    id: 'apt',
    fallbackLabel: 'APT Groups',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'cyber',
    fallbackLabel: 'Cyber IOCs',
    renderers: ['globe'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'fires',
    fallbackLabel: 'Fires (FIRMS)',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),

  // ── Analytical overlays ───────────────────────────────────────────────────
  def({
    id: 'cii',
    fallbackLabel: 'CII Heatmap',
    renderers: ['both'],
    defaultEnabled: false,
    mobileEnabled: false
  }),
  def({
    id: 'daynight',
    fallbackLabel: 'Day/Night',
    renderers: ['flat'],
    defaultEnabled: false,
    mobileEnabled: false
  })
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns only layers that can be shown in the given renderer.
 * @param {'flat'|'globe'} renderer
 * @returns {LayerDef[]}
 */
export function layersForRenderer(renderer) {
  return LAYER_DEFS.filter((l) => l.renderers.includes('both') || l.renderers.includes(renderer));
}

/**
 * Builds the default layer-enabled state map keyed by layer ID.
 * @returns {Record<string, boolean>}
 */
export function defaultLayerState() {
  return Object.fromEntries(LAYER_DEFS.map((l) => [l.id, l.defaultEnabled]));
}

/**
 * Builds the mobile layer-enabled state map (subset of default).
 * @returns {Record<string, boolean>}
 */
export function mobileLayerState() {
  return Object.fromEntries(LAYER_DEFS.map((l) => [l.id, l.defaultEnabled && l.mobileEnabled]));
}
