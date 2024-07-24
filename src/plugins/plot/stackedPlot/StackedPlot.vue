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
  <div
    v-if="loaded"
    class="c-plot c-plot--stacked holder holder-plot has-control-bar u-style-receiver js-style-receiver"
    :class="[plotLegendExpandedStateClass, plotLegendPositionClass]"
    aria-label="Stacked Plot Style Target"
  >
    <PlotLegend
      v-if="compositionObjectsConfigLoaded && showLegendsForChildren === false"
      :cursor-locked="!!lockHighlightPoint"
      :highlights="highlights"
      class="js-stacked-plot-legend"
      @legend-hover-changed="legendHoverChanged"
      @expanded="updateExpanded"
      @position="updatePosition"
    />
    <div class="l-view-section">
      <StackedPlotItem
        v-for="objectWrapper in compositionObjects"
        ref="stackedPlotItems"
        :key="objectWrapper.keyString"
        class="c-plot--stacked-container"
        :child-object="objectWrapper.object"
        :options="options"
        :grid-lines="gridLines"
        :color-palette="colorPalette"
        :cursor-guide="cursorGuide"
        :show-limit-line-labels="showLimitLineLabels"
        :hide-legend="showLegendsForChildren === false"
        @loading-updated="loadingUpdated"
        @cursor-guide="onCursorGuideChange"
        @grid-lines="onGridLinesChange"
        @lock-highlight-point="lockHighlightPointUpdated"
        @highlights="highlightsUpdated"
        @config-loaded="configLoadedForObject(objectWrapper.keyString)"
      />
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

import ColorPalette from '@/ui/color/ColorPalette';

import ImageExporter from '../../../exporters/ImageExporter.js';
import { useAlignment } from '../../../ui/composables/alignmentContext.js';
import configStore from '../configuration/ConfigStore.js';
import PlotConfigurationModel from '../configuration/PlotConfigurationModel.js';
import PlotLegend from '../legend/PlotLegend.vue';
import eventHelpers from '../lib/eventHelpers.js';
import StackedPlotItem from './StackedPlotItem.vue';

