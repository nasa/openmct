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
  <div ref="historyButton" class="c-ctrl-wrapper c-ctrl-wrapper--menus-up">
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        aria-label="Time Conductor History"
        class="c-button--menu c-history-button icon-history"
        :class="buttonCssClass"
        @click.prevent.stop="showHistoryMenu"
      >
        <span class="c-button__label">History</span>
      </button>
    </div>
  </div>
</template>

<script>
const DEFAULT_DURATION_FORMATTER = 'duration';
const LOCAL_STORAGE_HISTORY_KEY_FIXED = 'tcHistory';
const LOCAL_STORAGE_HISTORY_KEY_REALTIME = 'tcHistoryRealtime';
const DEFAULT_RECORDS_LENGTH = 10;

import { millisecondsToDHMS } from 'utils/duration';

import { REALTIME_MODE_KEY, TIME_CONTEXT_EVENTS } from '../../api/time/constants';
import UTCTimeFormat from '../utcTimeSystem/UTCTimeFormat.js';

export default {
  inject: ['openmct', 'configuration'],
  props: {
    buttonCssClass: {
      type: String,
      required: false,
      default() {
        return '';
      }
    }
  },
  data() {
    const mode = this.openmct.time.getMode();

    return {
      /**
       * previous bounds entries available for easy re-use
       * @realtimeHistory array of timespans
       * @timespans {start, end} number representing timestamp
       */
      realtimeHistory: {},
      /**
       * previous bounds entries available for easy re-use
       * @fixedHistory array of timespans
       * @timespans {start, end} number representing timestamp
       */
      mode,
      currentHistory: mode + 'History',
      fixedHistory: {},
      presets: [],
      timeSystem: this.openmct.time.getTimeSystem(),
      isFixed: this.openmct.time.isFixed()
    };
  },
  computed: {
    historyForCurrentTimeSystem() {
      const history = this[this.currentHistory][this.timeSystem.key];

      return history;
    },
    storageKey() {
      let key = LOCAL_STORAGE_HISTORY_KEY_FIXED;
      if (this.mode === REALTIME_MODE_KEY) {
        key = LOCAL_STORAGE_HISTORY_KEY_REALTIME;
      }

      return key;
    }
  },
  mounted() {
    this.getHistoryFromLocalStorage();
    this.loadConfiguration();

    this.openmct.time.on(TIME_CONTEXT_EVENTS.boundsChanged, this.addTimespan);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.addTimespan);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.timeSystemChanged, this.updateTimeSystem);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.modeChanged, this.updateMode);
  },
  beforeUnmount() {
    this.openmct.time.off(TIME_CONTEXT_EVENTS.boundsChanged, this.addTimespan);
    this.openmct.time.off(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.addTimespan);
    this.openmct.time.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.updateTimeSystem);
    this.openmct.time.off(TIME_CONTEXT_EVENTS.modeChanged, this.updateMode);
  },
  methods: {
    getHistoryMenuItems() {
      const descriptionDateFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
      const history = this.historyForCurrentTimeSystem.map((timespan) => {
        let name;
        const startTime = this.formatTime(timespan.start);
        const description = `${this.formatTime(
          timespan.start,
          descriptionDateFormat
        )} - ${this.formatTime(timespan.end, descriptionDateFormat)}`;

        if (this.timeSystem.isUTCBased && !this.openmct.time.isRealTime()) {
          name = `${startTime} ${millisecondsToDHMS(timespan.end - timespan.start)}`;
        } else {
          name = description;
        }

        return {
          cssClass: 'icon-history',
          name,
          description,
          onItemClicked: () => this.selectTimespan(timespan)
        };
      });

      history.unshift({
        cssClass: 'c-menu__section-hint',
        description: 'Past timeframes, ordered by latest first',
        isDisabled: true,
        name: 'Past timeframes, ordered by latest first',
        onItemClicked: () => {}
      });

      return history;
    },
    getPresetMenuItems() {
      return this.presets.map((preset) => {
        return {
          cssClass: 'icon-clock',
          name: preset.label,
          description: preset.label,
          onItemClicked: () => this.selectPresetBounds(preset.bounds)
        };
      });
    },
    getHistoryFromLocalStorage() {
      const localStorageHistory = localStorage.getItem(this.storageKey);
      const history = localStorageHistory ? JSON.parse(localStorageHistory) : undefined;
      this[this.currentHistory] = history;

      this.initializeHistoryIfNoHistory();
    },
    initializeHistoryIfNoHistory() {
      if (!this[this.currentHistory]) {
        this[this.currentHistory] = {};
        this[this.currentHistory][this.timeSystem.key] = [];
        this.persistHistoryToLocalStorage();
      }
    },
    persistHistoryToLocalStorage() {
      localStorage.setItem(this.storageKey, JSON.stringify(this[this.currentHistory]));
    },
    updateMode() {
      this.mode = this.openmct.time.getMode();
      this.currentHistory = this.mode + 'History';
      this.loadConfiguration();
      this.getHistoryFromLocalStorage();
    },
    updateTimeSystem(timeSystem) {
      this.timeSystem = timeSystem;
      this.loadConfiguration();
      this.getHistoryFromLocalStorage();
    },
    addTimespan(bounds, isTick) {
      if (isTick) {
        return;
      }

      const key = this.timeSystem.key;
      const isFixed = this.openmct.time.isFixed();
      let [...currentHistory] = this.historyForCurrentTimeSystem || [];
      const timespan = {
        start: isFixed ? bounds.start : this.openmct.time.getClockOffsets().start,
        end: isFixed ? bounds.end : this.openmct.time.getClockOffsets().end
      };

      // no dupes
      currentHistory = currentHistory.filter(
        (ts) => !(ts.start === timespan.start && ts.end === timespan.end)
      );
      currentHistory.unshift(timespan); // add to front

      if (currentHistory.length > this.MAX_RECORDS_LENGTH) {
        currentHistory.length = this.MAX_RECORDS_LENGTH;
      }

      this[this.currentHistory][key] = currentHistory;
      this.persistHistoryToLocalStorage();
    },
    selectTimespan(timespan) {
      if (this.openmct.time.isFixed()) {
        this.openmct.time.setBounds(timespan);
      } else {
        this.openmct.time.setClockOffsets(timespan);
      }
    },
    selectPresetBounds(bounds) {
      const start = typeof bounds.start === 'function' ? bounds.start() : bounds.start;
      const end = typeof bounds.end === 'function' ? bounds.end() : bounds.end;

      this.selectTimespan({
        start,
        end
      });
    },
    loadConfiguration() {
      const configurations = this.configuration.menuOptions.filter(
        (option) => option.timeSystem === this.timeSystem.key
      );

      this.presets = this.loadPresets(configurations);
      this.MAX_RECORDS_LENGTH = this.loadRecords(configurations);
    },
    loadPresets(configurations) {
      const configuration = configurations.find((option) => {
        return option.presets && option.name.toLowerCase() === this.mode;
      });
      const presets = configuration ? configuration.presets : [];

      return presets;
    },
    loadRecords(configurations) {
      const configuration = configurations.find((option) => option.records);
      const maxRecordsLength = configuration ? configuration.records : DEFAULT_RECORDS_LENGTH;

      return maxRecordsLength;
    },
    formatTime(time, utcDateFormat) {
      let format = this.timeSystem.timeFormat;
      let isNegativeOffset = false;

      if (!this.openmct.time.isFixed()) {
        if (time < 0) {
          isNegativeOffset = true;
        }

        time = Math.abs(time);

        format = this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER;
      }

      const formatter = this.openmct.telemetry.getValueFormatter({
        format: format
      }).formatter;

      let formattedDate;

      if (formatter instanceof UTCTimeFormat) {
        const formatString = formatter.isValidFormatString(utcDateFormat)
          ? utcDateFormat
          : formatter.DATE_FORMATS.PRECISION_SECONDS;
        formattedDate = formatter.format(time, formatString);
      } else {
        formattedDate = formatter.format(time);
      }

      return (isNegativeOffset ? '-' : '') + formattedDate;
    },
    showHistoryMenu() {
      const elementBoundingClientRect = this.$refs.historyButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y;

      const menuOptions = {
        menuClass: 'c-conductor__history-menu',
        placement: this.openmct.menus.menuPlacement.TOP_RIGHT
      };

      const menuActions = [];

      const presets = this.getPresetMenuItems();
      if (presets.length) {
        menuActions.push(presets);
      }

      const history = this.getHistoryMenuItems();
      menuActions.push(history);

      this.openmct.menus.showMenu(x, y, menuActions, menuOptions);
    }
  }
};
</script>
