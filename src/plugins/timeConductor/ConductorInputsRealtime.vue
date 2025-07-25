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

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
  <TimePopupRealtime
    v-if="readOnly === false"
    :offsets="formattedOffsets"
    @focus="$event.target.select()"
    @dismiss="dismiss"
  />
  <div v-else class="c-compact-tc__setting-wrapper">
    <div
      v-if="!compact"
      class="c-compact-tc__setting-value icon-minus u-fade-truncate--lg --no-sep"
      :aria-label="`Start offset: ${formattedOffsets.start}`"
      :title="`Start offset: ${formattedOffsets.start}`"
    >
      {{ formattedOffsets.start }}
    </div>
    <div v-if="!compact" class="c-compact-tc__bounds__start-end-sep icon-arrows-right-left"></div>
    <div
      v-if="!compact"
      class="c-compact-tc__setting-value icon-plus u-fade-truncate--lg"
      :class="{ '--no-sep': compact }"
      :aria-label="`End offset: ${formattedOffsets.end}`"
      :title="`End offset: ${formattedOffsets.end}`"
    >
      {{ formattedOffsets.end }}
    </div>
    <div
      class="c-compact-tc__setting-value icon-clock c-compact-tc__current-update u-fade-truncate--lg --no-sep"
      aria-label="Last update"
      title="Last update"
    >
      {{ formattedCurrentValue }}
    </div>
    <div class="u-flex-spreader"></div>
  </div>
</template>

<script>
import TimePopupRealtime from './TimePopupRealtime.vue';

export default {
  components: {
    TimePopupRealtime
  },
  inject: [
    'openmct',
    'bounds',
    'clock',
    'offsets',
    'timeSystemFormatter',
    'timeSystemDurationFormatter'
  ],
  props: {
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
  emits: ['dismiss-inputs-realtime'],
  data() {
    return {
      currentValue: this.clock.currentValue()
    };
  },
  computed: {
    formattedOffsets() {
      return {
        start: this.timeSystemDurationFormatter.format(Math.abs(this.offsets.start)),
        end: this.timeSystemDurationFormatter.format(Math.abs(this.offsets.end))
      };
    },
    formattedCurrentValue() {
      return this.timeSystemFormatter.format(this.currentValue);
    }
  },
  watch: {
    bounds() {
      this.updateCurrentValue();
    }
  },
  methods: {
    updateCurrentValue() {
      this.currentValue = this.clock.currentValue();
    },
    dismiss() {
      this.$emit('dismiss-inputs-realtime');
    }
  }
};
</script>
