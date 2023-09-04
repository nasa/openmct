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
  <div ref="clockMenuButton" class="c-ctrl-wrapper c-ctrl-wrapper--menus-up">
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        v-if="selectedClock"
        class="c-icon-button c-button--menu js-clock-button"
        :class="[buttonCssClass, selectedClock.cssClass]"
        aria-label="Independent Time Conductor Clock Menu"
        @click.prevent.stop="showClocksMenu"
      >
        <span class="c-button__label">{{ selectedClock.name }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { TIME_CONTEXT_EVENTS } from '../../../api/time/constants';
import toggleMixin from '../../../ui/mixins/toggle-mixin';
import clockMixin from '../clock-mixin';

export default {
  mixins: [toggleMixin, clockMixin],
  inject: ['openmct'],
  props: {
    clock: {
      type: String,
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
  data() {
    const activeClock = this.getActiveClock();

    return {
      selectedClock: activeClock ? this.getClockMetadata(activeClock) : undefined,
      clocks: []
    };
  },
  watch: {
    clock(newClock, oldClock) {
      this.setViewFromClock(newClock);
    },
    enabled(newValue, oldValue) {
      if (newValue !== undefined && newValue !== oldValue && newValue === true) {
        this.setViewFromClock(this.clock);
      }
    }
  },
  beforeUnmount() {
    this.openmct.time.off(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
  },
  mounted: function () {
    this.loadClocks();
    this.setViewFromClock(this.clock);

    this.openmct.time.on(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
  },
  methods: {
    showClocksMenu() {
      const elementBoundingClientRect = this.$refs.clockMenuButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

      const menuOptions = {
        menuClass: 'c-conductor__clock-menu c-super-menu--sm',
        placement: this.openmct.menus.menuPlacement.BOTTOM_RIGHT
      };
      this.openmct.menus.showSuperMenu(x, y, this.clocks, menuOptions);
    },
    getMenuOptions() {
      let currentGlobalClock = this.getActiveClock();

      //Create copy of active clock so the time API does not get reactified.
      currentGlobalClock = Object.assign(
        {},
        {
          name: currentGlobalClock.name,
          clock: currentGlobalClock.key,
          timeSystem: this.openmct.time.getTimeSystem().key
        }
      );

      return [currentGlobalClock];
    },
    setClock(clockKey) {
      this.setViewFromClock(clockKey);

      this.$emit('independentClockUpdated', clockKey);
    },
    setViewFromClock(clockOrKey) {
      let clock = clockOrKey;

      if (!clock.key) {
        clock = this.getClock(clockOrKey);
      }

      // if global clock changes, reload and pull it
      this.selectedClock = this.getClockMetadata(clock);
    }
  }
};
</script>
