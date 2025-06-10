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
  <div class="c-tli" role="row">
    <div class="c-tli__activity-color" :style="styleClass"></div>
    <div class="c-tli__contents" :class="listItemClass">
      <div class="c-tli-row c-tli__title-and-status">
        <div class="c-tli__title">{{ formattedItem.title }}</div>
        <div class="c-tli__status">{{ formattedItemLabel }}</div>
      </div>
      <div v-if="showTimeHero" class="c-tli-row c-tli__time-hero">
        <div class="c-tli__time-hero-time" :class="countdownClass">{{ formattedItem.countdown }}</div>
        <div class="c-tli__time-hero-context --subtle">Starts</div>
      </div>
      <div
        class="c-tli-row c-tli__bounds-and-duration"
        :class="{ '--has-duration': eventHasDuration }"
      >
        <div class="c-tli__start-time">{{ formattedItem.start }}</div>
        <div v-if="eventHasDuration" class="c-tli__end-time">{{ formattedItem.end }}</div>
        <div v-if="eventHasDuration" class="c-tli__duration">
          <span class="--subtle">DUR</span>
          {{ formattedItem.duration }}
        </div>
        <div v-else class="c-tli__start-time">Event</div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import { CURRENT_CSS_SUFFIX, FUTURE_CSS_SUFFIX, PAST_CSS_SUFFIX } from './constants.js';
import { updateProgress } from './svg-progress.js';

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
    activityColor: {
      type: String,
      default: 'transparent'
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
      return cssClass;
    },
    styleClass() {
      return { backgroundColor: this.activityColor };
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
      return `${timeRelationClass} ${executionStateClass}`;
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
        this.cssClass === PAST_CSS_SUFFIX ||
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
      this.updateTimestamp(this.timeContext.now());
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off(TIME_CONTEXT_EVENTS.tick, this.updateTimestamp);
      }
    },
    updateTimestamp(time) {
      this.timestamp = time;
      const progressElement = this.$refs.progressElement;
      if (this.isInProgress && progressElement) {
        updateProgress(this.start, this.end, this.timestamp, progressElement);
      }
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
