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
  <div class="c-inspector js-inspector">
    <object-name />
    <InspectorTabs :selection="selection" :is-editing="isEditing" @select-tab="selectTab" />
    <InspectorViews :selection="selection" :selected-tab="selectedTab" />
  </div>
</template>

<script>
import ObjectName from './ObjectName.vue';
import InspectorTabs from './InspectorTabs.vue';
import InspectorViews from './InspectorViews.vue';

export default {
  components: {
    ObjectName,
    InspectorTabs,
    InspectorViews
  },
  inject: ['openmct'],
  props: {
    isEditing: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      selection: this.openmct.selection.get(),
      selectedTab: undefined
    };
  },
  mounted() {
    this.openmct.selection.on('change', this.setSelection);
  },
  destroyed() {
    this.openmct.selection.off('change', this.setSelection);
  },
  methods: {
    setSelection(selection) {
      this.selection = selection;
    },
    selectTab(tab) {
      this.selectedTab = tab;
    }
  }
};
</script>
