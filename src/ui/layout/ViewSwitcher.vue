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
    v-if="views.length > 1"
    class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
  >
    <button
      class="c-icon-button c-button--menu"
      :class="currentView.cssClass"
      title="Change the current view"
      @click.prevent.stop="showMenu"
    >
      <span class="c-icon-button__label">
        {{ currentView.name }}
      </span>
    </button>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    currentView: {
      type: Object,
      required: true
    },
    views: {
      type: Array,
      required: true
    }
  },
  methods: {
    setView(view) {
      this.$emit('setView', view);
    },
    showMenu() {
      const elementBoundingClientRect = this.$el.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

      this.openmct.menus.showMenu(x, y, this.views);
    }
  }
};
</script>
