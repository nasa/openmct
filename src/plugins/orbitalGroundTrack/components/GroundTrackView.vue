<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.
-->

<template>
  <div class="c-ground-track">
    <div ref="mapContainer" class="c-ground-track__map"></div>
    <div class="c-ground-track__controls">
      <button class="c-button" :class="{ 'is-active': followSatellite }" @click="toggleFollow">
        {{ followSatellite ? 'Following' : 'Follow Satellite' }}
      </button>
    </div>
  </div>
</template>

<script>
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';

import OrbitPropagator from '../OrbitPropagator.js';

/**
 * View for visualizing satellite ground tracks on a Leaflet map.
 * Synchronizes with Open MCT's Time Conductor for real-time and historical tracking.
 *
 * @component GroundTrackView
 */
export default {
  inject: ['openmct', 'domainObject', 'objectPath'],
  data() {
    return {
      followSatellite: true,
      mapInited: false
    };
  },
  mounted() {
    // Force standard resolution and 2D transforms for maximum stability in Open MCT layout
    L.Browser.retina = false;
    L.Browser.any3d = false;

    // Fix Leaflet's default icon path issues in bundled environments
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    // Wait for DOM to settle and parent to have dimensions
    this.initTimeout = setTimeout(() => {
      this.init();
    }, 500);

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });

    if (this.$refs.mapContainer) {
      this.resizeObserver.observe(this.$refs.mapContainer);
    }

    // Synchronize with Open MCT Time Conductor
    this.openmct.time.on('bounds', this.onTimeUpdate);
  },
  beforeUnmount() {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
    this.openmct.time.off('bounds', this.onTimeUpdate);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  },
  methods: {
    /**
     * Initializes the Leaflet map and orbital layers.
     * @private
     */
    init() {
      const el = this.$refs.mapContainer;
      if (!el) {
        return;
      }

      // Ensure container has dimensions
      if (el.clientWidth === 0) {
        this.initTimeout = setTimeout(() => this.init(), 200);

        return;
      }

      this.map = L.map(el, {
        attributionControl: false,
        zoomControl: true,
        worldCopyJump: true,
        zoomAnimation: false,
        fadeAnimation: false
      }).setView([0, 0], 2);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.map);

      this.marker = L.circleMarker([0, 0], {
        radius: 8,
        fillColor: '#ff7800',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 1
      }).addTo(this.map);

      this.path = L.polyline([], {
        color: '#ff7800',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(this.map);

      this.mapInited = true;

      // Force multiple redraws to settle position
      [100, 500, 1000].forEach((delay) => {
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, delay);
      });

      // Initial view update
      this.updateView(new Date(this.openmct.time.bounds().end));
    },
    /**
     * Toggles the "Follow Satellite" mode.
     */
    toggleFollow() {
      this.followSatellite = !this.followSatellite;
      if (this.followSatellite) {
        this.onTimeUpdate(this.openmct.time.bounds());
      }
    },
    /**
     * Handler for Time Conductor updates.
     * @param {Object} bounds The new time bounds.
     */
    onTimeUpdate(bounds) {
      if (!this.mapInited) {
        return;
      }
      const timestamp = bounds.end || bounds;
      this.updateView(new Date(timestamp));
    },
    /**
     * Updates the map marker and path based on the given date.
     * @param {Date} date
     */
    updateView(date) {
      if (!this.domainObject.tle || !this.map) {
        return;
      }

      const pos = OrbitPropagator.propagate(
        this.domainObject.tle.line1,
        this.domainObject.tle.line2,
        date
      );

      if (pos) {
        const latLng = [pos.latitude, pos.longitude];
        this.marker.setLatLng(latLng);

        // Update path (showing limited history for performance)
        const currentPath = this.path.getLatLngs();
        currentPath.push(latLng);
        if (currentPath.length > 500) {
          currentPath.shift();
        }
        this.path.setLatLngs(currentPath);

        if (this.followSatellite) {
          this.map.panTo(latLng);
        }
      }
    }
  }
};
</script>

<style scoped>
.c-ground-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex !important;
  flex-direction: column !important;
  background: #1e1e1e;
  overflow: hidden;
  color: #ccc;
  font-family: inherit;
}

.c-ground-track__map {
  flex: 1 !important;
  width: 100% !important;
  height: 100% !important;
  position: relative;
}

.c-ground-track__controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.c-button {
  background: #444;
  color: white;
  border: 1px solid #666;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
}

.c-button:hover {
  background: #555;
}

.c-button.is-active {
  background: #0078a8 !important;
  border-color: #0093ce !important;
}

/* LEAFLET ATOMIC SHIELDING */
/* Fixes Open MCT's global box-sizing and image constraints */
:deep(.leaflet-container),
:deep(.leaflet-container *) {
  box-sizing: content-box !important;
}

:deep(.leaflet-container img) {
  max-width: none !important;
  max-height: none !important;
  width: auto !important;
  height: auto !important;
}

:deep(.leaflet-container) {
  background: #1e1e1e !important;
  font-family: inherit !important;
}

:deep(.leaflet-pane) {
  z-index: 400 !important;
}

/* Ensure zoom controls are styled even if CSS assets are missing */
:deep(.leaflet-control-zoom) {
  border: 1px solid #666 !important;
  background: #333 !important;
  border-radius: 4px;
}

:deep(.leaflet-control-zoom-in),
:deep(.leaflet-control-zoom-out) {
  background: #333 !important;
  color: #fff !important;
  border-bottom: 1px solid #444 !important;
  width: 30px !important;
  height: 30px !important;
  line-height: 30px !important;
  display: block !important;
  text-align: center !important;
  text-decoration: none !important;
  font-weight: bold !important;
}
</style>
