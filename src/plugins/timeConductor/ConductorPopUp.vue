<template>
  <div class="c-tc-input-popup" :class="popupClasses" :style="position">
    <div class="c-tc-input-popup__options">
      <IndependentMode
        v-if="isIndependent"
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's mode."
        :mode="timeOptionMode"
        @independent-mode-updated="saveIndependentMode"
      />
      <ConductorMode
        v-else
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's mode."
        :button-css-class="'c-icon-button'"
        @mode-updated="saveMode"
      />
      <IndependentClock
        v-if="isIndependent"
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's clock."
        :clock="timeOptionClock"
        :button-css-class="'c-icon-button'"
        @independent-clock-updated="saveIndependentClock"
      />
      <ConductorClock
        v-else
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's clock."
        :button-css-class="'c-icon-button'"
        @clock-updated="saveClock"
      />
      <!-- TODO: Time system and history must work even with ITC later -->
      <ConductorTimeSystem
        v-if="!isIndependent"
        class="c-conductor__time-system-select"
        title="Sets the Time Conductor's time system."
        :button-css-class="'c-icon-button'"
      />
      <ConductorHistory
        v-if="!isIndependent"
        class="c-conductor__history-select"
        title="Select and apply previously entered time intervals."
        :button-css-class="'c-icon-button'"
      />
    </div>
    <conductor-inputs-fixed
      v-if="isFixed"
      :input-bounds="bounds"
      :object-path="objectPath"
      @bounds-updated="saveFixedBounds"
      @dismiss-inputs-fixed="dismiss"
    />
    <conductor-inputs-realtime
      v-else
      :input-bounds="bounds"
      :object-path="objectPath"
      @offsets-updated="saveClockOffsets"
      @dismiss-inputs-realtime="dismiss"
    />
  </div>
</template>

<script>
import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import ConductorClock from './ConductorClock.vue';
import ConductorHistory from './ConductorHistory.vue';
import ConductorInputsFixed from './ConductorInputsFixed.vue';
import ConductorInputsRealtime from './ConductorInputsRealtime.vue';
import ConductorMode from './ConductorMode.vue';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import IndependentClock from './independent/IndependentClock.vue';
import IndependentMode from './independent/IndependentMode.vue';

export default {
  components: {
    ConductorMode,
    ConductorClock,
    IndependentMode,
    IndependentClock,
    ConductorTimeSystem,
    ConductorHistory,
    ConductorInputsFixed,
    ConductorInputsRealtime
  },
  inject: {
    openmct: 'openmct',
    configuration: {
      from: 'configuration',
      default: undefined
    }
  },
  props: {
    positionX: {
      type: Number,
      required: true
    },
    positionY: {
      type: Number,
      required: true
    },
    isFixed: {
      type: Boolean,
      required: true
    },
    isIndependent: {
      type: Boolean,
      default() {
        return false;
      }
    },
    timeOptions: {
      type: Object,
      default() {
        return undefined;
      }
    },
    bottom: {
      type: Boolean,
      default() {
        return false;
      }
    },
    objectPath: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  emits: [
    'popup-loaded',
    'dismiss',
    'independent-clock-updated',
    'fixed-bounds-updated',
    'clock-offsets-updated',
    'clock-updated',
    'mode-updated',
    'independent-mode-updated'
  ],
  data() {
    const bounds = this.openmct.time.getBounds();
    const timeSystem = this.openmct.time.getTimeSystem();
    // const isFixed = this.openmct.time.isFixed();

    return {
      timeSystem,
      bounds: {
        start: bounds.start,
        end: bounds.end
      }
    };
  },
  computed: {
    position() {
      const position = {
        left: `${this.positionX}px`
      };

      if (this.isIndependent) {
        position.top = `${this.positionY}px`;
      }

      return position;
    },
    popupClasses() {
      const value = this.bottom ? 'c-tc-input-popup--bottom ' : '';
      const mode = this.isFixed ? 'fixed-mode' : 'realtime-mode';
      const independentClass = this.isIndependent ? 'itc-popout ' : '';

      return `${independentClass}${value}c-tc-input-popup--${mode}`;
    },
    timeOptionMode() {
      return this.timeOptions?.mode;
    },
    timeOptionClock() {
      return this.timeOptions?.clock;
    }
  },
  watch: {
    objectPath: {
      handler(newPath, oldPath) {
        //domain object or view has probably changed
        if (newPath === oldPath) {
          return;
        }

        this.setTimeContext();
      },
      deep: true
    }
  },
  mounted() {
    this.$emit('popup-loaded');
    this.setTimeContext();
  },
  beforeUnmount() {
    this.stopFollowingTimeContext();
  },
  methods: {
    setTimeContext() {
      if (this.timeContext) {
        this.stopFollowingTimeContext();
      }

      this.timeContext = this.openmct.time.getContextForView(this.objectPath);

      this.timeContext.on(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
      this.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this.setBounds);

      this.setViewFromClock(this.timeContext.getClock());
      this.setBounds(this.timeContext.getBounds());
    },
    stopFollowingTimeContext() {
      this.timeContext.off(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
      this.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this.setBounds);
    },
    setViewFromClock() {
      this.bounds = this.isFixed
        ? this.timeContext.getBounds()
        : this.openmct.time.getClockOffsets();
    },
    setBounds(bounds, isTick) {
      if (this.isFixed || !isTick) {
        this.bounds = bounds;
      }
    },
    saveFixedBounds(bounds) {
      this.$emit('fixed-bounds-updated', bounds);
    },
    saveClockOffsets(offsets) {
      this.$emit('clock-offsets-updated', offsets);
    },
    saveClock(clockOptions) {
      this.$emit('clock-updated', clockOptions);
    },
    saveMode(mode) {
      this.$emit('mode-updated', mode);
    },
    saveIndependentMode(mode) {
      this.$emit('independent-mode-updated', mode);
    },
    saveIndependentClock(clockKey) {
      this.$emit('independent-clock-updated', clockKey);
    },
    dismiss() {
      this.$emit('dismiss');
    }
  }
};
</script>
