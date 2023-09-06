<template>
  <div class="c-mmgis-inspect-properties c-inspector__data-pivot c-mmgis-inspector__flex-column">
    <div class="c-inspect-properties">
      <div class="c-inspect-properties__header">Data Visualization</div>
    </div>

    <div v-if="hasDataRanges">
      <div v-if="selectedDataRange !== undefined && hasDescription" class="c-inspector__data-pivot-coordinates-wrapper">
        <span class="c-tree__item__type-icon c-object-label__type-icon" :class="description.icon"></span>
        <span class="c-inspector__data-pivot-coordinates">
          {{ description.text }}
        </span>
      </div>

      <select class="c-inspector__data-pivot-range-selector" v-model="selectedDataRangeIndex">
        <option v-for="(dataRange, index) in descendingDataRanges" :key="index" :value="index"
          :selected="selectedDataRangeIndex === index">
          {{ displayDataRange(dataRange) }}
        </option>
      </select>
    </div>
    <div v-else-if="dataRanges && dataRanges.length === 0" class="c-inspector__data-pivot-placeholder">
      No data for the current {{ description.name }}
    </div>
    <!-- <div v-else-if="dataRanges === undefined" class="c-inspector__data-pivot-placeholder">
      Loading...
    </div> -->
    <div class="c-inspector__data-pivot-placeholder" v-else-if="hasPlaceholderText">
      {{ placeholderText }}
    </div>
    <template v-if="selectedBounds !== undefined">
      <NumericData :bounds="selectedBounds" :telemetry-keys="telemetryKeys" />
      <Imagery :bounds="selectedBounds" :options="imageryOptions"/>
    </template>
  </div>
</template>
<script>
import NumericData from './NumericData.vue';
import Imagery from './Imagery.vue';

const TIMESTAMP_VIEW_BUFFER = 30 * 1000;
const timestampBufferText = `${TIMESTAMP_VIEW_BUFFER / 1000} seconds`;

export default {
  components: {
    NumericData,
    Imagery
  },
  inject: ['timeFormatter'],
  props: {
    description: {
      type: Object,
      default: () => {}
    },
    dataRanges: {
      type: Array,
      default: () => undefined
    },
    telemetryKeys: {
      type: Array,
      default: () => []
    },
    placeholderText: {
      type: String,
      default: ''
    },
    imageryOptions: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      selectedDataRangeIndex: 0
    };
  },
  computed: {
    hasPlaceholderText() {
      return this.placeholderText?.length > 0;
    },
    descendingDataRanges() {
      return this.dataRanges?.slice().reverse();
    },
    hasDescription() {
      return this.description?.text?.length > 0;
    },
    hasDataRanges() {
      return this.dataRanges?.length > 0;
    },
    selectedDataRange() {
      if (!this.hasDataRanges || this.selectedDataRangeIndex === undefined) {
        return;
      }

      return this.descendingDataRanges[this.selectedDataRangeIndex];
    },
    selectedBounds() {
      if (this.selectedDataRange === undefined) {
        return;
      }

      const { start, end } = this.selectedDataRange.bounds;

      if (start === end) {
        return {
          start: start - TIMESTAMP_VIEW_BUFFER,
          end: end + TIMESTAMP_VIEW_BUFFER
        }
      }

      return this.selectedDataRange.bounds;
    }
  },
  watch: {
    dataRanges: {
      handler() {
        //
      },
      deep: true
    }
  },
  mounted() {
    console.log(this.dataRanges);
  },
  methods: {
    shortDate(date) {
      return date.slice(0, date.indexOf('.')).replace('T', ' ');
    },
    displayDataRange(dataRange) {
      const startTime = dataRange.bounds.start;
      const endTime = dataRange.bounds.end;
      if (startTime === endTime) {
        return `${this.shortDate(this.timeFormatter.format(startTime))} +/- ${timestampBufferText}`;
      }
      return `${this.shortDate(this.timeFormatter.format(startTime))} - ${this.shortDate(this.timeFormatter.format(endTime))}`;
    },
    isSelectedDataRange(dataRange, index) {
      const selectedDataRange = this.descendingDataRanges[index];

      return (
        dataRange.bounds.start === selectedDataRange.bounds.start &&
        dataRange.bounds.end === selectedDataRange.bounds.end
      );
    }
  }
};
</script>
