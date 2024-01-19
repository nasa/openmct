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
  <div :class="listItemClass">
    <div class="c-tli__activity-color">
      <div class="c-tli__activity-color-swatch" :style="styleClass"></div>
    </div>
    <div class="c-tli__title-and-bounds">
      <div class="c-tli__title">{{ formattedItemValue.title }}</div>
      <div class="c-tli__bounds" :class="{ '--has-duration': formattedItemValue.end }">
        <div class="c-tli__duration">{{ formattedItemValue.duration }}</div>
        <div class="c-tli__start-time">
          {{ formattedItemValue.start }}
        </div>
        <div class="c-tli__end-time">{{ formattedItemValue.end }}</div>
      </div>
    </div>
    <div class="c-tli__progress-pie">
      <svg viewBox="0 0 100 100" class="c-tli__progress-pie-svg">
        <circle class="c-svg-progress__bg" r="50" cx="50" cy="50"></circle>
        <path id="svg-progress-path" class="c-svg-progress__progress"></path>
        <circle
          class="c-svg-progress__ticks"
          r="40"
          cx="50"
          cy="50"
          stroke-dasharray="3 7.472"
        ></circle>
      </svg>
    </div>
    <div class="c-tli__time-hero">
      <div class="c-tli__time-hero-context-and-time">
        <div class="c-tli__time-hero-context">{{ formattedItemValue.label }}</div>
        <div class="c-tli__time-hero-time --is-countdown">{{ formattedItemValue.countdown }}</div>
      </div>
    </div>
  </div>
</template>

<script>
const CURRENT_CSS_SUFFIX = '--is-current';
const PAST_CSS_SUFFIX = '--is-past';
const FUTURE_CSS_SUFFIX = '--is-future';

const ITEM_COLORS = {
  [CURRENT_CSS_SUFFIX]: '#ffcc00',
  [PAST_CSS_SUFFIX]: '#0088ff',
  [FUTURE_CSS_SUFFIX]: '#7300ff'
};

const ITEM_STATES = {
  notStarted: 'not-started',
  inProgress: 'in-progress',
  completed: 'completed',
  aborted: 'aborted',
  skipped: 'skipped',
  incomplete: 'incomplete',
  overdue: 'overdue',
  runningLong: 'running-long'
};

export default {
  inject: ['openmct'],
  props: {
    item: {
      type: Object,
      required: true
    },
    itemProperties: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      itemState: ITEM_STATES.notStarted
    };
  },
  computed: {
    styleClass() {
      return { backgroundColor: ITEM_COLORS[this.item.cssClass] };
    },
    listItemClass() {
      const timeRelationClass = this.item.cssClass;
      const itemStateClass = `--is-${this.itemState}`;
      return `c-tli ${timeRelationClass} ${itemStateClass}`;
    },
    formattedItemValue() {
      let itemValue = {
        title: this.item.name
      };
      this.itemProperties.forEach((itemProperty) => {
        let value = this.item[itemProperty.property];
        let formattedValue;
        if (itemProperty.format) {
          formattedValue = itemProperty.format(
            value,
            this.item,
            itemProperty.property,
            this.openmct,
            {
              skipPrefix: true
            }
          );
        }
        itemValue[itemProperty.property] = formattedValue;

        let label;
        if (itemProperty.property === 'countdown') {
          label = value > 0 ? 'Starts' : 'Ended';
        }
        itemValue.label = itemValue.label ?? label;
      });

      return itemValue;
    }
  }
};
</script>