export default {
  components: {
    StackedPlotItem,
    PlotLegend
  },
  inject: ['openmct', 'domainObject', 'objectPath', 'renderWhenVisible'],
  props: {
    options: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  setup() {
    const domainObject = inject('domainObject');
    const objectPath = inject('objectPath');
    const openmct = inject('openmct');
    const { alignment: alignmentData, reset: resetAlignment } = useAlignment(
      domainObject,
      objectPath,
      openmct
    );

    return { alignmentData, resetAlignment };
  },
  data() {
    return {
      hideExportButtons: false,
      cursorGuide: false,
      gridLines: true,
      configLoaded: {},
      compositionObjects: [],
      loaded: false,
      lockHighlightPoint: false,
      highlights: [],
      showLimitLineLabels: undefined,
      colorPalette: new ColorPalette(),
      compositionObjectsConfigLoaded: false,
      position: 'top',
      showLegendsForChildren: true,
      expanded: false
    };
  },
  computed: {
    plotLegendPositionClass() {
      if (this.showLegendsForChildren) {
        return '';
      }

      return `plot-legend-${this.position}`;
    },
    plotLegendExpandedStateClass() {
      let legendExpandedStateClass = '';

      if (this.showLegendsForChildren !== true && this.expanded) {
        legendExpandedStateClass = 'plot-legend-expanded';
      } else if (this.showLegendsForChildren !== true && !this.expanded) {
        legendExpandedStateClass = 'plot-legend-collapsed';
      }

      return legendExpandedStateClass;
    }
  },
  beforeUnmount() {
    this.destroy();
  },
  mounted() {
    eventHelpers.extend(this);
    //We only need to initialize the stacked plot config for legend properties
    const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    this.config = this.getConfig(configId);
    this.showLegendsForChildren = this.config.legend.get('showLegendsForChildren');

    this.loaded = true;
    this.imageExporter = new ImageExporter(this.openmct);

    this.composition = this.openmct.composition.get(this.domainObject);
    this.composition.on('add', this.addChild);
    this.composition.on('remove', this.removeChild);
    this.composition.on('reorder', this.compositionReorder);
    this.composition.load();
  },
  methods: {
    getConfig(configId) {
      let config = configStore.get(configId);
      if (!config) {
        config = new PlotConfigurationModel({
          id: configId,
          domainObject: this.domainObject,
          openmct: this.openmct,
          callback: (data) => {
            this.data = data;
          }
        });
        configStore.add(configId, config);
      }

      return config;
    },
    loadingUpdated(loaded) {
      this.loading = loaded;
    },
    configLoadedForObject(childObjIdentifier) {
      const childObjId = this.openmct.objects.makeKeyString(childObjIdentifier);
      this.configLoaded[childObjId] = true;
      this.setConfigLoadedForComposition();
    },
    setConfigLoadedForComposition() {
      this.compositionObjectsConfigLoaded =
        this.compositionObjects.length &&
        this.compositionObjects.every((childObject) => {
          const id = childObject.keyString;

          return this.configLoaded[id] === true;
        });
      if (this.compositionObjectsConfigLoaded) {
        this.listenTo(
          this.config.legend,
          'change:showLegendsForChildren',
          this.updateShowLegendsForChildren,
          this
        );
      }
    },
    destroy() {
      this.resetAlignment();
      this.composition.off('add', this.addChild);
      this.composition.off('remove', this.removeChild);
      this.composition.off('reorder', this.compositionReorder);

      this.stopListening();
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
      configStore.deleteStore(configId);
    },

    addChild(child) {
      if (this.openmct.objects.isMissing(child)) {
        console.warn('Missing domain object for stacked plot: ', child);
        return;
      }

      const id = this.openmct.objects.makeKeyString(child.identifier);

      this.compositionObjects.push({
        object: child,
        keyString: id
      });
      this.setConfigLoadedForComposition();
    },

    removeChild(childIdentifier) {
      const id = this.openmct.objects.makeKeyString(childIdentifier);

      const childObj = this.compositionObjects.filter((c) => {
        const identifier = c.keyString;

        return identifier === id;
      })[0];

      if (childObj) {
        if (childObj.object.type !== 'telemetry.plot.overlay') {
          const config = this.getConfig(childObj.keyString);
          if (config) {
            config.series.remove(config.series.at(0));
          }
        }
      }

      this.compositionObjects = this.compositionObjects.filter((c) => {
        const identifier = c.keyString;

        return identifier !== id;
      });

      const configIndex = this.domainObject.configuration.series.findIndex((seriesConfig) => {
        return this.openmct.objects.areIdsEqual(seriesConfig.identifier, childIdentifier);
      });
      if (configIndex > -1) {
        const cSeries = this.domainObject.configuration.series.slice();
        this.openmct.objects.mutate(this.domainObject, 'configuration.series', cSeries);
      }

      this.setConfigLoadedForComposition();
    },

    compositionReorder(reorderPlan) {
      let oldComposition = this.compositionObjects.slice();

      reorderPlan.forEach((reorder) => {
        this.compositionObjects[reorder.newIndex] = oldComposition[reorder.oldIndex];
      });
    },

    resetTelemetry(domainObject) {
      this.compositionObjects = [];
    },

    exportJPG() {
      this.hideExportButtons = true;
      const plotElement = this.$el;

      this.imageExporter.exportJPG(plotElement, 'stacked-plot.jpg', 'export-plot').finally(
        function () {
          this.hideExportButtons = false;
        }.bind(this)
      );
    },

    exportPNG() {
      this.hideExportButtons = true;

      const plotElement = this.$el;

      this.imageExporter.exportPNG(plotElement, 'stacked-plot.png', 'export-plot').finally(
        function () {
          this.hideExportButtons = false;
        }.bind(this)
      );
    },
    legendHoverChanged(data) {
      this.showLimitLineLabels = data;
    },
    lockHighlightPointUpdated(data) {
      this.lockHighlightPoint = data;
    },
    updateExpanded(expanded) {
      this.expanded = expanded;
    },
    updatePosition(position) {
      this.position = position;
    },
    updateShowLegendsForChildren(showLegendsForChildren) {
      this.showLegendsForChildren = showLegendsForChildren;
    },
    updateReady(ready) {
      this.configReady = ready;
    },
    highlightsUpdated(data) {
      this.highlights = data;
    },
    onCursorGuideChange(cursorGuide) {
      this.cursorGuide = cursorGuide === true;
    },
    onGridLinesChange(gridLines) {
      this.gridLines = gridLines === true;
    },
    getViewContext() {
      return {
        exportPNG: this.exportPNG,
        exportJPG: this.exportJPG
      };
    }
  }
};
</script>
