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
  <div class="c-timer u-style-receiver js-style-receiver" :class="[`is-${timerState}`]">
    <div class="c-timer__controls">
      <button
        title="Reset"
        aria-label="Reset"
        class="c-timer__ctrl-reset c-icon-button c-icon-button--major icon-reset"
        :class="[{ hide: timerState === 'stopped' }]"
        @click="restartTimer"
      ></button>
      <button
        :title="timerStateButtonText"
        :aria-label="timerStateButtonText"
        class="c-timer__ctrl-pause-play c-icon-button c-icon-button--major"
        :class="[timerStateButtonIcon]"
        @click="toggleStateButton"
      ></button>
    </div>
    <div class="c-timer__direction" :class="[{ hide: !timerSign }, `icon-${timerSign}`]"></div>
    <div class="c-timer__value">{{ timerState === 'stopped' ? '--:--:--' : timeTextValue }}</div>
  </div>
</template>

<script>
import raf from 'utils/raf';

import throttle from '../../../utils/throttle';

const moment = require('moment-timezone');
const momentDurationFormatSetup = require('moment-duration-format');
const refreshRateSeconds = 2;

momentDurationFormatSetup(moment);

export default {
  inject: ['openmct', 'currentView'],
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      configuration: this.domainObject.configuration,
      lastTimestamp: null
    };
  },
  computed: {
    timeDelta() {
      if (this.configuration.pausedTime) {
        return Date.parse(this.configuration.pausedTime) - this.startTimeMs;
      } else {
        return this.lastTimestamp - this.startTimeMs;
      }
    },
    startTimeMs() {
      return Date.parse(this.configuration.timestamp);
    },
    timeTextValue() {
      const toWholeSeconds = Math.abs(Math.floor(this.timeDelta / 1000) * 1000);

      return moment.duration(toWholeSeconds, 'ms').format(this.format, { trim: false });
    },
    timerState() {
      let timerState = 'started';
      if (this.configuration && this.configuration.timerState) {
        timerState = this.configuration.timerState;
      }

      return timerState;
    },
    timerStateButtonText() {
      let buttonText = 'Pause';
      if (['paused', 'stopped'].includes(this.timerState)) {
        buttonText = 'Start';
      }

      return buttonText;
    },
    timerStateButtonIcon() {
      let buttonIcon = 'icon-pause';
      if (['paused', 'stopped'].includes(this.timerState)) {
        buttonIcon = 'icon-play';
      }

      return buttonIcon;
    },
    timerFormat() {
      let timerFormat = 'long';
      if (this.configuration && this.configuration.timerFormat) {
        timerFormat = this.configuration.timerFormat;
      }

      return timerFormat;
    },
    format() {
      let format;
      if (this.timerFormat === 'long') {
        format = 'd[D] HH:mm:ss';
      }

      if (this.timerFormat === 'short') {
        format = 'HH:mm:ss';
      }

      return format;
    },
    timerType() {
      let timerType = null;
      if (isNaN(this.timeDelta)) {
        return timerType;
      }

      if (this.timeDelta < 0) {
        timerType = 'countDown';
      } else if (this.timeDelta >= 1000) {
        timerType = 'countUp';
      }

      return timerType;
    },
    timerSign() {
      let timerSign = null;
      if (this.timerType === 'countUp') {
        timerSign = 'plus';
      } else if (this.timerType === 'countDown') {
        timerSign = 'minus';
      }

      return timerSign;
    }
  },
  watch: {
    timerState() {
      if (!this.viewActionsCollection) {
        return;
      }

      this.showOrHideAvailableActions();
    }
  },
  mounted() {
    this.unobserve = this.openmct.objects.observe(this.domainObject, '*', (domainObject) => {
      this.configuration = domainObject.configuration;
    });
    this.$nextTick(() => {
      if (!this.configuration?.timerState) {
        const timerAction = !this.timeDelta ? 'stop' : 'start';
        this.triggerAction(`timer.${timerAction}`);
      }

      this.handleTick = raf(this.handleTick);
      this.refreshTimerObject = throttle(this.refreshTimerObject, refreshRateSeconds * 1000);
      this.openmct.time.on('tick', this.handleTick);

      this.viewActionsCollection = this.openmct.actions.getActionsCollection(
        this.objectPath,
        this.currentView
      );
      this.showOrHideAvailableActions();
    });
  },
  beforeUnmount() {
    if (this.unobserve) {
      this.unobserve();
    }
    this.openmct.time.off('tick', this.handleTick);
  },
  methods: {
    handleTick() {
      this.lastTimestamp = new Date(this.openmct.time.now());
      this.refreshTimerObject();
    },
    refreshTimerObject() {
      this.openmct.objects.refresh(this.domainObject);
    },
    restartTimer() {
      this.triggerAction('timer.restart');
    },
    toggleStateButton() {
      if (this.timerState === 'started') {
        this.triggerAction('timer.pause');
      } else if (['paused', 'stopped'].includes(this.timerState)) {
        this.triggerAction('timer.start');
      }
    },
    triggerAction(actionKey) {
      const action = this.openmct.actions.getAction(actionKey);
      if (action) {
        action.invoke(this.objectPath, this.currentView);
      }
    },
    showOrHideAvailableActions() {
      switch (this.timerState) {
        case 'started':
          this.viewActionsCollection.hide(['timer.start']);
          this.viewActionsCollection.show(['timer.stop', 'timer.pause', 'timer.restart']);
          break;
        case 'paused':
          this.viewActionsCollection.hide(['timer.pause']);
          this.viewActionsCollection.show(['timer.stop', 'timer.start', 'timer.restart']);
          break;
        case 'stopped':
          this.viewActionsCollection.hide(['timer.stop', 'timer.pause', 'timer.restart']);
          this.viewActionsCollection.show(['timer.start']);
          break;
      }
    }
  }
};
</script>
