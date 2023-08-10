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
  <div class="c-inspector__tabs c-tabs" role="tablist">
    <div
      v-for="tab in visibleTabs"
      :key="tab.key"
      role="tab"
      class="c-inspector__tab c-tab"
      :class="{ 'is-current': isSelected(tab) }"
      :title="tab.name"
      @click="selectTab(tab)"
    >
      <span class="c-inspector__tab-name c-tab__name">{{ tab.name }}</span>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    isEditing: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      tabs: [],
      selectedTab: undefined
    };
  },
  computed: {
    visibleTabs() {
      return this.tabs.filter((tab) => {
        return tab.showTab === undefined || tab.showTab(this.isEditing);
      });
    }
  },
  watch: {
    visibleTabs: {
      handler() {
        this.selectDefaultTabIfSelectedNotVisible();
      },
      deep: true
    }
  },
  mounted() {
    this.updateSelection();
    this.openmct.selection.on('change', this.updateSelection);
  },
  unmounted() {
    this.openmct.selection.off('change', this.updateSelection);
  },
  methods: {
    updateSelection() {
      const inspectorViews = this.openmct.inspectorViews.get(this.openmct.selection.get());

      this.tabs = inspectorViews.map((view) => {
        return {
          key: view.key,
          name: view.name,
          glyph: view.glyph ?? 'icon-object',
          showTab: view.showTab
        };
      });
    },
    isSelected(tab) {
      return this.selectedTab?.key === tab.key;
    },
    selectTab(tab) {
      this.selectedTab = tab;
      this.$emit('select-tab', tab);
    },
    selectDefaultTabIfSelectedNotVisible() {
      const selectedTabIsVisible = this.visibleTabs.some((tab) => this.isSelected(tab));

      if (!selectedTabIsVisible) {
        this.selectTab(this.visibleTabs[0]);
      }
    }
  }
};
</script>
