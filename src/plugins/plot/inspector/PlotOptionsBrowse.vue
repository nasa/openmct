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
  <ul v-if="loaded" class="js-plot-options-browse" aria-label="Plot Configuration">
    <li v-if="showPlotSeries" class="c-tree" aria-labelledby="plot-series-header">
      <h2 id="plot-series-header" class="--first">Plot Series</h2>
      <ul aria-label="Plot Series Items" class="l-inspector-part">
        <PlotOptionsItem v-for="series in plotSeries" :key="series.keyString" :series="series" />
      </ul>
    </li>
    <ul v-if="showYAxisProperties" aria-label="Y Axes" class="l-inspector-part js-yaxis-properties">
      <li
        v-for="(yAxis, index) in yAxesWithSeries"
        :key="`yAxis-${index}`"
        :aria-labelledby="getYAxisHeaderId(index)"
      >
        <h2 :id="getYAxisHeaderId(index)">
          Y Axis {{ yAxesWithSeries.length > 1 ? yAxis.id : '' }}
        </h2>
        <ul class="grid-properties" :aria-label="`Y Axis ${yAxis.id} Properties`">
          <li
            v-for="(prop, key) in yAxisProperties(yAxis)"
            :key="key"
            :aria-labelledby="getYAxisPropId(index, prop.label)"
            class="grid-row"
            role="grid"
          >
            <div
              :id="getYAxisPropId(index, prop.label)"
              class="grid-cell label"
              :title="prop.title"
              role="gridcell"
            >
              {{ prop.label }}
            </div>
            <div class="grid-cell value" role="gridcell">{{ prop.value }}</div>
          </li>
        </ul>
      </li>
    </ul>
    <li v-if="showLegendProperties" class="grid-properties" aria-label="Legend Configuration">
      <ul class="l-inspector-part js-legend-properties" aria-labelledby="legend-header">
        <h2 id="legend-header" class="--first">Legend</h2>
        <li v-for="(prop, key) in legendProperties" :key="key" class="grid-row">
          <div class="u-contents" :aria-label="prop.label">
            <div class="grid-cell label" :title="prop.title">{{ prop.label }}</div>
            <div class="grid-cell value" :class="prop.class">{{ prop.value }}</div>
          </div>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script>
import configStore from '../configuration/ConfigStore.js';
import eventHelpers from '../lib/eventHelpers.js';
import PlotOptionsItem from './PlotOptionsItem.vue';

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
      showLegendsForChildren: '',
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
    showLegendDetails() {
      return (
        !this.isStackedPlotObject || (this.isStackedPlotObject && !this.showLegendsForChildren)
      );
    },
    yAxesWithSeries() {
      return this.yAxes.filter((yAxis) => yAxis.seriesCount > 0);
    },
    showPlotSeries() {
      return !this.isStackedPlotObject;
    },
    showYAxisProperties() {
      return this.plotSeries.length && !this.isStackedPlotObject;
    },
    showLegendProperties() {
      return this.isStackedPlotObject || !this.isNestedWithinAStackedPlot;
    },
    legendProperties() {
      const props = {};

      if (this.isStackedPlotObject) {
        props.showLegendsForChildren = {
          label: 'Show legend per plot',
          title: 'Display legends per sub plot.',
          value: this.showLegendsForChildren ? 'Yes' : 'No'
        };
      }

      if (this.showLegendDetails) {
        Object.assign(props, {
          position: {
            label: 'Position',
            title: 'The position of the legend relative to the plot display area.',
            value: this.position,
            class: 'capitalize'
          },
          hideLegendWhenSmall: {
            label: 'Hide when plot small',
            title: 'Hide the legend when the plot is small',
            value: this.hideLegendWhenSmall ? 'Yes' : 'No'
          },
          expandByDefault: {
            label: 'Expand by Default',
            title: 'Show the legend expanded by default',
            value: this.expandByDefault ? 'Yes' : 'No'
          },
          valueToShowWhenCollapsed: {
            label: 'Show when collapsed:',
            title: "What to display in the legend when it's collapsed.",
            value: this.valueToShowWhenCollapsed.replace('nearest', '')
          },
          expandedValues: {
            label: 'Show when expanded:',
            title: "What to display in the legend when it's expanded.",
            value: this.getExpandedValues(),
            class: 'comma-list'
          }
        });
      }

      return props;
    }
  },
  mounted() {
    eventHelpers.extend(this);
    this.config = this.getConfig();
    if (!this.isStackedPlotObject) {
      this.initYAxesConfiguration();
      this.registerListeners();
    }
    this.initLegendConfiguration();

    this.loaded = true;
  },
  beforeUnmount() {
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
        this.showLegendsForChildren = this.config.legend.get('showLegendsForChildren');
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
      this.plotSeries[index] = series;
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
    },
    getYAxisHeaderId(index) {
      return `yAxis-${index}-header`;
    },

    getYAxisPropId(index, label) {
      return `y-axis-${index}-${label.toLowerCase().replace(' ', '-')}`;
    },

    yAxisAriaLabel(yAxis) {
      return this.yAxesWithSeries.length > 1
        ? `Y Axis ${yAxis.id} Properties`
        : 'Y Axis Properties';
    },
    yAxisProperties(yAxis) {
      const props = {
        label: {
          label: 'Label',
          title: 'Manually override how the Y axis is labeled.',
          value: yAxis.label ? yAxis.label : 'Not defined'
        },
        logMode: {
          label: 'Log mode',
          title: 'Enable log mode.',
          value: yAxis.logMode ? 'Enabled' : 'Disabled'
        },
        autoscale: {
          label: 'Auto scale',
          title: 'Automatically scale the Y axis to keep all values in view.',
          value: yAxis.autoscale ? `Enabled: ${yAxis.autoscalePadding}` : 'Disabled'
        }
      };

      if (!yAxis.autoscale) {
        if (yAxis.rangeMin !== '') {
          props.rangeMin = {
            label: 'Minimum value',
            title: 'Minimum Y axis value.',
            value: yAxis.rangeMin
          };
        }
        if (yAxis.rangeMax !== '') {
          props.rangeMax = {
            label: 'Maximum value',
            title: 'Maximum Y axis value.',
            value: yAxis.rangeMax
          };
        }
      }

      return props;
    },
    getExpandedValues() {
      const values = [];
      if (this.showTimestampWhenExpanded) {
        values.push('Timestamp');
      }
      if (this.showValueWhenExpanded) {
        values.push('Value');
      }
      if (this.showMinimumWhenExpanded) {
        values.push('Min');
      }
      if (this.showMaximumWhenExpanded) {
        values.push('Max');
      }
      if (this.showUnitsWhenExpanded) {
        values.push('Unit');
      }
      return values.join(', ');
    }
  }
};
</script>
