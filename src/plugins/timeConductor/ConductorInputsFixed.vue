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
  <DateTimePopupFixed v-if="delimiter && !readOnly" :delimiter="delimiter" @focus="$event.target.select()" @dismiss="dismiss" />
  <TimePopupFixed v-else-if="!readOnly" @focus="$event.target.select()" @dismiss="dismiss" />
  <div v-else class="c-compact-tc__setting-wrapper">
    <div
      class="c-compact-tc__setting-value u-fade-truncate--lg --no-sep"
      :title="`Start bounds: ${formattedBounds.start}`"
      :aria-label="`Start bounds: ${formattedBounds.start}`"
    >
      {{ formattedBounds.start }}
    </div>
    <div class="c-compact-tc__bounds__start-end-sep icon-arrows-right-left"></div>
    <div
      class="c-compact-tc__setting-value u-fade-truncate--lg --no-sep"
      :title="`End bounds: ${formattedBounds.end}`"
      :aria-label="`End bounds: ${formattedBounds.end}`"
    >
      {{ formattedBounds.end }}
    </div>
  </div>
</template>

<script>
import TimePopupFixed from './TimePopupFixed.vue';
import DateTimePopupFixed from './DateTimePopupFixed.vue';

export default {
  components: {
    TimePopupFixed,
    DateTimePopupFixed
  },
  inject: ['openmct', 'timeContext', 'bounds', 'timeSystemFormatter'],
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
  emits: ['dismiss-inputs-fixed'],
  computed: {
    delimiter() {
      return this.timeSystemFormatter.getDelimiter?.();
    },
    formattedBounds() {
      return {
        start: this.timeSystemFormatter.format(this.bounds.start),
        end: this.timeSystemFormatter.format(this.bounds.end)
      };
    }
  },
  methods: {
    dismiss() {
      this.$emit('dismiss-inputs-fixed');
    }
  }
};
</script>
