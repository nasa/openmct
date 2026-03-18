<template>
  <section class="c-signal-view">
    <header class="c-signal-view__header">
      <h2 class="c-signal-view__title">{{ domainObject?.name || 'Earthquakes' }}</h2>
      <p class="c-signal-view__subtitle">{{ moduleSubtitle }}</p>
    </header>

    <div class="c-signal-view__content">
      <div class="c-signal-view__stats">
        <div class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">{{ totalEventsLabel }}</span>
          <span class="c-signal-view__stat-value">{{ signalEvents.length }}</span>
        </div>

        <div v-if="isEarthquakesModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Max Magnitude:</span>
          <span class="c-signal-view__stat-value">
            {{ maxMagnitude > 0 ? maxMagnitude.toFixed(2) : 'N/A' }}
          </span>
        </div>

        <div v-if="isEarthquakesModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">High Risk (M≥5.0):</span>
          <span class="c-signal-view__stat-value c-signal-view__stat-high">
            {{ highRiskCount }}
          </span>
        </div>

        <div v-if="usesEonetModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Geolocated Events:</span>
          <span class="c-signal-view__stat-value">{{ geolocatedCount }}</span>
        </div>

        <div v-if="usesEonetModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Tracked Sources:</span>
          <span class="c-signal-view__stat-value">{{ sourceCount }}</span>
        </div>

        <div v-if="isGpsJamModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">High Severity:</span>
          <span class="c-signal-view__stat-value c-signal-view__stat-high">{{ highJamCount }}</span>
        </div>

        <div v-if="isGpsJamModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Medium Severity:</span>
          <span class="c-signal-view__stat-value">{{ mediumJamCount }}</span>
        </div>

        <div v-if="isOpenSkyModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Airborne:</span>
          <span class="c-signal-view__stat-value">{{ airborneCount }}</span>
        </div>

        <div v-if="isOpenSkyModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Classified Types:</span>
          <span class="c-signal-view__stat-value">{{ confirmedMilCount }}</span>
        </div>

        <div v-if="isAisModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Underway:</span>
          <span class="c-signal-view__stat-value">{{ underwayCount }}</span>
        </div>

        <div v-if="isAisModule" class="c-signal-view__stat">
          <span class="c-signal-view__stat-label">Geolocated:</span>
          <span class="c-signal-view__stat-value">{{ geolocatedCount }}</span>
        </div>
      </div>

      <div class="c-signal-view__list">
        <div v-if="loading" class="c-signal-view__loading">{{ loadingMessage }}</div>
        <div v-else-if="signalEvents.length === 0" class="c-signal-view__empty">
          {{ emptyMessage }}
        </div>
        <div v-else class="c-signal-view__events">
          <div
            v-for="event in signalEvents"
            :key="`${moduleKey}-${event.utc}-${eventTitle(event)}`"
            class="c-signal-view__event"
            :class="eventCardClass(event)"
          >
            <div class="c-signal-view__event-header">
              <span class="c-signal-view__event-emphasis">{{ eventEmphasis(event) }}</span>
              <span class="c-signal-view__event-title">{{ eventTitle(event) }}</span>
              <span class="c-signal-view__event-time">{{ formatTime(event.utc) }}</span>
            </div>

            <div v-if="isEarthquakesModule" class="c-signal-view__event-details">
              <span>Depth: {{ event.depth.toFixed(1) }} km</span>
              <span>Lat: {{ event.latitude.toFixed(3) }}</span>
              <span>Lon: {{ event.longitude.toFixed(3) }}</span>
            </div>

            <div v-if="usesEonetModule" class="c-signal-view__event-details">
              <span>Source: {{ event.source }}</span>
              <span>Lat: {{ event.latitude.toFixed(3) }}</span>
              <span>Lon: {{ event.longitude.toFixed(3) }}</span>
            </div>

            <div v-if="isGpsJamModule" class="c-signal-view__event-details">
              <span>Interference: {{ event.ratioPercent }}%</span>
              <span v-if="event.latitude != null">Lat: {{ event.latitude.toFixed(3) }}</span>
              <span v-if="event.longitude != null">Lon: {{ event.longitude.toFixed(3) }}</span>
            </div>

            <div v-if="isOpenSkyModule" class="c-signal-view__event-details">
              <span v-if="event.altitude != null">{{ event.altitude.toLocaleString() }} ft</span>
              <span v-if="event.velocity != null">{{ event.velocity }} kts</span>
              <span>{{ event.country }}</span>
            </div>

            <div v-if="isAisModule" class="c-signal-view__event-details">
              <span v-if="event.speed != null">{{ event.speed }} kts</span>
              <span v-if="event.heading != null">Hdg: {{ event.heading }}°</span>
              <span v-if="event.flag">{{ event.flag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';

import { getSignalModuleDefinition } from '../types/signal-types.js';

export default {
  name: 'SignalView',
  setup() {
    const domainObject = inject('domainObject');
    const openmct = inject('openmct');
    const signalEvents = ref([]);
    const loading = ref(true);
    let interval;

    const moduleDefinition = computed(() => {
      return getSignalModuleDefinition(domainObject?.type);
    });
    const moduleKey = computed(() => {
      return domainObject?.configuration?.module || 'earthquakes';
    });
    const source = computed(() => moduleDefinition.value?.source || 'usgs');
    const isEarthquakesModule = computed(() => source.value === 'usgs');
    const usesEonetModule = computed(() => source.value === 'eonet');
    const isGpsJamModule = computed(() => source.value === 'gpsjam');
    const isOpenSkyModule = computed(() => source.value === 'opensky');
    const isAisModule = computed(() => source.value === 'ais');
    const moduleSubtitle = computed(() => {
      return moduleDefinition.value?.subtitle || 'Signal module';
    });
    const totalEventsLabel = computed(() => {
      const src = source.value;
      if (src === 'eonet') {
        return 'Active Events:';
      }
      if (src === 'gpsjam') {
        return 'Jamming Zones:';
      }
      if (src === 'opensky') {
        return 'Aircraft Tracked:';
      }
      if (src === 'ais') {
        return 'Vessels Tracked:';
      }
      return 'Total Events (1h):';
    });
    const loadingMessage = computed(() => {
      return moduleDefinition.value?.loadingMessage || 'Loading signal data...';
    });
    const emptyMessage = computed(() => {
      return moduleDefinition.value?.emptyMessage || 'No signal events were returned.';
    });
    const maxMagnitude = computed(() => {
      if (!isEarthquakesModule.value || signalEvents.value.length === 0) {
        return 0;
      }

      return Math.max(...signalEvents.value.map((event) => event.magnitude));
    });
    const highRiskCount = computed(() => {
      if (!isEarthquakesModule.value) {
        return 0;
      }

      return signalEvents.value.filter((event) => event.magnitude >= 5.0).length;
    });
    const geolocatedCount = computed(() => {
      return signalEvents.value.filter((event) => event.latitude || event.longitude).length;
    });
    const sourceCount = computed(() => {
      const sources = new Set(signalEvents.value.map((event) => event.source).filter(Boolean));

      return sources.size;
    });
    const highJamCount = computed(
      () => signalEvents.value.filter((e) => e.classification === 'High').length
    );
    const mediumJamCount = computed(
      () => signalEvents.value.filter((e) => e.classification === 'Medium').length
    );
    const airborneCount = computed(() => signalEvents.value.filter((e) => !e.onGround).length);
    const confirmedMilCount = computed(
      () =>
        signalEvents.value.filter((e) => e.classification && e.classification !== 'Military').length
    );
    const underwayCount = computed(
      () =>
        signalEvents.value.filter((e) => String(e.status).toLowerCase().includes('underway')).length
    );

    function eventTitle(event) {
      const src = source.value;
      if (src === 'opensky') {
        return event.callsign || event.icao24 || 'Unknown';
      }
      if (src === 'ais') {
        return event.name || event.mmsi || 'Unknown';
      }
      if (src === 'gpsjam') {
        const lat = event.latitude?.toFixed(2);
        const lon = event.longitude?.toFixed(2);
        return lat && lon ? `Zone ${lat}, ${lon}` : event.hex || 'Unknown zone';
      }
      return event.title || event.place || 'Unknown';
    }

    function eventEmphasis(event) {
      const src = source.value;
      if (src === 'usgs') {
        return `M${event.magnitude?.toFixed(2) || '?'}`;
      }
      if (src === 'eonet') {
        return event.status;
      }
      if (src === 'gpsjam') {
        return event.classification;
      }
      if (src === 'opensky') {
        return event.classification;
      }
      if (src === 'ais') {
        return event.status;
      }
      return null;
    }

    function formatTime(timestamp) {
      const date = new Date(timestamp);

      return date.toLocaleString();
    }

    function eventCardClass(event) {
      const src = source.value;
      if (src === 'usgs') {
        return { 'c-signal-view__event--high': event.magnitude >= 5.0 };
      }
      if (src === 'eonet') {
        return { 'c-signal-view__event--active': event.status === 'Active' };
      }
      if (src === 'gpsjam') {
        return {
          'c-signal-view__event--high': event.classification === 'High',
          'c-signal-view__event--active': event.classification === 'Medium'
        };
      }
      if (src === 'opensky') {
        return {
          'c-signal-view__event--high': ['FIGHTER', 'RECCE'].includes(event.classification),
          'c-signal-view__event--active': ['TRANSPORT', 'TANKER'].includes(event.classification)
        };
      }
      if (src === 'ais') {
        return {
          'c-signal-view__event--active': String(event.status).toLowerCase().includes('underway')
        };
      }
      return {};
    }

    async function loadSignalData() {
      loading.value = true;

      try {
        const data = await openmct.telemetry.request(domainObject);
        signalEvents.value = data.slice(0, 50);
      } catch (error) {
        console.error('Failed to load signal data:', error);
        signalEvents.value = [];
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      loadSignalData();
      interval = window.setInterval(loadSignalData, 60000);
    });

    onUnmounted(() => {
      if (interval) {
        window.clearInterval(interval);
      }
    });

    return {
      domainObject,
      moduleDefinition,
      signalEvents,
      loading,
      moduleKey,
      source,
      isEarthquakesModule,
      usesEonetModule,
      isGpsJamModule,
      isOpenSkyModule,
      isAisModule,
      moduleSubtitle,
      totalEventsLabel,
      loadingMessage,
      emptyMessage,
      maxMagnitude,
      highRiskCount,
      geolocatedCount,
      sourceCount,
      highJamCount,
      mediumJamCount,
      airborneCount,
      confirmedMilCount,
      underwayCount,
      eventTitle,
      eventEmphasis,
      eventCardClass,
      formatTime
    };
  }
};
</script>

<style scoped>
.c-signal-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.c-signal-view__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.c-signal-view__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.c-signal-view__subtitle {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.7;
}

.c-signal-view__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.c-signal-view__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
}

.c-signal-view__stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-signal-view__stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.c-signal-view__stat-value {
  font-weight: 600;
  font-size: 1rem;
}

.c-signal-view__stat-high {
  color: #c41e3a;
}

.c-signal-view__list {
  flex: 1;
  overflow-y: auto;
}

.c-signal-view__loading,
.c-signal-view__empty {
  padding: 16px;
  text-align: center;
  color: #999;
  font-style: italic;
}

.c-signal-view__events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.c-signal-view__event {
  padding: 10px 12px;
  border-left: 3px solid #0080ff;
  background: rgba(0, 128, 255, 0.05);
  border-radius: 2px;
  font-size: 0.9rem;
}

.c-signal-view__event--high {
  border-left-color: #c41e3a;
  background: rgba(196, 30, 58, 0.1);
}

.c-signal-view__event--active {
  border-left-color: #e17b00;
  background: rgba(225, 123, 0, 0.1);
}

.c-signal-view__event-header {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
  align-items: baseline;
}

.c-signal-view__event-emphasis {
  font-weight: 700;
  font-size: 1rem;
  min-width: 72px;
}

.c-signal-view__event-title {
  flex: 1;
  font-weight: 500;
}

.c-signal-view__event-time {
  opacity: 0.7;
  font-size: 0.85rem;
  white-space: nowrap;
}

.c-signal-view__event-details {
  display: flex;
  gap: 16px;
  opacity: 0.8;
  font-size: 0.85rem;
}
</style>
