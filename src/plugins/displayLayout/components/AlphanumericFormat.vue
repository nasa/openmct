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
  <div class="c-inspect-properties">
    <ul class="c-inspect-properties__section">
      <li class="c-inspect-properties__row">
        <div
          class="c-inspect-properties__label"
          title="Override the label shown for this telemetry value"
        >
          <label for="telemetryCustomTitle">Title</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="telemetryCustomTitle"
            type="text"
            :value="telemetryTitle"
            :placeholder="nonMixedTitle ? '' : 'Mixed'"
            @change="titleChanged"
          />
          <template v-if="!isEditing && telemetryTitle?.length">
            {{ telemetryTitle }}
          </template>
        </div>
      </li>
      <li class="c-inspect-properties__row">
        <div
          class="c-inspect-properties__label"
          title="Printf formatting for the selected telemetry"
        >
          <label for="telemetryPrintfFormat">Format</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="telemetryPrintfFormat"
            type="text"
            :value="telemetryFormat"
            :placeholder="nonMixedFormat ? '' : 'Mixed'"
            @change="formatTelemetry"
          />
          <template v-if="!isEditing && telemetryFormat?.length">
            {{ telemetryFormat }}
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'AlphanumericFormat',
  inject: ['openmct', 'objectPath'],
  data() {
    return {
      isEditing: this.openmct.editor.isEditing(),
      telemetryFormat: undefined,
      nonMixedFormat: false,
      telemetryTitle: undefined,
      nonMixedTitle: false
    };
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleEdit);
    this.openmct.selection.on('change', this.handleSelection);
    this.handleSelection(this.openmct.selection.get());
  },
  unmounted() {
    this.openmct.editor.off('isEditing', this.toggleEdit);
    this.openmct.selection.off('change', this.handleSelection);
  },
  methods: {
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    },
    formatTelemetry(event) {
      const newFormat = event.currentTarget.value;
      this.openmct.selection.get().forEach((selectionPath) => {
        selectionPath[0].context.updateTelemetryFormat(newFormat);
      });
      this.telemetryFormat = newFormat;
    },
    titleChanged(event) {
      const newTitle = event.currentTarget.value;
      this.openmct.selection.get().forEach((selectionPath) => {
        if (selectionPath[0].context.updateTelemetryTitle) {
          selectionPath[0].context.updateTelemetryTitle(newTitle);
        }
      });
      this.telemetryTitle = newTitle;
    },
    handleSelection(selection) {
      if (selection.length === 0 || selection[0].length < 2) {
        return;
      }

      let layoutItem = selection[0][0].context.layoutItem;

      if (!layoutItem) {
        return;
      }

      let format = layoutItem.format;
      this.nonMixedFormat = selection.every((selectionPath) => {
        return selectionPath[0].context.layoutItem.format === format;
      });

      this.telemetryFormat = this.nonMixedFormat ? format : '';

      let title = layoutItem.title;
      this.nonMixedTitle = selection.every((selectionPath) => {
        return selectionPath[0].context.layoutItem.title === title;
      });
      this.telemetryTitle = this.nonMixedTitle ? title : '';
    }
  }
};
</script>
