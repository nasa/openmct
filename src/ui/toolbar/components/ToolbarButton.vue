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
  <div class="c-ctrl-wrapper">
    <div
      class="c-icon-button"
      :title="options.title"
      :class="{
        [options.icon]: true,
        'c-icon-button--caution': options.modifier === 'caution',
        'c-icon-button--mixed': nonSpecific
      }"
      @click="onClick"
    >
      <div v-if="options.label" class="c-icon-button__label">
        {{ options.label }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  computed: {
    nonSpecific() {
      return this.options.nonSpecific === true;
    }
  },
  methods: {
    onClick(event) {
      const self = this;

      if ((self.options.isEditing === undefined || self.options.isEditing) && self.options.dialog) {
        this.updateFormStructure();

        self.openmct.forms
          .showForm(self.options.dialog)
          .then((changes) => {
            self.$emit('change', { ...changes }, self.options);
          })
          .catch((e) => {
            // canceled, do nothing
          });
      }

      self.$emit('click', self.options);
    },
    updateFormStructure() {
      if (!this.options.value) {
        return;
      }

      Object.entries(this.options.value).forEach(([key, value]) => {
        this.options.dialog.sections.forEach((section) => {
          section.rows.forEach((row) => {
            if (row.key === key) {
              row.value = value;
            }
          });
        });
      });
    }
  }
};
</script>
