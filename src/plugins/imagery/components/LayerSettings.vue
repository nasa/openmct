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
    class="c-control-menu c-menu--to-left c-menu--has-close-btn c-image-controls"
    @click="handleClose"
  >
    <div class="c-checkbox-list js-checkbox-menu c-menu--to-left c-menu--has-close-btn">
      <ul @click="$event.stopPropagation()">
        <li v-for="(layer, index) in layers" :key="index">
          <label>
            <input
              :checked="layer.visible"
              type="checkbox"
              @change="toggleLayerVisibility(index)"
            />
            {{ layer.name }}
          </label>
        </li>
      </ul>
    </div>

    <button class="c-click-icon icon-x t-btn-close c-switcher-menu__close-button"></button>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    layers: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  methods: {
    handleClose(e) {
      const closeButton = e.target.classList.contains('c-switcher-menu__close-button');
      if (!closeButton) {
        e.stopPropagation();
      }
    },
    toggleLayerVisibility(index) {
      this.$emit('toggleLayerVisibility', index);
    }
  }
};
</script>
