<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
  <div
    ref="timeConductorOptionsHolder"
    class="c-compact-tc"
    :class="[
      isFixed ? 'is-fixed-mode' : independentTCEnabled ? 'is-realtime-mode' : 'is-fixed-mode',
      { 'is-expanded': independentTCEnabled }
    ]"
  >
    <toggle-switch
      id="independentTCToggle"
      class="c-toggle-switch--mini"
      :checked="independentTCEnabled"
      :title="toggleTitle"
      @change="toggleIndependentTC"
    />

    <ConductorModeIcon />

    <conductor-inputs-fixed
      v-if="showFixedInputs"
      class="c-compact-tc__bounds--fixed"
      :object-path="objectPath"
      :read-only="true"
      :compact="true"
    />

    <conductor-inputs-realtime
      v-if="showRealtimeInputs"
      class="c-compact-tc__bounds--real-time"
      :object-path="objectPath"
      :read-only="true"
      :compact="true"
    />
    <div
      v-if="independentTCEnabled"
      class="c-not-button c-not-button--compact c-compact-tc__gear icon-gear"
    ></div>

    <conductor-pop-up
      v-if="showConductorPopup"
      ref="conductorPopup"
      :object-path="objectPath"
      :is-independent="true"
      :time-options="timeOptions"
      :is-fixed="isFixed"
      :bottom="true"
      :position-x="positionX"
      :position-y="positionY"
      @popupLoaded="initializePopup"
      @independentModeUpdated="saveMode"
      @independentClockUpdated="saveClock"
      @fixedBoundsUpdated="saveFixedBounds"
      @clockOffsetsUpdated="saveClockOffsets"
      @dismiss="clearPopup"
    />
  </div>
</template>

<script>
import { TIME_CONTEXT_EVENTS, FIXED_MODE_KEY } from '../../../api/time/constants';
import ConductorInputsFixed from '../ConductorInputsFixed.vue';
import ConductorInputsRealtime from '../ConductorInputsRealtime.vue';
import ConductorModeIcon from '@/plugins/timeConductor/ConductorModeIcon.vue';
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import ConductorPopUp from '../ConductorPopUp.vue';
import independentTimeConductorPopUpManager from './independentTimeConductorPopUpManager';

