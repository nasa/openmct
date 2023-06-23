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
  <div class="c-bar-graph-options js-bar-plot-option">
    <ul class="c-tree">
      <h2 title="Display properties for this object">Bar Graph Series</h2>
      <li>
        <series-options
          v-for="series in plotSeries"
          :key="series.key"
          :item="series"
          :color-palette="colorPalette"
        />
      </li>
    </ul>
    <div class="grid-properties">
      <ul class="l-inspector-part">
        <h2 title="Y axis settings for this object">Axes</h2>
        <li class="grid-row">
          <div class="grid-cell label" title="X axis selection.">X Axis</div>
          <div v-if="isEditing" class="grid-cell value">
            <select v-model="xKey" @change="updateForm('xKey')">
              <option
                v-for="option in xKeyOptions"
                :key="`xKey-${option.value}`"
                :value="option.value"
                :selected="option.value === xKey"
              >
                {{ option.name }}
              </option>
            </select>
          </div>
          <div v-else class="grid-cell value">{{ xKeyLabel }}</div>
        </li>
        <li v-if="yKey !== ''" class="grid-row">
          <div class="grid-cell label" title="Y axis selection.">Y Axis</div>
          <div v-if="isEditing" class="grid-cell value">
            <select v-model="yKey" @change="updateForm('yKey')">
              <option
                v-for="option in yKeyOptions"
                :key="`yKey-${option.value}`"
                :value="option.value"
                :selected="option.value === yKey"
              >
                {{ option.name }}
              </option>
            </select>
          </div>
          <div v-else class="grid-cell value">{{ yKeyLabel }}</div>
        </li>
      </ul>
    </div>
    <div class="grid-properties">
      <ul class="l-inspector-part">
        <h2 title="Settings for plot">Settings</h2>
        <li class="grid-row">
          <div v-if="isEditing" class="grid-cell label" title="Display style for the plot">
            Display Style
          </div>
          <div v-if="isEditing" class="grid-cell value">
            <select v-model="useBar" @change="updateBar">
              <option :value="true">Bar</option>
              <option :value="false">Line</option>
            </select>
          </div>
          <div v-if="!isEditing" class="grid-cell label" title="Display style for plot">
            Display Style
          </div>
          <div v-if="!isEditing" class="grid-cell value">
            {{
              {
                true: 'Bar',
                false: 'Line'
              }[useBar]
            }}
          </div>
        </li>
        <li v-if="!useBar" class="grid-row">
          <div
            v-if="isEditing"
            class="grid-cell label"
            title="The rendering method to join lines for this series."
          >
            Line Method
          </div>
          <div v-if="isEditing" class="grid-cell value">
            <select v-model="useInterpolation" @change="updateInterpolation">
              <option value="linear">Linear interpolate</option>
              <option value="hv">Step after</option>
            </select>
          </div>
          <div
            v-if="!isEditing"
            class="grid-cell label"
            title="The rendering method to join lines for this series."
          >
            Line Method
          </div>
          <div v-if="!isEditing" class="grid-cell value">
            {{
              {
                linear: 'Linear interpolation',
                hv: 'Step After'
              }[useInterpolation]
            }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import SeriesOptions from './SeriesOptions.vue';
import ColorPalette from '@/ui/color/ColorPalette';

export default {
  components: {
    SeriesOptions
  },
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      xKey: this.domainObject.configuration.axes.xKey,
      yKey: this.domainObject.configuration.axes.yKey,
      xKeyLabel: '',
      yKeyLabel: '',
      plotSeries: [],
      yKeyOptions: [],
      xKeyOptions: [],
      isEditing: this.openmct.editor.isEditing(),
      colorPalette: this.colorPalette,
      useInterpolation: this.domainObject.configuration.useInterpolation,
      useBar: this.domainObject.configuration.useBar
    };
  },
  computed: {
    canEdit() {
      return this.isEditing && !this.domainObject.locked;
    }
  },
  beforeMount() {
    this.colorPalette = new ColorPalette();
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setEditState);
    this.composition = this.openmct.composition.get(this.domainObject);
    this.registerListeners();
    this.composition.load();
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
    this.stopListening();
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;
    },
    registerListeners() {
      this.composition.on('add', this.addSeries);
      this.composition.on('remove', this.removeSeries);
      this.unobserve = this.openmct.objects.observe(
        this.domainObject,
        'configuration.axes',
        this.setKeysAndSetupOptions
      );
    },
    stopListening() {
      this.composition.off('add', this.addSeries);
      this.composition.off('remove', this.removeSeries);
      if (this.unobserve) {
        this.unobserve();
      }
    },
    addSeries(series, index) {
      this.plotSeries.push(series);
      this.setupOptions();
    },
    removeSeries(seriesIdentifier) {
      const index = this.plotSeries.findIndex((plotSeries) =>
        this.openmct.objects.areIdsEqual(seriesIdentifier, plotSeries.identifier)
      );
      if (index >= 0) {
        this.$delete(this.plotSeries, index);
        this.setupOptions();
      }
    },
    setKeysAndSetupOptions() {
      this.xKey = this.domainObject.configuration.axes.xKey;
      this.yKey = this.domainObject.configuration.axes.yKey;
      this.setupOptions();
    },
    setupOptions() {
      this.xKeyOptions = [];
      this.yKeyOptions = [];
      if (this.plotSeries.length <= 0) {
        return;
      }

      let update = false;
      const series = this.plotSeries[0];
      const metadata = this.openmct.telemetry.getMetadata(series);
      const metadataRangeValues = metadata.valuesForHints(['range']).map((metaDatum) => {
        metaDatum.isArrayValue = metadata.isArrayValue(metaDatum);

        return metaDatum;
      });
      const metadataArrayValues = metadataRangeValues.filter(
        (metadataObj) => metadataObj.isArrayValue
      );
      const metadataValues = metadataRangeValues.filter((metadataObj) => !metadataObj.isArrayValue);
      metadataArrayValues.forEach((metadataValue) => {
        this.xKeyOptions.push({
          name: metadataValue.name || metadataValue.key,
          value: metadataValue.key,
          isArrayValue: metadataValue.isArrayValue
        });
        this.yKeyOptions.push({
          name: metadataValue.name || metadataValue.key,
          value: metadataValue.key,
          isArrayValue: metadataValue.isArrayValue
        });
      });

      //Metadata values that are not array values will be grouped together as x-axis only option.
      // Here, the y-axis is not relevant.
      if (metadataValues.length) {
        this.xKeyOptions.push(
          metadataValues.reduce(
            (previousValue, currentValue) => {
              return {
                name: previousValue?.name
                  ? `${previousValue.name}, ${currentValue.name}`
                  : `${currentValue.name}`,
                value: currentValue.key,
                isArrayValue: currentValue.isArrayValue
              };
            },
            { name: '' }
          )
        );
      }

      let xKeyOptionIndex;
      let yKeyOptionIndex;

      if (this.domainObject.configuration.axes.xKey) {
        xKeyOptionIndex = this.xKeyOptions.findIndex(
          (option) => option.value === this.domainObject.configuration.axes.xKey
        );
        if (xKeyOptionIndex > -1) {
          this.xKey = this.xKeyOptions[xKeyOptionIndex].value;
          this.xKeyLabel = this.xKeyOptions[xKeyOptionIndex].name;
        }
      } else {
        if (this.xKey === undefined) {
          update = true;
          xKeyOptionIndex = 0;
          this.xKey = this.xKeyOptions[xKeyOptionIndex].value;
          this.xKeyLabel = this.xKeyOptions[xKeyOptionIndex].name;
        }
      }

      if (metadataRangeValues.length > 1) {
        if (
          this.domainObject.configuration.axes.yKey &&
          this.domainObject.configuration.axes.yKey !== 'none'
        ) {
          yKeyOptionIndex = this.yKeyOptions.findIndex(
            (option) => option.value === this.domainObject.configuration.axes.yKey
          );
          if (yKeyOptionIndex > -1 && yKeyOptionIndex !== xKeyOptionIndex) {
            this.yKey = this.yKeyOptions[yKeyOptionIndex].value;
            this.yKeyLabel = this.yKeyOptions[yKeyOptionIndex].name;
          }
        } else {
          if (this.yKey === undefined) {
            if (metadataValues.length && metadataArrayValues.length === 0) {
              update = true;
              this.yKey = 'none';
            } else {
              yKeyOptionIndex = this.yKeyOptions.findIndex(
                (option, index) => index !== xKeyOptionIndex
              );
              if (yKeyOptionIndex > -1) {
                update = true;
                this.yKey = this.yKeyOptions[yKeyOptionIndex].value;
                this.yKeyLabel = this.yKeyOptions[yKeyOptionIndex].name;
              }
            }
          }
        }

        this.yKeyOptions = this.yKeyOptions.map((option, index) => {
          if (index === xKeyOptionIndex) {
            option.name = `${option.name} (swap)`;
            option.swap = yKeyOptionIndex;
          } else {
            option.name = option.name.replace(' (swap)', '');
            option.swap = undefined;
          }

          return option;
        });
      } else if (
        this.xKey !== undefined &&
        this.domainObject.configuration.axes.yKey === undefined
      ) {
        this.domainObject.configuration.axes.yKey = 'none';
      }

      this.xKeyOptions = this.xKeyOptions.map((option, index) => {
        if (index === yKeyOptionIndex) {
          option.name = `${option.name} (swap)`;
          option.swap = xKeyOptionIndex;
        } else {
          option.name = option.name.replace(' (swap)', '');
          option.swap = undefined;
        }

        return option;
      });

      if (update === true) {
        this.saveConfiguration();
      }
    },
    updateForm(property) {
      if (property === 'xKey') {
        const xKeyOption = this.xKeyOptions.find((option) => option.value === this.xKey);
        if (xKeyOption.swap !== undefined) {
          //swap
          this.yKey = this.xKeyOptions[xKeyOption.swap].value;
        } else if (!xKeyOption.isArrayValue) {
          this.yKey = 'none';
        } else {
          this.yKey = undefined;
        }
      } else if (property === 'yKey') {
        const yKeyOption = this.yKeyOptions.find((option) => option.value === this.yKey);
        if (yKeyOption.swap !== undefined) {
          //swap
          this.xKey = this.yKeyOptions[yKeyOption.swap].value;
        }
      }

      this.saveConfiguration();
    },
    saveConfiguration() {
      this.openmct.objects.mutate(this.domainObject, `configuration.axes`, {
        xKey: this.xKey,
        yKey: this.yKey
      });
    },
    updateInterpolation(event) {
      this.openmct.objects.mutate(
        this.domainObject,
        `configuration.useInterpolation`,
        this.useInterpolation
      );
    },
    updateBar(event) {
      this.openmct.objects.mutate(this.domainObject, `configuration.useBar`, this.useBar);
    }
  }
};
</script>
