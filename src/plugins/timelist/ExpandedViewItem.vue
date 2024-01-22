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
    <div class="c-tli__graphic">
      <svg viewBox="0 0 100 100">
        <g class="c-tli__graphic__pie">
          <circle class="c-svg-progress__bg" r="50" cx="50" cy="50"></circle>
          <path
            id="svg-progress-path"
            class="c-svg-progress__progress"
            d="M 50 0 A 50 50 0 1 1 48.3 100 L 50 50 L 50 0 Z"
          ></path>
          <circle
            class="c-svg-progress__ticks"
            r="40"
            cx="50"
            cy="50"
            stroke-dasharray="3 7.472"
          ></circle>
        </g>
        <path class="c-tli__graphic__check" d="M80 20L42.5 57.5L20 35V57.5L42.5 80L80 42.5V20Z" />
        <path
          class="c-tli__graphic__alert-triangle"
          d="M79.4533 70.3034L54.004 25.7641C51.8962 22.0786 48.4636 22.0786 46.3559 25.7641L20.8946 70.3034C18.7868 73.989 20.5332 77 24.7728 77H75.563C79.8146 77 81.561 73.989 79.4533 70.3034ZM54.028 73.1459H46.3198V65.4376H54.028V73.1459ZM55.3409 50.0211L53.0645 61.5835H47.2833L45.007 50.0211V34.6045H55.3529V50.0211H55.3409Z"
        />
        <g class="c-tli__graphic__circle-slash">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M50 82C67.6731 82 82 67.6731 82 50C82 32.3269 67.6731 18 50 18C32.3269 18 18 32.3269 18 50C18 67.6731 32.3269 82 50 82ZM50 72C62.1503 72 72 62.1503 72 50C72 37.8497 62.1503 28 50 28C37.8497 28 28 37.8497 28 50C28 62.1503 37.8497 72 50 72Z"
          />
          <path
            d="M63.7886 29.6404L70.8596 36.7114L36.2114 71.3596L29.1404 64.2886L63.7886 29.6404Z"
          />
        </g>
      </svg>
    </div>
    <div class="c-tli__time-hero">
      <div class="c-tli__time-hero-context-and-time">
        <div class="c-tli__time-hero-context">{{ formattedItemValue.label }}</div>
        <div v-if="showTimeHero" class="c-tli__time-hero-time --is-countdown">
          {{ formattedItemValue.countdown }}
        </div>
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
      /* TODO: add ability to return these strings for the following cases:
      - 'In Progress' : itemState.inProgress
      - 'Running Long' : itemState.inProgress && now > end datetime
      - 'Overdue' : itemState.notStarted && now > start datetime
      - 'Incomplete' : itemState.notStarted && now > end datetime
      - 'Starts' : for Activities with now > start datetime
      - 'Occurs' : for Events with now > start datetime
      - 'Ends' : itemState.inProgress && now > start datetime && now < end datetime
      - 'Completed', 'Aborted', 'Skipped' : itemState.<that state>
       */
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
    },
    showTimeHero() {
      return !(
        this.itemState === ITEM_STATES.completed ||
        this.itemState === ITEM_STATES.aborted ||
        this.itemState === ITEM_STATES.skipped
      );
    }
  }
};
</script>
