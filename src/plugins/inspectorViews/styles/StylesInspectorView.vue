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
  <multipane type="vertical">
    <pane class="c-inspector__styles">
      <div class="u-contents">
        <StylesView />
      </div>
    </pane>
    <pane v-if="isEditing" class="c-inspector__saved-styles" handle="before" label="Saved Styles">
      <SavedStylesInspectorView />
    </pane>
  </multipane>
</template>

<script>
import multipane from '../../../ui/layout/multipane.vue';
import pane from '../../../ui/layout/pane.vue';
import StylesView from '@/plugins/condition/components/inspector/StylesView.vue';
import SavedStylesInspectorView from './SavedStylesInspectorView.vue';

export default {
  components: {
    multipane,
    pane,
    StylesView,
    SavedStylesInspectorView
  },
  inject: ['openmct'],
  data() {
    return {
      isEditing: this.openmct.editor.isEditing()
    };
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setEditMode);
  },
  beforeDestroyed() {
    this.openmct.editor.off('isEditing', this.setEditMode);
  },
  methods: {
    setEditMode(isEditing) {
      this.isEditing = isEditing;
    }
  }
};
</script>
