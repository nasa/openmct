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
  <div :class="listItemClass" role="row">
    <div class="c-tli__activity-color">
      <div class="c-tli__activity-color-swatch" :style="styleClass"></div>
    </div>
    <div class="c-tli__title-and-bounds">
      <div class="c-tli__title">{{ formattedItem.title }}</div>
      <div class="c-tli__bounds" :class="{ '--has-duration': eventHasDuration }">
        <div v-if="eventHasDuration" class="c-tli__duration">{{ formattedItem.duration }}</div>
        <div v-else class="c-tli__start-time">Event</div>
        <div class="c-tli__start-time">
          {{ formattedItem.start }}
        </div>
        <div v-if="eventHasDuration" class="c-tli__end-time">{{ formattedItem.end }}</div>
      </div>
    </div>
    <div class="c-tli__graphic">
      <svg viewBox="0 0 100 100">
        <path
          aria-label="Activity complete"
          class="c-tli__graphic__check"
          d="M80 20L42.5 57.5L20 35V57.5L42.5 80L80 42.5V20Z"
        />
        <path
          aria-label="Activity alert"
          class="c-tli__graphic__alert-triangle"
          d="M79.4533 70.3034L54.004 25.7641C51.8962 22.0786 48.4636 22.0786 46.3559 25.7641L20.8946 70.3034C18.7868 73.989 20.5332 77 24.7728 77H75.563C79.8146 77 81.561 73.989 79.4533 70.3034ZM54.028 73.1459H46.3198V65.4376H54.028V73.1459ZM55.3409 50.0211L53.0645 61.5835H47.2833L45.007 50.0211V34.6045H55.3529V50.0211H55.3409Z"
        />
        <g aria-label="Activity aborted" class="c-tli__graphic__circle-slash">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M50 82C67.6731 82 82 67.6731 82 50C82 32.3269 67.6731 18 50 18C32.3269 18 18 32.3269 18 50C18 67.6731 32.3269 82 50 82ZM50 72C62.1503 72 72 62.1503 72 50C72 37.8497 62.1503 28 50 28C37.8497 28 28 37.8497 28 50C28 62.1503 37.8497 72 50 72Z"
          />
          <path
            d="M63.7886 29.6404L70.8596 36.7114L36.2114 71.3596L29.1404 64.2886L63.7886 29.6404Z"
          />
        </g>
        <path
          aria-label="Activity skipped"
          class="c-tli__graphic__skipped"
          d="M31 48C31 42.4772 35.5152 38 41 38H59C64.4848 38 69 42.4772 69 48V55H58L74 72L90 55H79V48C79 36.9543 69.9695 28 59 28H41C30.0305 28 21 36.9543 21 48V53.0294C21 56.8792 17.8232 60 14 60V70C23.308 70 31 62.402 31 53.0294V48Z"
        />
      </svg>
    </div>
    <div class="c-tli__time-hero">
      <div class="c-tli__time-hero-context-and-time">
        <div class="c-tli__time-hero-context">{{ formattedItemLabel }}</div>
        <div v-if="showTimeHero" :class="countdownClass">
          {{ formattedItem.countdown }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import { CURRENT_CSS_SUFFIX, FUTURE_CSS_SUFFIX, PAST_CSS_SUFFIX } from './constants.js';

const ITEM_COLORS = {
  [CURRENT_CSS_SUFFIX]: '#ffcc00',
  [PAST_CSS_SUFFIX]: '#0088ff',
  [FUTURE_CSS_SUFFIX]: '#7300ff'
};

const EXECUTION_STATES = {
  notStarted: 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  aborted: 'Aborted',
  skipped: 'Skipped'
};

const INFERRED_EXECUTION_STATES = {
  incomplete: 'Incomplete',
  overdue: 'Overdue',
  runningLong: 'Running Long',
  starts: 'Starts',
  occurs: 'Occurs',
  occurred: 'Occurred',
  ends: 'Ends',
  ended: 'Ended'
};

export default {
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    name: {
      type: String,
      default: ''
    },
    start: {
      type: Number,
      default: 0
    },
    end: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    countdown: {
      type: Number,
      default: 0
    },
    cssClass: {
      type: String,
      default: ''
    },
    itemProperties: {
      type: Array,
      required: true
    },
    executionState: {
      type: String,
      default: 'notStarted'
    }
  },
  data() {
    return {
      formattedItemLabel: ''
    };
  },
  computed: {
    countdownClass() {
      let cssClass = '';
      if (this.countdown < 0) {
        cssClass = '--is-countup';
      } else if (this.countdown > 0) {
        cssClass = '--is-countdown';
      }
      return `c-tli__time-hero-time ${cssClass}`;
    },
    styleClass() {
      return { backgroundColor: ITEM_COLORS[this.cssClass] };
    },
    isInProgress() {
      return this.executionState === 'in-progress';
    },
    eventHasDuration() {
      return this.start !== this.end;
    },
    listItemClass() {
      const timeRelationClass = this.cssClass;
      const executionStateClass = `--is-${this.executionState}`;
      return `c-tli ${timeRelationClass} ${executionStateClass}`;
    },
    formattedItem() {
      let itemValue = {
        title: this.name
      };
      this.itemProperties.forEach((itemProperty) => {
        let value = this[itemProperty.key];
        let formattedValue;
        if (itemProperty.format) {
          const itemStartDate = new Date(value).toDateString();
          const timestampDate = new Date(this.timestamp).toDateString();
          formattedValue = itemProperty.format(value, undefined, itemProperty.key, this.openmct, {
            skipPrefix: true,
            skipDateForToday: itemStartDate === timestampDate
          });
        }
        itemValue[itemProperty.key] = formattedValue;
      });

      return itemValue;
    },
    showTimeHero() {
      return !(
        this.executionState === EXECUTION_STATES.completed ||
        this.executionState === EXECUTION_STATES.aborted ||
        this.executionState === EXECUTION_STATES.skipped
      );
    }
  },
  created() {
    this.updateTimestamp = _.throttle(this.updateTimestamp, 1000);
    this.setTimeContext();
    this.timestamp = this.timeContext.now();
  },
  methods: {
    setTimeContext() {
      this.stopFollowingTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.path);
      this.followTimeContext();
    },
    followTimeContext() {
      this.timeContext.on(TIME_CONTEXT_EVENTS.tick, this.updateTimestamp);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off(TIME_CONTEXT_EVENTS.tick, this.updateTimestamp);
      }
    },
    updateTimestamp(time) {
      this.timestamp = time;
      this.formatItemLabel();
    },
    formatItemLabel() {
      let executionStateLabel;
      const executionStateKeys = Object.keys(EXECUTION_STATES);
      const executionStateIndex = executionStateKeys.findIndex(
        (key) => key === this.executionState
      );
      if (executionStateIndex > -1) {
        executionStateLabel = EXECUTION_STATES[executionStateIndex];
      }

      let label;
      if (this.start < this.timestamp) {
        // Start time is in the past
        if (this.start === this.end) {
          // - 'Occurred' : for Events with start < now datetime and 0 duration
          label = INFERRED_EXECUTION_STATES.occurred;
        }
        // end time has not yet passed
        else if (this.cssClass === CURRENT_CSS_SUFFIX) {
          if (executionStateIndex === 0) {
            // - 'Overdue' : executionState.notStarted && start < now datetime
            label = INFERRED_EXECUTION_STATES.overdue;
          } else {
            // - 'Ends' : executionState.inProgress && now > start datetime && now < end datetime
            label = INFERRED_EXECUTION_STATES.ends;
          }
        }
        // end time is also in the past
        else if (this.cssClass === PAST_CSS_SUFFIX) {
          if (executionStateIndex === 0) {
            // - 'Incomplete' : executionState.notStarted && now > end datetime
            label = INFERRED_EXECUTION_STATES.incomplete;
          } else if (executionStateIndex === 1) {
            // - 'Running Long' : executionState.inProgress && now > end datetime
            label = INFERRED_EXECUTION_STATES.runningLong;
          } else {
            // - 'Ended' :now > start datetime && now > end datetime
            label = INFERRED_EXECUTION_STATES.ended;
          }
        }
      }
      // Start time is in the future
      else {
        if (this.start === this.end) {
          // - 'Occurs' : for Events with start > now datetime and 0 duration
          label = INFERRED_EXECUTION_STATES.occurs;
        } else {
          // - 'Starts' : for Activities with now > start datetime
          label = INFERRED_EXECUTION_STATES.starts;
        }
      }

      this.formattedItemLabel = label || executionStateLabel;
    }
  }
};
</script>
