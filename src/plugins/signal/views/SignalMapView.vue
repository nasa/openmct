<template>
  <section class="c-signal-map-view">
    <!-- Toolbar -->
    <div class="c-signal-map-view__toolbar">
      <!-- Mode toggle -->
      <div class="c-signal-map-view__mode-toggle">
        <button
          class="c-signal-map-view__mode-btn"
          :class="{ 'is-active': mode === 'flat' }"
          @click="setMode('flat')"
        >
          Flat
        </button>
        <button
          class="c-signal-map-view__mode-btn"
          :class="{ 'is-active': mode === 'globe' }"
          @click="setMode('globe')"
        >
          Globe
        </button>
      </div>

      <!-- Layer toggles -->
      <div class="c-signal-map-view__layers">
        <button
          v-for="layer in visibleLayers"
          :key="layer.id"
          class="c-signal-map-view__layer-btn"
          :class="{ 'is-active': layerState[layer.id] }"
          @click="toggleLayer(layer.id)"
        >
          {{ layer.fallbackLabel }}
        </button>
      </div>
    </div>

    <!-- Map container -->
    <div ref="mapContainer" class="c-signal-map-view__map" />
  </section>
</template>

<script>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';

import { DeckGLMap } from '../../../components/DeckGLMap.js';
import { GlobeMap } from '../../../components/GlobeMap.js';
import { defaultLayerState, layersForRenderer } from '../../../config/map-layer-definitions.js';
import { fetchGpsJammingEvents } from '../services/gpsjam-data.js';
import { fetchMilitaryFlights } from '../services/opensky-data.js';
import { fetchAisVessels } from '../services/ais-data.js';
import { fetchEonetCategoryEvents } from '../services/eonet-data.js';

// How often to refresh each data source (ms)
const REFRESH_INTERVALS = {
  jamming: 10 * 60 * 1000,   // 10 min (GPSJam updates hourly)
  flights: 30 * 1000,         // 30 s
  ais: 10 * 1000,             // 10 s (relay snapshot interval)
  natural: 5 * 60 * 1000      // 5 min
};

export default {
  name: 'SignalMapView',
  setup() {
    const openmct = inject('openmct');
    const mapContainer = ref(null);
    const mode = ref('flat');
    const layerState = ref(defaultLayerState());
    let mapInstance = null;
    const timers = [];

    const visibleLayers = computed(() => layersForRenderer(mode.value));

    function toggleLayer(id) {
      layerState.value[id] = !layerState.value[id];
      mapInstance?.setLayerEnabled(id, layerState.value[id]);
    }

    function setMode(newMode) {
      if (newMode === mode.value) return;
      mode.value = newMode;
      rebuildMap();
    }

    function destroyMap() {
      timers.forEach((t) => clearInterval(t));
      timers.length = 0;
      mapInstance?.destroy();
      mapInstance = null;
    }

    async function loadAndPush(layerId, fetchFn, eonetCategory = null) {
      try {
        const data = eonetCategory
          ? await fetchEonetCategoryEvents(eonetCategory)
          : await fetchFn();
        mapInstance?.setData(layerId, data);
      } catch {
        // Fail silently — map just won't show this layer's data
      }
    }

    function startPolling() {
      // Initial fetches
      loadAndPush('jamming', fetchGpsJammingEvents);
      loadAndPush('flights', fetchMilitaryFlights);
      loadAndPush('ais', fetchAisVessels);
      loadAndPush('natural', null, 'wildfires'); // first EONET category as sample

      // Recurring polls
      timers.push(setInterval(() => loadAndPush('jamming', fetchGpsJammingEvents), REFRESH_INTERVALS.jamming));
      timers.push(setInterval(() => loadAndPush('flights', fetchMilitaryFlights), REFRESH_INTERVALS.flights));
      timers.push(setInterval(() => loadAndPush('ais', fetchAisVessels), REFRESH_INTERVALS.ais));
      timers.push(setInterval(() => loadAndPush('natural', null, 'wildfires'), REFRESH_INTERVALS.natural));
    }

    function rebuildMap() {
      if (!mapContainer.value) return;
      destroyMap();

      const opts = { layerState: { ...layerState.value } };
      mapContainer.value.innerHTML = '';

      if (mode.value === 'flat') {
        mapInstance = new DeckGLMap(mapContainer.value, opts);
      } else {
        mapInstance = new GlobeMap(mapContainer.value, opts);
      }

      startPolling();
    }

    watch(layerState, () => {}, { deep: true }); // keep reactivity for toolbar

    onMounted(() => rebuildMap());
    onUnmounted(() => destroyMap());

    return {
      mapContainer,
      mode,
      layerState,
      visibleLayers,
      toggleLayer,
      setMode
    };
  }
};
</script>

<style scoped>
.c-signal-map-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.c-signal-map-view__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.c-signal-map-view__mode-toggle {
  display: flex;
  gap: 2px;
}

.c-signal-map-view__mode-btn,
.c-signal-map-view__layer-btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  color: inherit;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 3px 10px;
  white-space: nowrap;
}

.c-signal-map-view__mode-btn.is-active,
.c-signal-map-view__layer-btn.is-active {
  background: rgba(0, 128, 255, 0.35);
  border-color: #0080ff;
}

.c-signal-map-view__layers {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.c-signal-map-view__map {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
