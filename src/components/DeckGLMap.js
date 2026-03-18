import 'maplibre-gl/dist/maplibre-gl.css';

import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import maplibregl from 'maplibre-gl';

import { defaultLayerState } from '../config/map-layer-definitions.js';

const OPENFREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * DeckGLMap — flat map built on deck.gl + MapLibre GL.
 * Renders into a container element. Call destroy() to clean up when done.
 *
 * Usage:
 *   const map = new DeckGLMap(containerEl, { layerState, onLayerToggle });
 *   map.setData('flights', flightArray);
 *   map.destroy();
 */
export class DeckGLMap {
  constructor(container, options = {}) {
    this._container = container;
    this._options = options;
    this._data = {};
    this._layerState = options.layerState ?? defaultLayerState();
    this._onLayerToggle = options.onLayerToggle ?? null;
    this._deck = null;
    this._map = null;
    this._animFrame = null;

    this._init();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Replace or update the data for a named layer and re-render. */
  setData(layerId, data) {
    this._data[layerId] = data;
    this._render();
  }

  /** Enable or disable a layer and re-render. */
  setLayerEnabled(layerId, enabled) {
    this._layerState[layerId] = enabled;
    this._render();
  }

  /** Return current layer state snapshot (shallow copy). */
  getLayerState() {
    return { ...this._layerState };
  }

  destroy() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
    }

    if (this._deck) {
      this._deck.finalize();
    }

    if (this._map) {
      this._map.remove();
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _init() {
    // Create MapLibre base map
    this._map = new maplibregl.Map({
      container: this._container,
      style: this._options.style ?? OPENFREE_MAP_STYLE,
      center: [20, 20],
      zoom: 2,
      attributionControl: false
    });

    this._map.addControl(new maplibregl.AttributionControl({ compact: true }));
    this._map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Overlay deck.gl on top of the MapLibre canvas
    this._deck = new Deck({
      canvas: this._createOverlayCanvas(),
      controller: false, // MapLibre handles navigation
      initialViewState: {
        longitude: 20,
        latitude: 20,
        zoom: 2,
        pitch: 0,
        bearing: 0
      },
      onViewStateChange: ({ viewState }) => {
        this._map.jumpTo({
          center: [viewState.longitude, viewState.latitude],
          zoom: viewState.zoom,
          bearing: viewState.bearing,
          pitch: viewState.pitch
        });
      },
      layers: []
    });

    this._map.on('move', () => {
      const { lng, lat } = this._map.getCenter();
      this._deck.setProps({
        viewState: {
          longitude: lng,
          latitude: lat,
          zoom: this._map.getZoom(),
          bearing: this._map.getBearing(),
          pitch: this._map.getPitch()
        }
      });
    });

    this._map.on('load', () => this._render());
  }

  _createOverlayCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    this._container.style.position = 'relative';
    this._container.appendChild(canvas);
    return canvas;
  }

  _buildLayers() {
    const layers = [];
    const enabled = this._layerState;

    // ── GPS Jamming — H3 hex interference zones ──────────────────────────
    if (enabled.jamming && this._data.jamming) {
      layers.push(
        new ScatterplotLayer({
          id: 'jamming',
          data: this._data.jamming,
          getPosition: (d) => [d.longitude, d.latitude],
          getFillColor: (d) =>
            d.classification === 'High' ? [196, 30, 58, 180] : [225, 123, 0, 140],
          getRadius: 80000,
          radiusMinPixels: 6,
          radiusUnits: 'meters',
          pickable: true
        })
      );
    }

    // ── Military Flights ──────────────────────────────────────────────────
    if (enabled.flights && this._data.flights) {
      layers.push(
        new ScatterplotLayer({
          id: 'flights',
          data: this._data.flights.filter((d) => !d.onGround),
          getPosition: (d) => [d.longitude, d.latitude],
          getFillColor: (d) =>
            ['FIGHTER', 'RECCE'].includes(d.classification)
              ? [196, 30, 58, 220]
              : [0, 128, 255, 200],
          getRadius: 5,
          radiusMinPixels: 4,
          radiusMaxPixels: 12,
          radiusUnits: 'pixels',
          pickable: true
        })
      );
    }

    // ── AIS Vessels ───────────────────────────────────────────────────────
    if (enabled.ais && this._data.ais) {
      layers.push(
        new ScatterplotLayer({
          id: 'ais',
          data: this._data.ais,
          getPosition: (d) => [d.longitude, d.latitude],
          getFillColor: [0, 200, 200, 180],
          getRadius: 4,
          radiusMinPixels: 3,
          radiusMaxPixels: 10,
          radiusUnits: 'pixels',
          pickable: true
        })
      );
    }

    // ── Natural events (EONET) ────────────────────────────────────────────
    if (enabled.natural && this._data.natural) {
      layers.push(
        new ScatterplotLayer({
          id: 'natural',
          data: this._data.natural.filter((d) => d.latitude && d.longitude),
          getPosition: (d) => [d.longitude, d.latitude],
          getFillColor: [255, 165, 0, 200],
          getRadius: 35000,
          radiusMinPixels: 5,
          radiusUnits: 'meters',
          pickable: true
        })
      );
    }

    return layers;
  }

  _render() {
    if (!this._deck) {
      return;
    }

    this._deck.setProps({ layers: this._buildLayers() });
  }
}
