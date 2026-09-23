<!--
 Open MCT, Copyright (c) 2014-2026, United States Government
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
  <div class="c-pie-chart-options js-pie-chart-option">
    <div class="grid-properties">
      <ul class="l-inspector-part">
        <h2 title="Settings for this pie chart">Settings</h2>
        <li class="grid-row">
          <div class="grid-cell label" title="The shape of the pie chart.">Shape</div>
          <div v-if="isEditing" class="grid-cell value">
            <select v-model="shape" @change="updateShape">
              <option v-for="option in shapeOptions" :key="option.value" :value="option.value">
                {{ option.name }}
              </option>
            </select>
          </div>
          <div v-else class="grid-cell value">{{ shapeLabel }}</div>
        </li>
        <li class="grid-row">
          <div class="grid-cell label" title="The target value representing a full pie chart.">
            Target
          </div>
          <div v-if="isEditing" class="grid-cell value">
            <input v-model.number="target" type="number" @change="updateTarget" />
          </div>
          <div v-else class="grid-cell value">{{ target }}</div>
        </li>
        <li v-if="highlightedKeyOptions.length > 0" class="grid-row">
          <div class="grid-cell label" title="The wedge to visually highlight.">
            Highlighted Wedge
          </div>
          <div v-if="isEditing" class="grid-cell value">
            <select v-model="highlightedKey" @change="updateHighlightedKey">
              <option value="">None</option>
              <option
                v-for="option in highlightedKeyOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.name }}
              </option>
            </select>
          </div>
          <div v-else class="grid-cell value">{{ highlightedKeyLabel }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { PIE_CHART_SHAPES } from '../PieChartConstants.js';

export default {
  inject: ['openmct', 'domainObject'],
  data() {
    const pieChartController = this.domainObject.configuration.pieChartController;

    return {
      isEditing: this.openmct.editor.isEditing(),
      shapeOptions: PIE_CHART_SHAPES.map(([name, value]) => ({ name, value })),
      shape: pieChartController.shape,
      target: pieChartController.target,
      highlightedKey: pieChartController.highlightedKey,
      highlightedKeyOptions: []
    };
  },
  computed: {
    shapeLabel() {
      const option = this.shapeOptions.find((opt) => opt.value === this.shape);

      return option ? option.name : this.shape;
    },
    highlightedKeyLabel() {
      const option = this.highlightedKeyOptions.find((opt) => opt.value === this.highlightedKey);

      return option ? option.name : 'None';
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setEditState);
    this.composition = this.openmct.composition.get(this.domainObject);
    this.composition.on('add', this.setupHighlightedKeyOptions);
    this.composition.load();
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
    this.composition.off('add', this.setupHighlightedKeyOptions);
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;
    },
    setupHighlightedKeyOptions(telemetryObject) {
      const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
      const rangeValues = metadata.valuesForHints(['range']);

      this.highlightedKeyOptions = rangeValues
        .filter((valueMetadata) => !metadata.isArrayValue(valueMetadata))
        .map((valueMetadata) => ({
          name: valueMetadata.name || valueMetadata.key,
          value: valueMetadata.key
        }));
    },
    updateShape() {
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.pieChartController.shape',
        this.shape
      );
    },
    updateTarget() {
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.pieChartController.target',
        this.target
      );
    },
    updateHighlightedKey() {
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.pieChartController.highlightedKey',
        this.highlightedKey
      );
    }
  }
};
</script>
