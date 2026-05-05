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
        <div class="c-tli__status-and-icon-graphic">
          <div class="c-tli__status">{{ formattedExecutionLabel }}</div>
          <div class="c-tli__graphic"></div>
        </div>
      </div>
      <div v-if="showTimeHero" class="c-tli-row c-tli__time-hero">
        <div class="c-tli__time-hero-time" :class="countdownClass">
          {{ formattedItem.countdown }}
        </div>
        <div class="c-tli__time-hero-context --subtle">{{ formattedTimeContextLabel }}</div>
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
        <div v-else class="c-tli__duration --subtle">EVENT TIME</div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import { PAST_CSS_SUFFIX } from './constants.js';
import { updateProgress } from './svg-progress.js';

const EXECUTION_STATES = {
  notStarted: 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  aborted: 'Aborted',
  skipped: 'Skipped'
};

const TIME_CONTEXTS = {
  start: 'Planned Start',
  end: 'Planned End',
  event: 'Planned Event'
};

const INFERRED_EXECUTION_STATES = {
  incomplete: 'Incomplete',
  overdue: 'Overdue',
  runningLong: 'Running Long',
  starts: 'Planned Start',
  occurs: 'Occurs',
  occurred: 'Occurred',
  ends: 'Planned End',
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
      formattedExecutionLabel: '',
      formattedTimeContextLabel: ''
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
          formattedValue = itemProperty.format(value, undefined, itemProperty.key, this.openmct, {
            skipPrefix: true
          });
        }
        itemValue[itemProperty.key] = formattedValue;
      });

      return itemValue;
    },
    showTimeHero() {
      // Always show the count up/down "time hero" element if activity is in progress
      if (this.executionState === 'in-progress') {
        return true;
      }
      // Otherwise, show it if the activity is not in the past.
      return !(this.cssClass === PAST_CSS_SUFFIX);
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
      this.formatExecutionLabel();
      this.formatTimeContextLabel();
    },
    formatExecutionLabel() {
      let label;
      if (this.executionState !== 'notStarted') {
        label = EXECUTION_STATES[this.executionState];
      }
      if (this.executionState === 'in-progress') {
        if (this.end < this.timestamp) {
          label = INFERRED_EXECUTION_STATES.runningLong;
        }
      }
      this.formattedExecutionLabel = label;
    },
    formatTimeContextLabel() {
      let label = this.start < this.timestamp ? TIME_CONTEXTS.end : TIME_CONTEXTS.start;
      if (!this.eventHasDuration) {
        label = TIME_CONTEXTS.event;
      }
      this.formattedTimeContextLabel = label;
    }
  }
};
</script>
