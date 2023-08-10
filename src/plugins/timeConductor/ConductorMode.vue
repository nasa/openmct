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
  <div v-if="readOnly === false" ref="modeButton" class="c-tc-input-popup__options">
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        class="c-button--menu js-mode-button"
        :class="[buttonCssClass, selectedMode.cssClass]"
        aria-label="Time Conductor Mode Menu"
        @click.prevent.stop="showModesMenu"
      >
        <span class="c-button__label">{{ selectedMode.name }}</span>
      </button>
    </div>
  </div>
  <div
    v-else
    role="button"
    class="c-compact-tc__setting-value__elem"
    aria-label="Time Conductor Mode"
  >
    {{ selectedMode.name }}
  </div>
</template>

<script>
import modeMixin from './mode-mixin';

const TEST_IDS = true;

export default {
  mixins: [modeMixin],
  inject: ['openmct', 'configuration'],
  props: {
    mode: {
      type: String,
      default() {
        return undefined;
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
    const mode = this.openmct.time.getMode();

    return {
      selectedMode: this.getModeMetadata(mode, TEST_IDS),
      modes: []
    };
  },
  watch: {
    mode: {
      handler(newMode) {
        this.setViewFromMode(newMode);
      }
    }
  },
  mounted() {
    this.loadModes();
  },
  methods: {
    showModesMenu() {
      const elementBoundingClientRect = this.$refs.modeButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y;

      const menuOptions = {
        menuClass: 'c-conductor__mode-menu c-super-menu--sm',
        placement: this.openmct.menus.menuPlacement.TOP_RIGHT
      };

      this.dismiss = this.openmct.menus.showSuperMenu(x, y, this.modes, menuOptions);
    },
    setViewFromMode(mode) {
      this.selectedMode = this.getModeMetadata(mode, TEST_IDS);
    },
    setMode(mode) {
      this.setViewFromMode(mode);

      this.$emit('modeUpdated', mode);
    }
  }
};
</script>
