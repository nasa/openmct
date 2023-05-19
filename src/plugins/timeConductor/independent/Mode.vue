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
  <div v-if="modes.length > 1" ref="modeMenuButton" class="c-ctrl-wrapper c-ctrl-wrapper--menus-up">
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        v-if="selectedMode"
        class="c-button--menu c-mode-button"
        @click.prevent.stop="showModesMenu"
      >
        <span class="c-button__label">{{ selectedMode.name }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import toggleMixin from '../../../ui/mixins/toggle-mixin';

export default {
  mixins: [toggleMixin],
  inject: ['openmct'],
  props: {
    mode: {
      type: Object,
      default() {
        return undefined;
      }
    },
    enabled: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data: function () {
    let clock;
    if (this.mode && this.mode.key === 'fixed') {
      clock = undefined;
    } else {
      //We want the clock from the global time context here
      clock = this.openmct.time.clock();
    }

    if (clock !== undefined) {
      //Create copy of active clock so the time API does not get reactified.
      clock = Object.create(clock);
    }

    return {
      selectedMode: this.getModeOptionForClock(clock),
      modes: []
    };
  },
  watch: {
    mode: {
      deep: true,
      handler(newMode) {
        if (newMode) {
          this.setViewFromClock(newMode.key === 'fixed' ? undefined : newMode);
        }
      }
    },
    enabled(newValue, oldValue) {
      if (newValue !== undefined && newValue !== oldValue && newValue === true) {
        this.setViewFromClock(this.mode.key === 'fixed' ? undefined : this.mode);
      }
    }
  },
  mounted: function () {
    if (this.mode) {
      this.setViewFromClock(this.mode.key === 'fixed' ? undefined : this.mode);
    }

    this.followTimeConductor();
  },
  destroyed: function () {
    this.stopFollowTimeConductor();
  },
  methods: {
    followTimeConductor() {
      this.openmct.time.on('clock', this.setViewFromClock);
    },
    stopFollowTimeConductor() {
      this.openmct.time.off('clock', this.setViewFromClock);
    },
    showModesMenu() {
      const elementBoundingClientRect = this.$refs.modeMenuButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

      const menuOptions = {
        menuClass: 'c-conductor__mode-menu',
        placement: this.openmct.menus.menuPlacement.BOTTOM_RIGHT
      };
      this.openmct.menus.showSuperMenu(x, y, this.modes, menuOptions);
    },

    getMenuOptions() {
      let clocks = [
        {
          name: 'Fixed Timespan',
          timeSystem: 'utc'
        }
      ];
      let currentGlobalClock = this.openmct.time.clock();
      if (currentGlobalClock !== undefined) {
        //Create copy of active clock so the time API does not get reactified.
        currentGlobalClock = Object.assign(
          {},
          {
            name: currentGlobalClock.name,
            clock: currentGlobalClock.key,
            timeSystem: this.openmct.time.timeSystem().key
          }
        );

        clocks.push(currentGlobalClock);
      }

      return clocks;
    },
    loadClocks() {
      let clocks = this.getMenuOptions()
        .map((menuOption) => menuOption.clock)
        .filter(isDefinedAndUnique)
        .map(this.getClock);

      /*
       * Populate the modes menu with metadata from the available clocks
       * "Fixed Mode" is always first, and has no defined clock
       */
      this.modes = [undefined].concat(clocks).map(this.getModeOptionForClock);

      function isDefinedAndUnique(key, index, array) {
        return key !== undefined && array.indexOf(key) === index;
      }
    },

    getModeOptionForClock(clock) {
      if (clock === undefined) {
        const key = 'fixed';

        return {
          key,
          name: 'Fixed Timespan',
          description: 'Query and explore data that falls between two fixed datetimes.',
          cssClass: 'icon-tabular',
          onItemClicked: () => this.setOption(key)
        };
      } else {
        const key = clock.key;

        return {
          key,
          name: clock.name,
          description:
            'Monitor streaming data in real-time. The Time ' +
            'Conductor and displays will automatically advance themselves based on this clock. ' +
            clock.description,
          cssClass: clock.cssClass || 'icon-clock',
          onItemClicked: () => this.setOption(key)
        };
      }
    },

    getClock(key) {
      return this.openmct.time.getAllClocks().filter(function (clock) {
        return clock.key === key;
      })[0];
    },

    setOption(clockKey) {
      let key = clockKey;
      if (clockKey === 'fixed') {
        key = undefined;
      }

      const matchingOptions = this.getMenuOptions().filter((option) => option.clock === key);
      const clock =
        matchingOptions.length && matchingOptions[0].clock
          ? Object.assign({}, matchingOptions[0], { key: matchingOptions[0].clock })
          : undefined;
      this.selectedMode = this.getModeOptionForClock(clock);

      if (this.mode) {
        this.$emit('modeChanged', { key: clockKey });
      }
    },

    setViewFromClock(clock) {
      this.loadClocks();
      //retain the mode chosen by the user
      if (this.mode) {
        let found = this.modes.find((mode) => mode.key === this.selectedMode.key);

        if (!found) {
          found = this.modes.find((mode) => mode.key === clock && clock.key);
          this.setOption(
            found ? this.getModeOptionForClock(clock).key : this.getModeOptionForClock().key
          );
        } else if (this.mode.key !== this.selectedMode.key) {
          this.setOption(this.selectedMode.key);
        }
      } else {
        this.setOption(this.getModeOptionForClock(clock).key);
      }
    }
  }
};
</script>
