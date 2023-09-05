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
  <div v-if="loaded" class="js-plot-options-edit">
    <ul v-if="!isStackedPlotObject" class="c-tree" aria-label="Plot Series Properties">
      <h2 class="--first" title="Display properties for this object">Plot Series</h2>
      <li v-for="series in plotSeries" :key="series.key">
        <series-form :series="series" @seriesUpdated="updateSeriesConfigForObject" />
      </li>
    </ul>
    <y-axis-form
      v-for="(yAxisId, index) in yAxesIds"
      :id="yAxisId.id"
      :key="`yAxis-${index}`"
      class="grid-properties js-yaxis-grid-properties"
      :y-axis="config.yAxis"
      @seriesUpdated="updateSeriesConfigForObject"
    />
    <ul
      v-if="isStackedPlotObject || !isStackedPlotNestedObject"
      class="l-inspector-part"
      aria-label="Legend Properties"
    >
      <h2 class="--first" title="Legend options">Legend</h2>
      <legend-form class="grid-properties" :legend="config.legend" />
    </ul>
  </div>
</template>
<script>
import _ from 'lodash';

import configStore from '../configuration/ConfigStore';
import eventHelpers from '../lib/eventHelpers';
import LegendForm from './forms/LegendForm.vue';
import SeriesForm from './forms/SeriesForm.vue';
import YAxisForm from './forms/YAxisForm.vue';

export default {
  components: {
    LegendForm,
    SeriesForm,
    YAxisForm
  },
  inject: ['openmct', 'domainObject', 'path'],
  data() {
    return {
      config: {},
      yAxes: [],
      plotSeries: [],
      loaded: false
    };
  },
  computed: {
    isStackedPlotNestedObject() {
      return this.path.find(
        (pathObject, pathObjIndex) =>
          pathObjIndex > 0 && pathObject?.type === 'telemetry.plot.stacked'
      );
    },
    isStackedPlotObject() {
      return this.path.find(
        (pathObject, pathObjIndex) =>
          pathObjIndex === 0 && pathObject?.type === 'telemetry.plot.stacked'
      );
    },
    yAxesIds() {
      return !this.isStackedPlotObject && this.yAxes.filter((yAxis) => yAxis.seriesCount > 0);
    }
  },
  created() {
    eventHelpers.extend(this);
    this.config = this.getConfig();
  },
  mounted() {
    if (!this.isStackedPlotObject) {
      this.yAxes = [
        {
          id: this.config.yAxis.id,
          seriesCount: 0
        }
      ];
      if (this.config.additionalYAxes) {
        this.yAxes = this.yAxes.concat(
          this.config.additionalYAxes.map((yAxis) => {
            return {
              id: yAxis.id,
              seriesCount: 0
            };
          })
        );
      }

      this.registerListeners();
    }

    this.loaded = true;
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    getConfig() {
      this.configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      return configStore.get(this.configId);
    },
    registerListeners() {
      this.config.series.forEach(this.addSeries, this);

      this.listenTo(this.config.series, 'add', this.addSeries, this);
      this.listenTo(this.config.series, 'remove', this.removeSeries, this);
    },

    findYAxisForId(yAxisId) {
      return this.yAxes.find((yAxis) => yAxis.id === yAxisId);
    },

    setYAxisLabel(yAxisId) {
      const found = this.findYAxisForId(yAxisId);
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
      this.incrementAxisUsageCount(yAxisId);
      this.plotSeries[index] = series;
      this.setYAxisLabel(yAxisId);

      if (this.isStackedPlotObject) {
        return;
      }

      // If the series moves to a different yAxis, update the seriesCounts for both yAxes
      // so we can display the configuration options for all used yAxes
      this.listenTo(
        series,
        'change:yAxisId',
        (newYAxisId, oldYAxisId) => {
          this.incrementAxisUsageCount(newYAxisId);
          this.decrementAxisUsageCount(oldYAxisId);
        },
        this
      );
    },

    removeSeries(series, index) {
      const yAxisId = series.get('yAxisId');
      this.decrementAxisUsageCount(yAxisId);
      this.plotSeries.splice(index, 1);
      this.setYAxisLabel(yAxisId);

      if (this.isStackedPlotObject) {
        return;
      }

      this.stopListening(series, 'change:yAxisId');
    },

    incrementAxisUsageCount(yAxisId) {
      this.updateAxisUsageCount(yAxisId, 1);
    },

    decrementAxisUsageCount(yAxisId) {
      this.updateAxisUsageCount(yAxisId, -1);
    },

    updateAxisUsageCount(yAxisId, updateCount) {
      const foundYAxis = this.findYAxisForId(yAxisId);
      if (!foundYAxis) {
        throw new Error(`yAxis with id ${yAxisId} not found`);
      }

      foundYAxis.seriesCount = foundYAxis.seriesCount + updateCount;
    },

    updateSeriesConfigForObject(config) {
      const stackedPlotObject = this.path.find(
        (pathObject) => pathObject.type === 'telemetry.plot.stacked'
      );
      let index = stackedPlotObject.configuration.series.findIndex((seriesConfig) => {
        return this.openmct.objects.areIdsEqual(seriesConfig.identifier, config.identifier);
      });
      if (index < 0) {
        index = stackedPlotObject.configuration.series.length;
        const configPath = `configuration.series[${index}]`;
        let newConfig = {
          identifier: config.identifier
        };
        _.set(newConfig, `${config.path}`, config.value);
        this.openmct.objects.mutate(stackedPlotObject, configPath, newConfig);
      } else {
        const configPath = `configuration.series[${index}].${config.path}`;
        this.openmct.objects.mutate(stackedPlotObject, configPath, config.value);
      }
    }
  }
};
</script>
