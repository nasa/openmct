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
  <div
    :aria-label="optionsLabel"
    class="c-menu"
    :class="[options.menuClass, 'c-super-menu']"
    :style="styleObject"
  >
    <div class="c-super-menu__left-col">
      <div v-if="options.filterable" class="c-super-menu__filter">
        <input
          ref="filterInput"
          v-model="searchTerm"
          type="text"
          placeholder="Filter..."
          class="c-super-menu__filter-input"
          @input="filterItems"
          @keydown.stop="handleKeyDown"
          @click.stop
        />
      </div>
      <ul
        v-if="filteredActions.length && filteredActions[0].length"
        role="menu"
        class="c-super-menu__menu"
      >
        <template v-for="(actionGroups, index) in filteredActions" :key="index">
          <div role="group">
            <li
              v-for="action in actionGroups"
              :key="action.name"
              role="menuitem"
              :aria-disabled="action.isDisabled"
              aria-describedby="item-description"
              :class="action.cssClass"
              @click="action.onItemClicked"
              @mouseover="toggleItemDescription(action)"
              @mouseleave="toggleItemDescription()"
            >
              {{ action.name }}
            </li>
            <div
              v-if="index !== filteredActions.length - 1"
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
          v-for="action in filteredActions"
          :key="action.name"
          role="menuitem"
          :class="action.cssClass"
          :aria-label="action.name"
          aria-describedby="item-description"
          @click="action.onItemClicked"
          @mouseover="toggleItemDescription(action)"
          @mouseleave="toggleItemDescription()"
        >
          {{ action.name }}
        </li>
        <li v-if="filteredActions.length === 0">No actions defined.</li>
      </ul>
    </div>

    <div aria-live="polite" class="c-super-menu__item-description">
      <div :class="itemDescriptionIconClass"></div>
      <div class="l-item-description__name">
        {{ hoveredItemName }}
      </div>
      <div id="item-description" class="l-item-description__description">
        {{ hoveredItemDescription }}
      </div>
    </div>
  </div>
</template>
<script>
import popupMenuMixin from '../mixins/popupMenuMixin.js';
export default {
  mixins: [popupMenuMixin],
  inject: ['options', 'dismiss'],
  data() {
    return {
      hoveredItem: null,
      filteredActions: [],
      searchTerm: ''
    };
  },
  computed: {
    optionsLabel() {
      const label = this.options.label ? `${this.options.label} Super Menu` : 'Super Menu';
      return label;
    },
    itemDescriptionIconClass() {
      const iconClass = ['l-item-description__icon'];
      if (this.hoveredItem) {
        iconClass.push('bg-' + this.hoveredItem.cssClass);
      }
      return iconClass;
    },
    hoveredItemName() {
      return this.hoveredItem?.name ?? '';
    },
    hoveredItemDescription() {
      return this.hoveredItem?.description ?? '';
    }
  },
  mounted() {
    this.filteredActions = this.options.actions;

    if (this.options.filterable) {
      this.$nextTick(() => {
        this.$refs.filterInput.focus();
      });
    }
  },
  methods: {
    toggleItemDescription(action = null) {
      const hoveredItem = {
        name: action?.name,
        description: action?.description,
        cssClass: action?.cssClass
      };

      this.hoveredItem = hoveredItem;
    },
    filterItems() {
      const term = this.searchTerm.toLowerCase();

      if (!term) {
        this.filteredActions = this.options.actions;

        return;
      }

      if (Array.isArray(this.options.actions[0])) {
        // Handle grouped actions
        this.filteredActions = this.options.actions
          .map((group) =>
            group.filter(
              (action) =>
                action.name.toLowerCase().includes(term) ||
                (action.description && action.description.toLowerCase().includes(term))
            )
          )
          .filter((group) => group.length > 0);
      } else {
        // Handle flat actions list
        this.filteredActions = this.options.actions.filter(
          (action) =>
            action.name.toLowerCase().includes(term) ||
            (action.description && action.description.toLowerCase().includes(term))
        );
      }
    },
    handleKeyDown({ key }) {
      if (key === 'Enter') {
        // if there is only one action, select it immediately on enter
        const flattenedActions = Array.isArray(this.filteredActions[0])
          ? this.filteredActions.flat()
          : this.filteredActions;

        if (flattenedActions.length === 1) {
          flattenedActions[0].onItemClicked();
          this.dismiss();
        }
      } else if (key === 'Escape') {
        this.dismiss();
      }
    }
  }
};
</script>
