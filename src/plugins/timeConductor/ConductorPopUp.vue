<template>
  <div ref="conductorPopupElement" class="c-tc-input-popup" :class="popupClasses" :style="position">
    <div class="c-tc-input-popup__options" aria-label="Time Conductor Options">
      <IndependentMode
        v-if="isIndependent"
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's mode."
      />
      <ConductorMode
        v-else
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's mode."
        :defer-changes="true"
        @mode-selected="setPendingTimeMode"
      />
      <IndependentClock
        v-if="isIndependent"
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's clock."
      />
      <ConductorClock
        v-else
        class="c-conductor__mode-select"
        title="Sets the Time Conductor's clock."
      />
      <!-- TODO: Time system and history must work even with ITC later -->
      <ConductorTimeSystem
        v-if="!isIndependent"
        class="c-conductor__time-system-select"
        title="Sets the Time Conductor's time system."
      />
    </div>
    <ConductorInputsFixed
      v-if="isDisplayedFixedTimeMode"
      @dismiss-inputs-fixed="dismiss"
      @submit="commitPendingTimeMode"
    />
    <ConductorInputsRealtime
      v-else
      @dismiss-inputs-realtime="dismiss"
      @submit="commitPendingTimeMode"
    />
  </div>
</template>

<script>
import { ref } from 'vue';

import { FIXED_MODE_KEY } from '../../api/time/constants.js';
import ConductorClock from './ConductorClock.vue';
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
    ConductorInputsFixed,
    ConductorInputsRealtime
  },
  inject: ['openmct', 'isFixedTimeMode', 'timeContext', 'timeMode'],
  props: {
    positionX: {
      type: Number,
      required: true
    },
    positionY: {
      type: Number,
      required: true
    },
    isIndependent: {
      type: Boolean,
      default() {
        return false;
      }
    },
    bottom: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  emits: ['popup-loaded', 'dismiss'],
  setup(props) {
    const conductorPopupElement = ref(null);
    return {
      conductorPopupElement
    };
  },
  data() {
    return {
      pendingTimeMode: this.timeMode
    };
  },
  computed: {
    isDisplayedFixedTimeMode() {
      return this.isIndependent ? this.isFixedTimeMode : this.pendingTimeMode === FIXED_MODE_KEY;
    },
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
      const mode = this.isDisplayedFixedTimeMode ? 'fixed-mode' : 'realtime-mode';
      const independentClass = this.isIndependent ? 'itc-popout ' : '';

      return `${independentClass}${value}c-tc-input-popup--${mode}`;
    }
  },
  mounted() {
    this.$emit('popup-loaded');
  },
  methods: {
    setPendingTimeMode(mode) {
      this.pendingTimeMode = mode;
    },
    commitPendingTimeMode() {
      if (!this.isIndependent && this.pendingTimeMode !== this.timeMode) {
        this.timeContext.setMode(this.pendingTimeMode);
      }
    },
    dismiss() {
      this.$emit('dismiss');
    }
  }
};
</script>
