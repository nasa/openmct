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
  <div class="c-menu" :class="[options.menuClass, 'c-super-menu']">
    <ul
      v-if="options.actions.length && options.actions[0].length"
      role="menu"
      class="c-super-menu__menu"
    >
      <template v-for="(actionGroups, index) in options.actions">
        <div :key="index" role="group">
          <li
            v-for="action in actionGroups"
            :key="action.name"
            role="menuitem"
            :class="[action.cssClass, action.isDisabled ? 'disabled' : '']"
            :title="action.description"
            :data-testid="action.testId || false"
            @click="action.onItemClicked"
            @mouseover="toggleItemDescription(action)"
            @mouseleave="toggleItemDescription()"
          >
            {{ action.name }}
          </li>
          <div
            v-if="index !== options.actions.length - 1"
            :key="index"
            role="separator"
            class="c-menu__section-separator"
          ></div>
          <li v-if="actionGroups.length === 0" :key="index">No actions defined.</li>
        </div></template
      >
    </ul>

    <ul v-else class="c-super-menu__menu" role="menu">
      <li
        v-for="action in options.actions"
        :key="action.name"
        role="menuitem"
        :class="action.cssClass"
        :title="action.description"
        :data-testid="action.testId || false"
        @click="action.onItemClicked"
        @mouseover="toggleItemDescription(action)"
        @mouseleave="toggleItemDescription()"
      >
        {{ action.name }}
      </li>
      <li v-if="options.actions.length === 0">No actions defined.</li>
    </ul>

    <div class="c-super-menu__item-description">
      <div :class="['l-item-description__icon', 'bg-' + hoveredItem.cssClass]"></div>
      <div class="l-item-description__name">
        {{ hoveredItem.name }}
      </div>
      <div class="l-item-description__description">
        {{ hoveredItem.description }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['options'],
  data: function () {
    return {
      hoveredItem: {}
    };
  },
  methods: {
    toggleItemDescription(action = {}) {
      const hoveredItem = {
        name: action.name,
        description: action.description,
        cssClass: action.cssClass
      };

      this.hoveredItem = Object.assign({}, this.hoveredItem, hoveredItem);
    }
  }
};
</script>
