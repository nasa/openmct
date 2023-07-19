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
  <time-popup-fixed
    v-if="readOnly === false"
    :input-bounds="bounds"
    :input-time-system="timeSystem"
    @focus="$event.target.select()"
    @update="setBoundsFromView"
    @dismiss="dismiss"
  />
  <div v-else class="c-compact-tc__setting-wrapper">
    <div
      class="c-compact-tc__setting-value u-fade-truncate--lg --no-sep"
      :title="`Start bounds: ${formattedBounds.start}`"
    >
      {{ formattedBounds.start }}
    </div>
    <div class="c-compact-tc__bounds__start-end-sep icon-arrows-right-left"></div>
    <div
      class="c-compact-tc__setting-value u-fade-truncate--lg --no-sep"
      :title="`End bounds: ${formattedBounds.end}`"
    >
      {{ formattedBounds.end }}
    </div>
  </div>
</template>

<script>
import TimePopupFixed from './timePopupFixed.vue';
import _ from 'lodash';
import { TIME_CONTEXT_EVENTS } from '../../api/time/constants';

export default {
  components: {
    TimePopupFixed
  },
  inject: ['openmct'],
  props: {
    inputBounds: {
      type: Object,
      default() {
        return undefined;
      }
    },
    objectPath: {
      type: Array,
      default() {
        return [];
      }
    },
    readOnly: {
      type: Boolean,
      default() {
        return false;
      }
    },
    compact: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    const timeSystem = this.openmct.time.getTimeSystem();
    const timeFormatter = this.getFormatter(timeSystem.timeFormat);
    let bounds = this.inputBounds || this.openmct.time.getBounds();

    return {
      timeSystem,
      timeFormatter,
      bounds: {
        start: bounds.start,
        end: bounds.end
      },
      formattedBounds: {
        start: timeFormatter.format(bounds.start),
        end: timeFormatter.format(bounds.end)
      },
      isUTCBased: timeSystem.isUTCBased
    };
  },
  watch: {
    objectPath: {
      handler(newPath, oldPath) {
        if (newPath === oldPath) {
          return;
        }

        this.setTimeContext();
      },
      deep: true
    },
    inputBounds: {
      handler(newBounds) {
        this.handleNewBounds(newBounds);
      },
      deep: true
    }
  },
  mounted() {
    this.handleNewBounds = _.throttle(this.handleNewBounds, 300);
    this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.getTimeSystem())));
    this.openmct.time.on(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
    this.setTimeContext();
  },
  beforeUnmount() {
    this.openmct.time.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
    this.stopFollowingTimeContext();
  },
  methods: {
    setTimeContext() {
      this.stopFollowingTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.objectPath);

      this.handleNewBounds(this.timeContext.getBounds());
      this.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
      }
    },
    handleNewBounds(bounds) {
      this.setBounds(bounds);
      this.setViewFromBounds(bounds);
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setViewFromBounds(bounds) {
      this.formattedBounds.start = this.timeFormatter.format(bounds.start);
      this.formattedBounds.end = this.timeFormatter.format(bounds.end);
    },
    setTimeSystem(timeSystem) {
      this.timeSystem = timeSystem;
      this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
      this.isUTCBased = timeSystem.isUTCBased;
    },
    getFormatter(key) {
      return this.openmct.telemetry.getValueFormatter({
        format: key
      }).formatter;
    },
    setBoundsFromView(bounds) {
      this.$emit('boundsUpdated', {
        start: bounds.start,
        end: bounds.end
      });
    },
    dismiss() {
      this.$emit('dismissInputsFixed');
    }
  }
};
</script>
