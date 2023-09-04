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
  <div ref="tickContainer" class="u-contents js-ticks">
    <div v-if="position === 'left'" class="gl-plot-tick-wrapper">
      <div
        v-for="(tick, i) in ticks"
        :key="'tick-left' + i"
        class="gl-plot-tick gl-plot-x-tick-label"
        :style="{
          left: (100 * (tick.value - min)) / interval + '%'
        }"
        :title="tick.fullText || tick.text"
      >
        {{ tick.text }}
      </div>
    </div>
    <div v-if="position === 'top'" class="gl-plot-tick-wrapper">
      <div
        v-for="(tick, i) in ticks"
        :key="'tick-top' + i"
        class="gl-plot-tick gl-plot-y-tick-label"
        :style="{ top: (100 * (max - tick.value)) / interval + '%' }"
        :title="tick.fullText || tick.text"
        style="margin-top: -0.5em; direction: ltr"
      >
        <span>{{ tick.text }}</span>
      </div>
    </div>
    <!-- grid lines follow -->
    <template v-if="position === 'right'">
      <div
        v-for="(tick, i) in ticks"
        :key="'tick-right' + i"
        class="gl-plot-hash hash-v"
        :style="{
          right: (100 * (max - tick.value)) / interval + '%',
          height: '100%'
        }"
      ></div>
    </template>
    <template v-if="position === 'bottom'">
      <div
        v-for="(tick, i) in ticks"
        :key="'tick-bottom' + i"
        class="gl-plot-hash hash-h"
        :style="{ bottom: (100 * (tick.value - min)) / interval + '%', width: '100%' }"
      ></div>
    </template>
  </div>
</template>

<script>
import configStore from './configuration/ConfigStore';
import eventHelpers from './lib/eventHelpers';
import { getFormattedTicks, getLogTicks, ticks } from './tickUtils';

const SECONDARY_TICK_NUMBER = 2;

export default {
  inject: ['openmct', 'domainObject'],
  props: {
    axisType: {
      type: String,
      default() {
        return '';
      },
      required: true
    },
    // Make it a prop, then later we can allow user to change it via UI input
    tickCount: {
      type: Number,
      default() {
        return 6;
      }
    },
    axisId: {
      type: Number,
      default() {
        return null;
      }
    },
    position: {
      required: true,
      type: String,
      default() {
        return '';
      }
    }
  },
  data() {
    return {
      ticks: []
    };
  },
  mounted() {
    eventHelpers.extend(this);

    if (!this.axisType) {
      throw new Error('axis-type prop expected');
    }

    this.axis = this.getAxisFromConfig();

    this.tickUpdate = false;
    this.listenTo(this.axis, 'change:displayRange', this.updateTicks, this);
    this.listenTo(this.axis, 'change:format', this.updateTicks, this);
    this.listenTo(this.axis, 'change:key', this.updateTicksForceRegeneration, this);
    this.updateTicks();
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    getAxisFromConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      /** @type {import('./configuration/PlotConfigurationModel').default} */
      let config = configStore.get(configId);

      if (!config) {
        throw new Error('config is missing');
      }

      if (this.axisType === 'yAxis') {
        if (this.axisId && this.axisId !== config.yAxis.id) {
          return config.additionalYAxes.find((axis) => axis.id === this.axisId);
        } else {
          return config.yAxis;
        }
      } else {
        return config[this.axisType];
      }
    },
    /**
     * Determine whether ticks should be regenerated for a given range.
     * Ticks are updated
     * a) if they don't exist,
     * b) if existing ticks are outside of given range,
     * c) if range exceeds size of tick range by more than one tick step,
     * d) if forced to regenerate (ex. changing x-axis metadata).
     *
     */
    shouldRegenerateTicks(range, forceRegeneration) {
      if (forceRegeneration) {
        return true;
      }

      if (!this.tickRange || !this.ticks || !this.ticks.length) {
        return true;
      }

      if (this.tickRange.max > range.max || this.tickRange.min < range.min) {
        return true;
      }

      if (Math.abs(range.max - this.tickRange.max) > this.tickRange.step) {
        return true;
      }

      if (Math.abs(this.tickRange.min - range.min) > this.tickRange.step) {
        return true;
      }

      return false;
    },

    getTicks() {
      const number = this.tickCount;
      const clampRange = this.axis.get('values');
      const range = this.axis.get('displayRange');
      if (clampRange) {
        return clampRange.filter(function (value) {
          return value <= range.max && value >= range.min;
        }, this);
      }

      if (this.axisType === 'yAxis' && this.axis.get('logMode')) {
        return getLogTicks(range.min, range.max, number, SECONDARY_TICK_NUMBER);
      } else {
        return ticks(range.min, range.max, number);
      }
    },

    updateTicksForceRegeneration() {
      this.updateTicks(true);
    },

    updateTicks(forceRegeneration = false) {
      const range = this.axis.get('displayRange');

      if (!range) {
        delete this.min;
        delete this.max;
        delete this.interval;
        delete this.tickRange;
        this.ticks = [];
        delete this.shouldCheckWidth;

        return;
      }

      const format = this.axis.get('format');
      if (!format) {
        return;
      }

      this.min = range.min;
      this.max = range.max;
      this.interval = Math.abs(range.min - range.max);
      if (this.shouldRegenerateTicks(range, forceRegeneration)) {
        let newTicks = this.getTicks();
        this.tickRange = {
          min: Math.min(...newTicks),
          max: Math.max(...newTicks),
          step: newTicks[1] - newTicks[0]
        };

        newTicks = getFormattedTicks(newTicks, format);

        this.ticks = newTicks;
        this.shouldCheckWidth = true;
      }

      this.scheduleTickUpdate();
    },

    scheduleTickUpdate() {
      if (this.tickUpdate) {
        return;
      }

      this.tickUpdate = true;
      setTimeout(this.doTickUpdate.bind(this), 0);
    },

    doTickUpdate() {
      if (this.shouldCheckWidth) {
        const tickElements =
          this.$refs.tickContainer &&
          this.$refs.tickContainer.querySelectorAll('.gl-plot-tick > span');
        if (tickElements) {
          const tickWidth = Number(
            [].reduce.call(
              tickElements,
              function (memo, first) {
                return Math.max(memo, first.offsetWidth);
              },
              0
            )
          );

          this.tickWidth = tickWidth;
          this.$emit('plotTickWidth', {
            width: tickWidth,
            yAxisId: this.axisType === 'yAxis' ? this.axisId : ''
          });
          this.shouldCheckWidth = false;
        }
      }

      this.tickUpdate = false;
    }
  }
};
</script>
