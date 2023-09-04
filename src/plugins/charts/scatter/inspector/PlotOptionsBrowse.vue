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
  <div class="js-plot-options-browse grid-properties">
    <ul class="l-inspector-part">
      <h2 title="Object view settings">Settings</h2>
      <li class="grid-row">
        <div class="grid-cell label" title="X axis selection">X Axis</div>
        <div class="grid-cell value">{{ xKeyLabel }}</div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="Y axis selection">Y Axis</div>
        <div class="grid-cell value">{{ yKeyLabel }}</div>
      </li>
      <ColorSwatch
        :current-color="currentColor"
        edit-title="Manually set the color for this plot"
        view-title="The marker color for this plot"
        short-label="Color"
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
      xKeyLabel: '',
      yKeyLabel: '',
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
    registerListeners() {
      this.composition.on('add', this.addSeries);
      this.composition.on('remove', this.removeSeries);
      this.unobserve = this.openmct.objects.observe(
        this.domainObject,
        'configuration.axes',
        this.setAxesLabels
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
      this.setAxesLabels();
    },
    removeSeries(seriesKey) {
      const seriesIndex = this.plotSeries.findIndex((plotSeries) =>
        this.openmct.objects.areIdsEqual(seriesKey, plotSeries.identifier)
      );

      const foundSeries = seriesIndex > -1;
      if (foundSeries) {
        this.plotSeries.splice(seriesIndex, 1);
        this.setAxesLabels();
      }
    },
    setAxesLabels() {
      let xKeyOptions = [];
      let yKeyOptions = [];
      if (this.plotSeries.length <= 0) {
        return;
      }

      const series = this.plotSeries[0];
      const metadataValues = this.openmct.telemetry.getMetadata(series).valuesForHints(['range']);

      metadataValues.forEach((metadataValue) => {
        xKeyOptions.push({
          name: metadataValue.name || metadataValue.key,
          value: metadataValue.source || metadataValue.key
        });
        yKeyOptions.push({
          name: metadataValue.name || metadataValue.key,
          value: metadataValue.source || metadataValue.key
        });
      });
      let xKeyOptionIndex;
      let yKeyOptionIndex;

      if (this.domainObject.configuration.axes.xKey) {
        xKeyOptionIndex = xKeyOptions.findIndex(
          (option) => option.value === this.domainObject.configuration.axes.xKey
        );
        if (xKeyOptionIndex > -1) {
          this.xKeyLabel = xKeyOptions[xKeyOptionIndex].name;
        }
      }

      if (metadataValues.length > 1 && this.domainObject.configuration.axes.yKey) {
        yKeyOptionIndex = yKeyOptions.findIndex(
          (option) => option.value === this.domainObject.configuration.axes.yKey
        );
        if (yKeyOptionIndex > -1) {
          this.yKeyLabel = yKeyOptions[yKeyOptionIndex].name;
        }
      }
    }
  }
};
</script>
