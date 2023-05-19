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
  <div v-if="loaded" class="js-plot-options-browse">
    <ul v-if="!isStackedPlotObject" class="c-tree" aria-label="Plot Series Properties">
      <h2 class="--first" title="Plot series display properties in this object">Plot Series</h2>
      <plot-options-item v-for="series in plotSeries" :key="series.key" :series="series" />
    </ul>
    <div v-if="plotSeries.length && !isStackedPlotObject" class="grid-properties">
      <ul
        v-for="(yAxis, index) in yAxesWithSeries"
        :key="`yAxis-${index}`"
        class="l-inspector-part js-yaxis-properties"
        :aria-label="
          yAxesWithSeries.length > 1 ? `Y Axis ${yAxis.id} Properties` : 'Y Axis Properties'
        "
      >
        <h2 title="Y axis settings for this object">
          Y Axis {{ yAxesWithSeries.length > 1 ? yAxis.id : '' }}
        </h2>
        <li class="grid-row">
          <div class="grid-cell label" title="Manually override how the Y axis is labeled.">
            Label
          </div>
          <div class="grid-cell value">{{ yAxis.label ? yAxis.label : 'Not defined' }}</div>
        </li>
        <li class="grid-row">
          <div class="grid-cell label" title="Enable log mode.">Log mode</div>
          <div class="grid-cell value">
            {{ yAxis.logMode ? 'Enabled' : 'Disabled' }}
          </div>
        </li>
        <li class="grid-row">
          <div
            class="grid-cell label"
            title="Automatically scale the Y axis to keep all values in view."
          >
            Auto scale
          </div>
          <div class="grid-cell value">
            {{ yAxis.autoscale ? 'Enabled: ' + yAxis.autoscalePadding : 'Disabled' }}
          </div>
        </li>
        <li v-if="!yAxis.autoscale && yAxis.rangeMin !== ''" class="grid-row">
          <div class="grid-cell label" title="Minimum Y axis value.">Minimum value</div>
          <div class="grid-cell value">{{ yAxis.rangeMin }}</div>
        </li>
        <li v-if="!yAxis.autoscale && yAxis.rangeMax !== ''" class="grid-row">
          <div class="grid-cell label" title="Maximum Y axis value.">Maximum value</div>
          <div class="grid-cell value">{{ yAxis.rangeMax }}</div>
        </li>
      </ul>
    </div>
    <div v-if="isStackedPlotObject || !isNestedWithinAStackedPlot" class="grid-properties">
      <ul class="l-inspector-part js-legend-properties">
        <h2 class="--first" title="Legend settings for this object">Legend</h2>
        <li class="grid-row">
          <div
            class="grid-cell label"
            title="The position of the legend relative to the plot display area."
          >
            Position
          </div>
          <div class="grid-cell value capitalize">{{ position }}</div>
        </li>
        <li class="grid-row">
          <div class="grid-cell label" title="Hide the legend when the plot is small">
            Hide when plot small
          </div>
          <div class="grid-cell value">{{ hideLegendWhenSmall ? 'Yes' : 'No' }}</div>
        </li>
        <li class="grid-row">
          <div class="grid-cell label" title="Show the legend expanded by default">
            Expand by Default
          </div>
          <div class="grid-cell value">{{ expandByDefault ? 'Yes' : 'No' }}</div>
        </li>
        <li class="grid-row">
          <div class="grid-cell label" title="What to display in the legend when it's collapsed.">
            Show when collapsed:
          </div>
          <div class="grid-cell value">{{ valueToShowWhenCollapsed.replace('nearest', '') }}</div>
        </li>
        <li class="grid-row">
          <div class="grid-cell label" title="What to display in the legend when it's expanded.">
            Show when expanded:
          </div>
          <div class="grid-cell value comma-list">
            <span v-if="showTimestampWhenExpanded">Timestamp</span>
            <span v-if="showValueWhenExpanded">Value</span>
            <span v-if="showMinimumWhenExpanded">Min</span>
            <span v-if="showMaximumWhenExpanded">Max</span>
            <span v-if="showUnitsWhenExpanded">Unit</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import PlotOptionsItem from './PlotOptionsItem.vue';
import configStore from '../configuration/ConfigStore';
import eventHelpers from '../lib/eventHelpers';

