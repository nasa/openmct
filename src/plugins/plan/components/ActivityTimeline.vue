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
  <SwimLane :is-nested="isNested" :status="status">
    <template #label>
      {{ heading }}
    </template>
    <template #object>
      <div class="c-plan-av" :style="alignmentStyle">
        <svg v-if="activities.length > 0" class="c-plan-av__svg" :height="height">
          <symbol id="activity-bar-bg" :height="rowHeight" width="2" preserveAspectRatio="none">
            <rect x="0" y="0" width="100%" height="100%" fill="currentColor" />
            <line
              x1="100%"
              y1="0"
              x2="100%"
              y2="100%"
              stroke="black"
              stroke-width="1"
              opacity="0.3"
              transform="translate(-0.5, 0)"
            />
          </symbol>
          <template v-for="(activity, index) in activities" :key="`g-${activity.clipPathId}`">
            <template v-if="clipActivityNames === true">
              <clipPath :id="activity.clipPathId" :key="activity.clipPathId">
                <rect
                  :x="activity.rectStart"
                  :y="activity.row"
                  :width="activity.rectWidth - 1"
                  :height="rowHeight"
                />
              </clipPath>
            </template>
            <g
              class="c-plan__activity activity-bounds"
              @click="setSelectionForActivity(activity, $event)"
            >
              <title>{{ activity.name }}</title>
              <use
                :key="`rect-${index}`"
                href="#activity-bar-bg"
                :x="activity.rectStart"
                :y="activity.row"
                :width="activity.rectWidth"
                :height="rowHeight"
                :class="activity.class"
                :color="activity.color"
              />
              <text
                v-for="(textLine, textIndex) in activity.textLines"
                :key="`text-${index}-${textIndex}`"
                :class="`c-plan__activity-label ${activity.textClass}`"
                :x="activity.textStart"
                :y="activity.textY + textIndex * lineHeight"
                :fill="activity.textColor"
                :clip-path="clipActivityNames === true ? `url(#${activity.clipPathId})` : ''"
              >
                {{ textLine }}
              </text>
            </g>
          </template>
        </svg>
        <div v-else class="c-timeline__no-items">No activities within timeframe</div>
      </div>
    </template>
  </SwimLane>
</template>

<script>
const AXES_PADDING = 20;

import { inject } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

import { useAlignment } from '../../../ui/composables/alignmentContext.js';

export default {
  components: {
    SwimLane
  },
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    activities: {
      type: Array,
      required: true
    },
    clipActivityNames: {
      type: Boolean,
      default: false
    },
    heading: {
      type: String,
      required: true
    },
    height: {
      type: Number,
      default: 30
    },
    width: {
      type: Number,
      default: 200
    },
    isNested: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default() {
        return '';
      }
    },
    rowHeight: {
      type: Number,
      default: 22
    }
  },
  emits: ['activity-selected'],
  setup() {
    const domainObject = inject('domainObject');
    const path = inject('path');
    const openmct = inject('openmct');
    const { alignment: alignmentData, reset: resetAlignment } = useAlignment(
      domainObject,
      path,
      openmct
    );

    return { alignmentData, resetAlignment };
  },
  data() {
    return {
      lineHeight: 10
    };
  },
  computed: {
    alignmentStyle() {
      let leftOffset = 0;
      const rightOffset = this.alignmentData.rightWidth ? AXES_PADDING : 0;
      if (this.alignmentData.leftWidth) {
        leftOffset = this.alignmentData.multiple ? 2 * AXES_PADDING : AXES_PADDING;
      }
      return {
        margin: `0 ${this.alignmentData.rightWidth + rightOffset}px 0 ${this.alignmentData.leftWidth + leftOffset}px`
      };
    }
  },
  methods: {
    setSelectionForActivity(activity, event) {
      event.stopPropagation();
      this.$emit('activity-selected', {
        event,
        selection: activity.selection
      });
    }
  }
};
</script>
