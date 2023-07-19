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
  <div
    v-if="selectedTimeSystem.name && readOnly === false"
    ref="timeSystemButton"
    class="c-ctrl-wrapper c-ctrl-wrapper--menus-up"
  >
    <button
      class="c-button--menu c-time-system-button"
      :class="[buttonCssClass]"
      @click.prevent.stop="showTimeSystemMenu"
    >
      <span class="c-button__label">{{ selectedTimeSystem.name }}</span>
    </button>
  </div>
  <div
    v-else
    class="c-compact-tc__setting-value__elem"
    :title="`Time system: ${selectedTimeSystem.name}`"
  >
    {{ selectedTimeSystem.name }}
  </div>
</template>

<script>
import { TIME_CONTEXT_EVENTS } from '../../api/time/constants';

export default {
  inject: ['openmct', 'configuration'],
  props: {
    buttonCssClass: {
      type: String,
      required: false,
      default() {
        return '';
      }
    },
    readOnly: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    let activeClock = this.openmct.time.getClock();

    return {
      selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.getTimeSystem())),
      timeSystems: this.getValidTimesystemsForClock(activeClock)
    };
  },
  mounted() {
    this.openmct.time.on(TIME_CONTEXT_EVENTS.timeSysteChanged, this.setViewFromTimeSystem);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
  },
  unmounted() {
    this.openmct.time.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setViewFromTimeSystem);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
  },
  methods: {
    showTimeSystemMenu() {
      const elementBoundingClientRect = this.$refs.timeSystemButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y;

      const menuOptions = {
        placement: this.openmct.menus.menuPlacement.TOP_RIGHT
      };

      this.openmct.menus.showMenu(x, y, this.timeSystems, menuOptions);
    },
    getValidTimesystemsForClock(clock) {
      return this.configuration.menuOptions
        .filter((menuOption) => menuOption.clock === (clock && clock.key))
        .map((menuOption) => {
          const timeSystem = JSON.parse(
            JSON.stringify(this.openmct.time.timeSystems.get(menuOption.timeSystem))
          );
          timeSystem.onItemClicked = () => this.setTimeSystemFromView(timeSystem);

          return timeSystem;
        });
    },
    setTimeSystemFromView(timeSystem) {
      if (timeSystem.key !== this.selectedTimeSystem.key) {
        let activeClock = this.openmct.time.getClock();
        let configuration = this.getMatchingConfig({
          clock: activeClock && activeClock.key,
          timeSystem: timeSystem.key
        });
        if (activeClock === undefined) {
          let bounds;

          if (this.selectedTimeSystem.isUTCBased && timeSystem.isUTCBased) {
            bounds = this.openmct.time.getBounds();
          } else {
            bounds = configuration.bounds;
          }

          this.openmct.time.setTimeSystem(timeSystem.key, bounds);
        } else {
          this.openmct.time.setTimeSystem(timeSystem.key);
          this.openmct.time.setClockOffsets(configuration.clockOffsets);
        }
      }
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

    setViewFromTimeSystem(timeSystem) {
      this.selectedTimeSystem = timeSystem;
    },

    setViewFromClock(clock) {
      let activeClock = this.openmct.time.getClock();
      this.timeSystems = this.getValidTimesystemsForClock(activeClock);
    }
  }
};
</script>
