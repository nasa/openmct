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
  <div ref="modeMenuButton" class="c-ctrl-wrapper c-ctrl-wrapper--menus-up">
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        class="c-button--menu js-mode-button c-icon-button"
        :class="selectedMode.cssClass"
        aria-label="Independent Time Conductor Mode Menu"
        @click.prevent.stop="showModesMenu"
      >
        <span class="c-button__label">{{ selectedMode.name }}</span>
      </button>
    </div>
  </div>
</template>

<script>

export default {
  inject: ['openmct', 'timeMode', 'getAllModeMetadata', 'getModeMetadata'],
  props: {
    enabled: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    return {
      selectedMode: this.getModeMetadata(this.timeMode)
    };
  },
  watch: {
    timeMode: {
      handler() {
        this.setView();
      }
    },
    enabled(newValue, oldValue) {
      if (newValue !== undefined && newValue !== oldValue && newValue === true) {
        this.setView();
      }
    }
  },
  mounted: function () {
    this.modes = this.getAllModeMetadata();
  },
  methods: {
    showModesMenu() {
      const elementBoundingClientRect = this.$refs.modeMenuButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

      const menuOptions = {
        menuClass: 'c-conductor__mode-menu c-super-menu--sm',
        placement: this.openmct.menus.menuPlacement.BOTTOM_RIGHT
      };
      this.openmct.menus.showSuperMenu(x, y, this.modes, menuOptions);
    },
    setView() {
      this.selectedMode = this.getModeMetadata(this.timeMode);
    }
  }
};
</script>
