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
  <div class="js-plot-options-edit grid-properties">
    <ul class="l-inspector-part">
      <h2 title="Object view settings">Settings</h2>
      <li class="grid-row">
        <div class="grid-cell label" title="X axis selection.">X Axis</div>
        <div class="grid-cell value">
          <select v-model="xKey" @change="updateForm('xKey')">
            <option
              v-for="option in xKeyOptions"
              :key="`xKey-${option.value}`"
              :value="option.value"
              :selected="option.value == xKey"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="Y axis selection.">Y Axis</div>
        <div class="grid-cell value">
          <select v-model="yKey" @change="updateForm('yKey')">
            <option
              v-for="option in yKeyOptions"
              :key="`yKey-${option.value}`"
              :value="option.value"
              :selected="option.value == yKey"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
      </li>
      <ColorSwatch
        :current-color="currentColor"
        title="Manually set the line and marker color for this plot."
        edit-title="Manually set the line and marker color for this plot."
        view-title="The line and marker color for this plot."
        short-label="Color"
        @colorSet="setColor"
      />
    </ul>
  </div>
</template>
<script>
import Color from '../../../../ui/color/Color';
import ColorPalette from '../../../../ui/color/ColorPalette';
import ColorSwatch from '../../../../ui/color/ColorSwatch.vue';

export default {
  components: { ColorSwatch },
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      xKey: undefined,
      yKey: undefined,
      xKeyOptions: [],
      yKeyOptions: [],
      currentColor: undefined
    };
  },
  mounted() {
    this.plotSeries = [];
    this.colorPalette = new ColorPalette();
    this.initColor();
    this.composition = this.openmct.composition.get(this.domainObject);
    this.registerListeners();
    this.composition.load();
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    initColor() {
      // this is called before the plot is initialized
      if (
        !this.domainObject.configuration.styles ||
        !this.domainObject.configuration.styles.color
      ) {
        const color = this.colorPalette.getNextColor().asHexString();
        this.domainObject.configuration.styles = {
          color
        };
      }

      this.currentColor = this.domainObject.configuration.styles.color;
      const colorObject = Color.fromHexString(this.currentColor);

      this.colorPalette.remove(colorObject);
    },
    setColor(chosenColor) {
      this.currentColor = chosenColor.asHexString();
      this.openmct.objects.mutate(
        this.domainObject,
        `configuration.styles.color`,
        this.currentColor
      );
    },
    registerListeners() {
      this.composition.on('add', this.addSeries);
      this.composition.on('remove', this.removeSeries);
      this.unobserve = this.openmct.objects.observe(
        this.domainObject,
        'configuration.axes',
        this.setupOptions
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
    setupOptions() {
      this.xKeyOptions = [];
      this.yKeyOptions = [];
      if (this.plotSeries.length <= 0) {
        return;
      }

      let update = false;
      const series = this.plotSeries[0];
      const metadataValues = this.openmct.telemetry.getMetadata(series).valuesForHints(['range']);
      metadataValues.forEach((metadataValue) => {
        this.xKeyOptions.push({
          name: metadataValue.name || metadataValue.key,
          value: metadataValue.source || metadataValue.key
        });
        this.yKeyOptions.push({
          name: metadataValue.name || metadataValue.key,
          value: metadataValue.source || metadataValue.key
        });
      });

      let xKeyOptionIndex;
      let yKeyOptionIndex;

      if (this.domainObject.configuration.axes.xKey) {
        xKeyOptionIndex = this.xKeyOptions.findIndex(
          (option) => option.value === this.domainObject.configuration.axes.xKey
        );
        if (xKeyOptionIndex > -1) {
          this.xKey = this.xKeyOptions[xKeyOptionIndex].value;
        } else {
          this.xKey = undefined;
        }
      }

      if (this.xKey === undefined) {
        update = true;
        xKeyOptionIndex = 0;
        this.xKey = this.xKeyOptions[xKeyOptionIndex].value;
      }

      if (metadataValues.length > 1) {
        if (this.domainObject.configuration.axes.yKey) {
          yKeyOptionIndex = this.yKeyOptions.findIndex(
            (option) => option.value === this.domainObject.configuration.axes.yKey
          );
          if (yKeyOptionIndex > -1 && yKeyOptionIndex !== xKeyOptionIndex) {
            this.yKey = this.yKeyOptions[yKeyOptionIndex].value;
          } else {
            this.yKey = undefined;
          }
        }

        if (this.yKey === undefined) {
          update = true;
          yKeyOptionIndex = this.yKeyOptions.findIndex(
            (option, index) => index !== xKeyOptionIndex
          );
          this.yKey = this.yKeyOptions[yKeyOptionIndex].value;
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
    }
  }
};
</script>