export default {
  components: {
    ConductorModeIcon,
    ConductorInputsRealtime,
    ConductorInputsFixed,
    ConductorPopUp,
    ToggleSwitch
  },
  mixins: [independentTimeConductorPopUpManager],
  inject: {
    openmct: 'openmct',
    configuration: {
      from: 'configuration',
      default: undefined
    }
  },
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    }
  },
  data() {
    const fixedOffsets = this.openmct.time.getBounds();
    const clockOffsets = this.openmct.time.getClockOffsets();
    const clock = this.openmct.time.getClock().key;
    const mode = this.openmct.time.getMode();
    const timeOptions = this.domainObject.configuration.timeOptions ?? {
      clockOffsets,
      fixedOffsets
    };

    timeOptions.clock = timeOptions.clock ?? clock;
    timeOptions.mode = timeOptions.mode ?? mode;

    // check for older configurations that stored a key
    if (timeOptions.mode.key) {
      timeOptions.mode = timeOptions.mode.key;
    }

    const isFixed = timeOptions.mode === FIXED_MODE_KEY;

    return {
      timeOptions,
      isFixed,
      independentTCEnabled: this.domainObject.configuration.useIndependentTime === true,
      viewBounds: {
        start: fixedOffsets.start,
        end: fixedOffsets.end
      }
    };
  },
  computed: {
    toggleTitle() {
      return `${this.independentTCEnabled ? 'Disable' : 'Enable'} independent Time Conductor`;
    },
    showFixedInputs() {
      return this.isFixed && this.independentTCEnabled;
    },
    showRealtimeInputs() {
      return !this.isFixed && this.independentTCEnabled;
    }
  },
  watch: {
    domainObject: {
      handler(domainObject) {
        const key = this.openmct.objects.makeKeyString(domainObject.identifier);
        if (key !== this.keyString) {
          //domain object has changed
          this.destroyIndependentTime();

          this.independentTCEnabled = domainObject.configuration.useIndependentTime === true;
          this.timeOptions = domainObject.configuration.timeOptions ?? {
            clockOffsets: this.openmct.time.getClockOffsets(),
            fixedOffsets: this.openmct.time.getBounds()
          };

          // these may not be set due to older configurations
          this.timeOptions.clock = this.timeOptions.clock ?? this.openmct.time.getClock().key;
          this.timeOptions.mode = this.timeOptions.mode ?? this.openmct.time.getMode();

          // check for older configurations that stored a key
          if (this.timeOptions.mode.key) {
            this.timeOptions.mode = this.timeOptions.mode.key;
          }

          this.isFixed = this.timeOptions.mode === FIXED_MODE_KEY;

          this.initialize();
        }
      },
      deep: true
    },
    objectPath: {
      handler(newPath, oldPath) {
        //domain object or view has probably changed
        this.setTimeContext();
      },
      deep: true
    }
  },
  mounted() {
    this.initialize();
  },
  beforeUnmount() {
    this.stopFollowingTimeContext();
    this.destroyIndependentTime();
  },
  methods: {
    initialize() {
      this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
      this.setTimeContext();

      if (this.independentTCEnabled) {
        this.registerIndependentTimeOffsets();
      }
    },
    toggleIndependentTC() {
      this.independentTCEnabled = !this.independentTCEnabled;

      if (this.independentTCEnabled) {
        this.registerIndependentTimeOffsets();
      } else {
        this.clearPopup();
        this.destroyIndependentTime();
      }

      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.useIndependentTime',
        this.independentTCEnabled
      );
    },
    setTimeContext() {
      if (this.timeContext) {
        this.stopFollowingTimeContext();
      }

      this.timeContext = this.openmct.time.getContextForView(this.objectPath);
      this.timeContext.on(TIME_CONTEXT_EVENTS.clockChanged, this.setTimeOptionsClock);
      this.timeContext.on(TIME_CONTEXT_EVENTS.modeChanged, this.setTimeOptionsMode);
    },
    stopFollowingTimeContext() {
      this.timeContext.off(TIME_CONTEXT_EVENTS.clockChanged, this.setTimeOptionsClock);
      this.timeContext.off(TIME_CONTEXT_EVENTS.modeChanged, this.setTimeOptionsMode);
    },
    setTimeOptionsClock(clock) {
      this.setTimeOptionsOffsets();
      this.timeOptions.clock = clock.key;
    },
    setTimeOptionsMode(mode) {
      this.setTimeOptionsOffsets();
      this.timeOptions.mode = mode;
    },
    setTimeOptionsOffsets() {
      this.timeOptions.clockOffsets =
        this.timeOptions.clockOffsets ?? this.timeContext.getClockOffsets();
      this.timeOptions.fixedOffsets = this.timeOptions.fixedOffsets ?? this.timeContext.getBounds();
    },
    saveFixedBounds(bounds) {
      const newOptions = this.updateTimeOptionProperty({
        fixedOffsets: bounds
      });
      this.updateTimeOptions(newOptions);
    },
    saveClockOffsets(offsets) {
      const newOptions = this.updateTimeOptionProperty({
        clockOffsets: offsets
      });

      this.updateTimeOptions(newOptions);
    },
    saveMode(mode) {
      this.isFixed = mode === FIXED_MODE_KEY;
      const newOptions = this.updateTimeOptionProperty({
        mode: mode
      });

      this.updateTimeOptions(newOptions);
    },
    saveClock(clock) {
      const newOptions = this.updateTimeOptionProperty({
        clock
      });

      this.updateTimeOptions(newOptions);
    },
    updateTimeOptions(options) {
      this.timeOptions = options;

      this.registerIndependentTimeOffsets();
      this.$emit('updated', this.timeOptions); // no longer use this, but may be used elsewhere
      this.openmct.objects.mutate(this.domainObject, 'configuration.timeOptions', this.timeOptions);
    },
    registerIndependentTimeOffsets() {
      const timeContext = this.openmct.time.getIndependentContext(this.keyString);
      let offsets;

      if (this.isFixed) {
        offsets = this.timeOptions.fixedOffsets ?? this.timeContext.getBounds();
      } else {
        offsets = this.timeOptions.clockOffsets ?? this.openmct.time.getClockOffsets();
      }

      if (!timeContext.hasOwnContext()) {
        this.unregisterIndependentTime = this.openmct.time.addIndependentContext(
          this.keyString,
          offsets,
          this.isFixed ? undefined : this.timeOptions.clock
        );
      } else {
        if (!this.isFixed) {
          timeContext.setClock(this.timeOptions.clock);
        }

        timeContext.setMode(this.timeOptions.mode, offsets);
      }
    },
    destroyIndependentTime() {
      if (this.unregisterIndependentTime) {
        this.unregisterIndependentTime();
      }
    },
    updateTimeOptionProperty(option) {
      return Object.assign({}, this.timeOptions, option);
    }
  }
};
</script>