export default {
  components: {
    PlotOptionsItem
  },
  inject: ['openmct', 'domainObject', 'path'],
  data() {
    return {
      config: {},
      position: '',
      hideLegendWhenSmall: '',
      expandByDefault: '',
      valueToShowWhenCollapsed: '',
      showTimestampWhenExpanded: '',
      showValueWhenExpanded: '',
      showMinimumWhenExpanded: '',
      showMaximumWhenExpanded: '',
      showUnitsWhenExpanded: '',
      loaded: false,
      plotSeries: [],
      yAxes: []
    };
  },
  computed: {
    isNestedWithinAStackedPlot() {
      return this.path.find(
        (pathObject, pathObjIndex) =>
          pathObjIndex > 0 && pathObject?.type === 'telemetry.plot.stacked'
      );
    },
    isStackedPlotObject() {
      return this.path.find(
        (pathObject, pathObjIndex) =>
          pathObjIndex === 0 && pathObject.type === 'telemetry.plot.stacked'
      );
    },
    yAxesWithSeries() {
      return this.yAxes.filter((yAxis) => yAxis.seriesCount > 0);
    }
  },
  mounted() {
    eventHelpers.extend(this);
    this.config = this.getConfig();
    if (!this.isStackedPlotObject) {
      this.initYAxesConfiguration();
      this.registerListeners();
    } else {
      this.initLegendConfiguration();
    }

    this.loaded = true;
  },
  beforeDestroy() {
    this.stopListening();
  },
  methods: {
    initYAxesConfiguration() {
      if (this.config) {
        let range = this.config.yAxis.get('range');

        this.yAxes.push({
          id: this.config.yAxis.id,
          seriesCount: 0,
          label: this.config.yAxis.get('label'),
          autoscale: this.config.yAxis.get('autoscale'),
          logMode: this.config.yAxis.get('logMode'),
          autoscalePadding: this.config.yAxis.get('autoscalePadding'),
          rangeMin: range?.min ?? '',
          rangeMax: range?.max ?? ''
        });
        this.config.additionalYAxes.forEach((yAxis) => {
          range = yAxis.get('range');

          this.yAxes.push({
            id: yAxis.id,
            seriesCount: 0,
            label: yAxis.get('label'),
            autoscale: yAxis.get('autoscale'),
            logMode: yAxis.get('logMode'),
            autoscalePadding: yAxis.get('autoscalePadding'),
            rangeMin: range?.min ?? '',
            rangeMax: range?.max ?? ''
          });
        });
      }
    },
    initLegendConfiguration() {
      if (this.config) {
        this.position = this.config.legend.get('position');
        this.hideLegendWhenSmall = this.config.legend.get('hideLegendWhenSmall');
        this.expandByDefault = this.config.legend.get('expandByDefault');
        this.valueToShowWhenCollapsed = this.config.legend.get('valueToShowWhenCollapsed');
        this.showTimestampWhenExpanded = this.config.legend.get('showTimestampWhenExpanded');
        this.showValueWhenExpanded = this.config.legend.get('showValueWhenExpanded');
        this.showMinimumWhenExpanded = this.config.legend.get('showMinimumWhenExpanded');
        this.showMaximumWhenExpanded = this.config.legend.get('showMaximumWhenExpanded');
        this.showUnitsWhenExpanded = this.config.legend.get('showUnitsWhenExpanded');
      }
    },
    getConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      return configStore.get(configId);
    },
    registerListeners() {
      if (this.config) {
        this.config.series.forEach(this.addSeries, this);

        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);
      }
    },

    setYAxisLabel(yAxisId) {
      const found = this.yAxes.find((yAxis) => yAxis.id === yAxisId);
      if (found && found.seriesCount > 0) {
        const mainYAxisId = this.config.yAxis.id;
        if (mainYAxisId === yAxisId) {
          found.label = this.config.yAxis.get('label');
        } else {
          const additionalYAxis = this.config.additionalYAxes.find((axis) => axis.id === yAxisId);
          if (additionalYAxis) {
            found.label = additionalYAxis.get('label');
          }
        }
      }
    },

    addSeries(series, index) {
      const yAxisId = series.get('yAxisId');
      this.updateAxisUsageCount(yAxisId, 1);
      this.$set(this.plotSeries, index, series);
      this.setYAxisLabel(yAxisId);
    },

    removeSeries(plotSeries, index) {
      const yAxisId = plotSeries.get('yAxisId');
      this.updateAxisUsageCount(yAxisId, -1);
      this.plotSeries.splice(index, 1);
      this.setYAxisLabel(yAxisId);
    },

    updateAxisUsageCount(yAxisId, updateCount) {
      const foundYAxis = this.yAxes.find((yAxis) => yAxis.id === yAxisId);
      if (foundYAxis) {
        foundYAxis.seriesCount = foundYAxis.seriesCount + updateCount;
      }
    }
  }
};
</script>
