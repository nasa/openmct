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
    class="c-control-menu c-menu--to-left c-menu--has-close-btn c-image-controls c-image-controls--filters"
    @click="handleClose"
  >
    <div class="c-image-controls__controls" @click="$event.stopPropagation()">
      <span class="c-image-controls__sliders">
        <div class="c-image-controls__slider-wrapper icon-brightness">
          <input
            v-model="filters.brightness"
            type="range"
            min="0"
            max="500"
            draggable="true"
            @dragstart.stop.prevent
            @change="notifyFiltersChanged"
            @input="notifyFiltersChanged"
          />
        </div>
        <div class="c-image-controls__slider-wrapper icon-contrast">
          <input
            v-model="filters.contrast"
            type="range"
            min="0"
            max="500"
            draggable="true"
            @dragstart.stop.prevent
            @change="notifyFiltersChanged"
            @input="notifyFiltersChanged"
          />
        </div>
      </span>
      <span class="c-image-controls__reset-btn">
        <a class="s-icon-button icon-reset t-btn-reset" @click="resetFilters"></a>
      </span>
    </div>

    <button class="c-click-icon icon-x t-btn-close c-switcher-menu__close-button"></button>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  data() {
    return {
      filters: {
        brightness: 100,
        contrast: 100
      }
    };
  },
  methods: {
    handleClose(e) {
      const closeButton = e.target.classList.contains('c-switcher-menu__close-button');
      if (!closeButton) {
        e.stopPropagation();
      }
    },
    notifyFiltersChanged() {
      this.$emit('filterChanged', this.filters);
    },
    resetFilters() {
      this.filters = {
        brightness: 100,
        contrast: 100
      };
      this.notifyFiltersChanged();
    }
  }
};
</script>
