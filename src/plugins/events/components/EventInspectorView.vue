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
  <div class="c-timelist-properties">
    <div class="c-inspect-properties">
      <ul class="c-inspect-properties__section">
        <div class="c-inspect-properties_header" title="'Placeholder'">Placeholder</div>
        <li class="c-inspect-properties__row">
          <div class="c-inspect-properties__label" title="Foo">Foo</div>
          <div class="c-inspect-properties__value">
            <select
              v-if="canEdit"
              v-model="isExpanded"
              aria-label="Display Style"
              @change="updateExpandedView"
            >
              <option :key="'expanded-view-option-enabled'" :value="true">Expanded</option>
              <option :key="'expanded-view-option-disabled'" :value="false">Compact</option>
            </select>
            <span>placeholder</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      isEditing: this.openmct.editor.isEditing()
    };
  },
  computed: {
    canEdit() {
      return this.isEditing && !this.domainObject.locked;
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setEditState);
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;
    }
  }
};
</script>
