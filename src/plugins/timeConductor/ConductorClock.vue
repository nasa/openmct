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
  <div v-if="readOnly === false" ref="clockButton" class="c-tc-input-popup__options">
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        class="c-button--menu js-clock-button"
        :class="[buttonCssClass, selectedClock.cssClass]"
        aria-label="Time Conductor Clock Menu"
        @click.prevent.stop="showClocksMenu"
      >
        <span class="c-button__label">{{ selectedClock.name }}</span>
      </button>
    </div>
  </div>
  <div v-else class="c-compact-tc__setting-value__elem" aria-label="Time Conductor Clock">
    {{ selectedClock.name }}
  </div>
</template>

<script>
import { TIME_CONTEXT_EVENTS } from '../../api/time/constants';
import clockMixin from './clock-mixin';

export default {
  mixins: [clockMixin],
  inject: {
    openmct: 'openmct',
    configuration: {
      from: 'configuration',
      default: undefined
    }
  },
  props: {
    readOnly: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    const activeClock = this.getActiveClock();

    return {
      selectedClock: activeClock ? this.getClockMetadata(activeClock) : undefined,
      clocks: []
    };
  },
  mounted() {
    this.loadClocks(this.configuration.menuOptions);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
  },
  unmounted() {
    this.openmct.time.off(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
  },
  methods: {
    showClocksMenu() {
      const elementBoundingClientRect = this.$refs.clockButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y;

      const menuOptions = {
        menuClass: 'c-conductor__clock-menu c-super-menu--sm',
        placement: this.openmct.menus.menuPlacement.TOP_RIGHT
      };

      this.dismiss = this.openmct.menus.showSuperMenu(x, y, this.clocks, menuOptions);
    },
    setClock(clockKey) {
      const option = {
        clockKey
      };
      let configuration = this.getMatchingConfig({
        clock: clockKey,
        timeSystem: this.openmct.time.getTimeSystem().key
      });

      if (configuration === undefined) {
        configuration = this.getMatchingConfig({
          clock: clockKey
        });

        option.timeSystem = configuration.timeSystem;
        option.bounds = configuration.bounds;

        // this.openmct.time.setTimeSystem(configuration.timeSystem, configuration.bounds);
      }

      const offsets = this.openmct.time.getClockOffsets() ?? configuration.clockOffsets;
      option.offsets = offsets;

      this.$emit('clockUpdated', option);
    },
    getMatchingConfig(options) {
      const matchers = {
        clock(config) {
          return options.clock === config.clock;
        },
        timeSystem(config) {
          return options.timeSystem === config.timeSystem;
        }
      };

      function configMatches(config) {
        return Object.keys(options).reduce((match, option) => {
          return match && matchers[option](config);
        }, true);
      }

      return this.configuration.menuOptions.filter(configMatches)[0];
    },
    setViewFromClock(clock) {
      this.selectedClock = this.getClockMetadata(clock);
    }
  }
};
</script>
