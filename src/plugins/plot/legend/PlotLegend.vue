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
  <div
    class="c-plot-legend gl-plot-legend"
    :class="{
      'hover-on-plot': !!highlights.length,
      'is-legend-hidden': isLegendHidden
    }"
  >
    <div
      class="c-plot-legend__view-control gl-plot-legend__view-control c-disclosure-triangle is-enabled"
      :class="{ 'c-disclosure-triangle--expanded': isLegendExpanded }"
      @click="expandLegend"
    ></div>

    <div class="c-plot-legend__wrapper" :class="{ 'is-cursor-locked': cursorLocked }">
      <!-- COLLAPSED PLOT LEGEND -->
      <div class="plot-wrapper-collapsed-legend" :class="{ 'is-cursor-locked': cursorLocked }">
        <div
          class="c-state-indicator__alert-cursor-lock icon-cursor-lock"
          title="Cursor is point locked. Click anywhere in the plot to unlock."
        ></div>
        <plot-legend-item-collapsed
          v-for="(seriesObject, seriesIndex) in seriesModels"
          :key="`${seriesObject.keyString}-${seriesIndex}-collapsed`"
          :highlights="highlights"
          :value-to-show-when-collapsed="valueToShowWhenCollapsed"
          :series-key-string="seriesObject.keyString"
          @legendHoverChanged="legendHoverChanged"
        />
      </div>
      <!-- EXPANDED PLOT LEGEND -->
      <div class="plot-wrapper-expanded-legend" :class="{ 'is-cursor-locked': cursorLocked }">
        <div
          class="c-state-indicator__alert-cursor-lock--verbose icon-cursor-lock"
          title="Click anywhere in the plot to unlock."
        >
          Cursor locked to point
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th v-if="showTimestampWhenExpanded">Timestamp</th>
              <th v-if="showValueWhenExpanded">Value</th>
              <th v-if="showUnitsWhenExpanded">Unit</th>
              <th v-if="showMinimumWhenExpanded" class="mobile-hide">Min</th>
              <th v-if="showMaximumWhenExpanded" class="mobile-hide">Max</th>
            </tr>
          </thead>
          <tbody>
            <plot-legend-item-expanded
              v-for="(seriesObject, seriesIndex) in seriesModels"
              :key="`${seriesObject.keyString}-${seriesIndex}-expanded`"
              :series-key-string="seriesObject.keyString"
              :highlights="highlights"
              @legendHoverChanged="legendHoverChanged"
            />
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script>
import configStore from '../configuration/ConfigStore';
import eventHelpers from '../lib/eventHelpers';
import PlotLegendItemCollapsed from './PlotLegendItemCollapsed.vue';
import PlotLegendItemExpanded from './PlotLegendItemExpanded.vue';

export default {
  components: {
    PlotLegendItemExpanded,
    PlotLegendItemCollapsed
  },
  inject: ['openmct', 'domainObject'],
  props: {
    cursorLocked: {
      type: Boolean,
      default() {
        return false;
      }
    },
    highlights: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      isLegendExpanded: false,
      seriesModels: [],
      loaded: false
    };
  },
  computed: {
    showUnitsWhenExpanded() {
      return this.loaded && this.legend.get('showUnitsWhenExpanded') === true;
    },
    showMinimumWhenExpanded() {
      return this.loaded && this.legend.get('showMinimumWhenExpanded') === true;
    },
    showMaximumWhenExpanded() {
      return this.loaded && this.legend.get('showMaximumWhenExpanded') === true;
    },
    showValueWhenExpanded() {
      return this.loaded && this.legend.get('showValueWhenExpanded') === true;
    },
    showTimestampWhenExpanded() {
      return this.loaded && this.legend.get('showTimestampWhenExpanded') === true;
    },
    isLegendHidden() {
      return this.loaded && this.legend.get('hideLegendWhenSmall') === true;
    },
    valueToShowWhenCollapsed() {
      return this.loaded && this.legend.get('valueToShowWhenCollapsed');
    }
  },
  created() {
    eventHelpers.extend(this);
    this.config = this.getConfig();
    this.legend = this.config.legend;
    this.seriesModels = [];
    this.listenTo(this.config.legend, 'change:position', this.updatePosition, this);
    this.initialize();
  },
  mounted() {
    this.loaded = true;
    this.isLegendExpanded = this.legend.get('expanded') === true;
    this.updatePosition();
  },
  beforeUnmount() {
    if (this.objectComposition) {
      this.objectComposition.off('add', this.addTelemetryObject);
      this.objectComposition.off('remove', this.removeTelemetryObject);
    }

    this.stopListening();
  },
  methods: {
    initialize() {
      if (this.domainObject.type === 'telemetry.plot.stacked') {
        this.objectComposition = this.openmct.composition.get(this.domainObject);
        this.objectComposition.on('add', this.addTelemetryObject);
        this.objectComposition.on('remove', this.removeTelemetryObject);
        this.objectComposition.load();
      } else {
        this.registerListeners(this.config);
      }
    },
    getConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      return configStore.get(configId);
    },
    addTelemetryObject(object) {
      //get the config for each child
      const configId = this.openmct.objects.makeKeyString(object.identifier);
      const config = configStore.get(configId);
      if (config) {
        this.registerListeners(config);
      }
    },
    removeTelemetryObject(identifier) {
      const configId = this.openmct.objects.makeKeyString(identifier);
      const config = configStore.get(configId);
      if (config) {
        config.series.forEach(this.removeSeries, this);
      }
    },
    registerListeners(config) {
      //listen to any changes to the telemetry endpoints that are associated with the child
      this.listenTo(config.series, 'add', this.addSeries, this);
      this.listenTo(config.series, 'remove', this.removeSeries, this);
      config.series.forEach(this.addSeries, this);
    },
    addSeries(series) {
      this.seriesModels[this.seriesModels.length] = series;
    },

    removeSeries(plotSeries) {
      this.stopListening(plotSeries);

      const seriesIndex = this.seriesModels.findIndex(
        (series) => series.keyString === plotSeries.keyString
      );
      this.seriesModels.splice(seriesIndex, 1);
    },
    expandLegend() {
      this.isLegendExpanded = !this.isLegendExpanded;
      this.legend.set('expanded', this.isLegendExpanded);
      this.$emit('expanded', this.isLegendExpanded);
    },
    legendHoverChanged(data) {
      this.$emit('legendHoverChanged', data);
    },
    updatePosition() {
      this.$emit('position', this.legend.get('position'));
    }
  }
};
</script>
