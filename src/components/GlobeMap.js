import Globe from 'globe.gl';
import * as satellite from 'satellite.js';

import { defaultLayerState } from '../config/map-layer-definitions.js';

/**
 * GlobeMap — 3D globe built on globe.gl + Three.js.
 * Renders into a container element. Call destroy() to clean up.
 *
 * Usage:
 *   const globe = new GlobeMap(containerEl, { layerState });
 *   globe.setData('flights', flightArray);
 *   globe.destroy();
 */
export class GlobeMap {
  constructor(container, options = {}) {
    this._container = container;
    this._options = options;
    this._data = {};
    this._layerState = options.layerState ?? defaultLayerState();
    this._globe = null;
    this._satRecords = [];
    this._satInterval = null;

    this._init();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setData(layerId, data) {
    this._data[layerId] = data;
    this._render();
  }

  setLayerEnabled(layerId, enabled) {
    this._layerState[layerId] = enabled;
    this._render();
  }

  getLayerState() {
    return { ...this._layerState };
  }

  destroy() {
    if (this._satInterval) {
      clearInterval(this._satInterval);
    }

    if (this._globe) {
      this._globe._destructor?.();
    }
  }

  // ── Satellite SGP4 ────────────────────────────────────────────────────────

  /**
   * Load satellite TLE records for the Satellites layer.
   * @param {Array<{name: string, tle1: string, tle2: string}>} tles
   */
  loadSatelliteTles(tles) {
    this._satRecords = tles
      .map((t) => {
        try {
          return { name: t.name, rec: satellite.twoline2satrec(t.tle1, t.tle2) };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (this._satInterval) {
      clearInterval(this._satInterval);
    }

    if (this._layerState.satellites) {
      this._satInterval = setInterval(() => this._propagateSats(), 3000);
    }
  }

  _propagateSats() {
    const now = new Date();
    const positions = this._satRecords
      .map(({ name, rec }) => {
        try {
          const posVel = satellite.propagate(rec, now);
          const gmst = satellite.gstime(now);
          const geo = satellite.eciToGeodetic(posVel.position, gmst);
          return {
            name,
            lat: satellite.degreesLat(geo.latitude),
            lng: satellite.degreesLong(geo.longitude),
            alt: geo.height / 6371 // normalized altitude
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (this._globe) {
      this._globe.customLayerData(positions);
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _init() {
    this._globe = Globe({ animateIn: false })(this._container)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#0080ff')
      .atmosphereAltitude(0.12)
      // Default camera position
      .pointOfView({ lat: 20, lng: 20, altitude: 2.2 });

    this._render();
  }

  _render() {
    if (!this._globe) {
      return;
    }

    const enabled = this._layerState;

    // ── Military Flights ──────────────────────────────────────────────────
    const flights =
      enabled.flights && this._data.flights
        ? this._data.flights.filter((d) => !d.onGround && d.latitude && d.longitude)
        : [];

    // ── AIS Vessels ───────────────────────────────────────────────────────
    const vessels =
      enabled.ais && this._data.ais ? this._data.ais.filter((d) => d.latitude && d.longitude) : [];

    // ── Natural events ────────────────────────────────────────────────────
    const natural =
      enabled.natural && this._data.natural
        ? this._data.natural.filter((d) => d.latitude && d.longitude)
        : [];

    // ── GPS Jamming — rendered as hex points ──────────────────────────────
    const jamming =
      enabled.jamming && this._data.jamming
        ? this._data.jamming.filter((d) => d.latitude && d.longitude)
        : [];

    // Merge all point data for globe points layer
    const allPoints = [
      ...flights.map((d) => ({
        lat: d.latitude,
        lng: d.longitude,
        alt: (d.altitude || 0) / 50000,
        color: '#0080ff',
        label: d.callsign
      })),
      ...vessels.map((d) => ({
        lat: d.latitude,
        lng: d.longitude,
        alt: 0,
        color: '#00c8c8',
        label: d.name
      })),
      ...natural.map((d) => ({
        lat: d.latitude,
        lng: d.longitude,
        alt: 0,
        color: '#ffa500',
        label: d.title
      })),
      ...jamming.map((d) => ({
        lat: d.latitude,
        lng: d.longitude,
        alt: 0,
        color: d.classification === 'High' ? '#c41e3a' : '#e17b00',
        label: `GPS Jamming ${d.ratioPercent}%`
      }))
    ];

    this._globe
      .pointsData(allPoints)
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointAltitude((d) => d.alt)
      .pointColor((d) => d.color)
      .pointRadius(0.3)
      .pointLabel((d) => d.label);
  }
}
