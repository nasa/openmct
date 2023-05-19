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
  <swim-lane :is-nested="isNested" :status="status">
    <template slot="label">
      {{ heading }}
    </template>
    <template slot="object">
      <svg :height="height" :width="width">
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
        <template v-for="(activity, index) in activities">
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
            :key="`g-${activity.clipPathId}`"
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
        <text
          v-if="activities.length === 0"
          x="10"
          y="20"
          class="c-plan__activity-label--outside-rect"
        >
          No activities within current timeframe
        </text>
      </svg>
    </template>
  </swim-lane>
</template>

<script>
import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

export default {
  components: {
    SwimLane
  },
  inject: ['openmct', 'domainObject'],
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
  data() {
    return {
      lineHeight: 10
    };
  },
  methods: {
    setSelectionForActivity(activity, event) {
      const element = event.currentTarget;
      const multiSelect = event.metaKey;

      event.stopPropagation();

      this.openmct.selection.select(
        [
          {
            element: element,
            context: {
              type: 'activity',
              activity: activity
            }
          },
          {
            element: this.openmct.layout.$refs.browseObject.$el,
            context: {
              item: this.domainObject,
              supportsMultiSelect: true
            }
          }
        ],
        multiSelect
      );
    }
  }
};
</script>
