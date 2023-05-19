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
  <div class="u-contents" :class="[{ 'c-swimlane': !isNested }, statusClass]">
    <div
      v-if="hideLabel === false"
      class="c-swimlane__lane-label c-object-label"
      :class="[swimlaneClass, statusClass]"
      :style="gridRowSpan"
    >
      <div v-if="iconClass" class="c-object-label__type-icon" :class="iconClass">
        <span v-if="status" class="is-status__indicator" :title="`This item is ${status}`"></span>
      </div>

      <div class="c-object-label__name">
        <slot name="label"></slot>
      </div>
    </div>
    <div
      class="c-swimlane__lane-object"
      :style="{ 'min-height': minHeight }"
      :class="{ 'u-contents': showUcontents }"
    >
      <slot name="object"></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    iconClass: {
      type: String,
      default() {
        return '';
      }
    },
    status: {
      type: String,
      default() {
        return '';
      }
    },
    minHeight: {
      type: String,
      default() {
        return '';
      }
    },
    showUcontents: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isHidden: {
      type: Boolean,
      default() {
        return false;
      }
    },
    hideLabel: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isNested: {
      type: Boolean,
      default() {
        return false;
      }
    },
    spanRowsCount: {
      type: Number,
      default() {
        return 0;
      }
    }
  },
  computed: {
    gridRowSpan() {
      if (this.spanRowsCount) {
        return `grid-row: span ${this.spanRowsCount}`;
      } else {
        return '';
      }
    },

    swimlaneClass() {
      if (!this.spanRowsCount && !this.isNested) {
        return 'c-swimlane__lane-label--span-cols';
      }

      return '';
    },

    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    }
  }
};
</script>
