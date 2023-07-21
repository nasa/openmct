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
        class="c-timer__ctrl-reset c-icon-button c-icon-button--major icon-reset"
        :class="[{ hide: timerState === 'stopped' }]"
        @click="restartTimer"
      ></button>
      <button
        :title="timerStateButtonText"
        class="c-timer__ctrl-pause-play c-icon-button c-icon-button--major"
        :class="[timerStateButtonIcon]"
        @click="toggleStateButton"
      ></button>
    </div>
    <div class="c-timer__direction" :class="[{ hide: !timerSign }, `icon-${timerSign}`]"></div>
    <div class="c-timer__value">{{ timeTextValue || '--:--:--' }}</div>
  </div>
</template>

<script>
import raf from 'utils/raf';

const moment = require('moment-timezone');
const momentDurationFormatSetup = require('moment-duration-format');

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
    relativeTimestamp() {
      let relativeTimestamp;
      if (this.configuration && this.configuration.timestamp) {
        relativeTimestamp = moment(this.configuration.timestamp).toDate();
      } else if (this.configuration && this.configuration.timestamp === undefined) {
        relativeTimestamp = undefined;
      }

      return relativeTimestamp;
    },
    timeDelta() {
      return this.lastTimestamp - this.relativeTimestamp;
    },
    timeTextValue() {
      if (isNaN(this.timeDelta)) {
        return null;
      }

      const toWholeSeconds = Math.abs(Math.floor(this.timeDelta / 1000) * 1000);

      return moment.duration(toWholeSeconds, 'ms').format(this.format, { trim: false });
    },
    pausedTime() {
      let pausedTime;
      if (this.configuration && this.configuration.pausedTime) {
        pausedTime = moment(this.configuration.pausedTime).toDate();
      } else if (this.configuration && this.configuration.pausedTime === undefined) {
        pausedTime = undefined;
      }

      return pausedTime;
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
    this.unobserve = this.openmct.objects.observe(
      this.domainObject,
      'configuration',
      (configuration) => {
        this.configuration = configuration;
      }
    );
    this.$nextTick(() => {
      if (!this.configuration?.timerState) {
        const timerAction = !this.relativeTimestamp ? 'stop' : 'start';
        this.triggerAction(`timer.${timerAction}`);
      }

      this.handleTick = raf(this.handleTick);
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
      const isTimerRunning = !['paused', 'stopped'].includes(this.timerState);

      if (isTimerRunning) {
        this.lastTimestamp = new Date(this.openmct.time.now());
      }

      if (this.timerState === 'paused' && !this.lastTimestamp) {
        this.lastTimestamp = this.pausedTime;
      }

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
