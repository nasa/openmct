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
    ref="plotWrapper"
    class="c-plot holder holder-plot has-control-bar"
    :class="isStale && 'is-stale'"
  >
    <div
      ref="plotContainer"
      class="l-view-section u-style-receiver js-style-receiver"
      aria-label="Plot Container Style Target"
      :class="{
        's-status-timeconductor-unsynced': status === 'timeconductor-unsynced'
      }"
    >
      <progress-bar
        v-show="!!loading"
        class="c-telemetry-table__progress-bar"
        :model="{ progressPerc: null }"
      />
      <mct-plot
        ref="mctPlot"
        :class="[plotLegendExpandedStateClass, plotLegendPositionClass]"
        :init-grid-lines="gridLinesProp"
        :init-cursor-guide="cursorGuide"
        :options="options"
        :limit-line-labels="limitLineLabelsProp"
        :parent-y-tick-width="parentYTickWidth"
        :color-palette="colorPalette"
        @loading-updated="loadingUpdated"
        @status-updated="setStatus"
        @config-loaded="updateReady"
        @lock-highlight-point="lockHighlightPointUpdated"
        @highlights="highlightsUpdated"
        @plot-y-tick-width="onYTickWidthChange"
        @cursor-guide="onCursorGuideChange"
        @grid-lines="onGridLinesChange"
      >
        <plot-legend
          v-if="configReady && hideLegend === false"
          :cursor-locked="lockHighlightPoint"
          :highlights="highlights"
          @legend-hover-changed="legendHoverChanged"
          @expanded="updateExpanded"
          @position="updatePosition"
        />
      </mct-plot>
    </div>
  </div>
</template>

<script>
import stalenessMixin from '@/ui/mixins/staleness-mixin';

import ImageExporter from '../../exporters/ImageExporter.js';
import ProgressBar from '../../ui/components/ProgressBar.vue';
import PlotLegend from './legend/PlotLegend.vue';
import eventHelpers from './lib/eventHelpers.js';
import MctPlot from './MctPlot.vue';

export default {
  components: {
    MctPlot,
    ProgressBar,
    PlotLegend
  },
  mixins: [stalenessMixin],
  inject: ['openmct', 'domainObject'],
  props: {
    options: {
      type: Object,
      default() {
        return {
          compact: false
        };
      }
    },
    gridLines: {
      type: Boolean,
      default() {
        return true;
      }
    },
    cursorGuide: {
      type: Boolean,
      default() {
        return false;
      }
    },
    parentLimitLineLabels: {
      type: Object,
      default() {
        return undefined;
      }
    },
    colorPalette: {
      type: Object,
      default() {
        return undefined;
      }
    },
    parentYTickWidth: {
      type: Object,
      default() {
        return {
          leftTickWidth: 0,
          rightTickWidth: 0,
          hasMultipleLeftAxes: false
        };
      }
    },
    hideLegend: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  emits: [
    'loading-updated',
    'lock-highlight-point',
    'grid-lines',
    'highlights',
    'config-loaded',
    'plot-y-tick-width',
    'cursor-guide'
  ],
  data() {
    return {
      loading: false,
      status: '',
      limitLineLabels: undefined,
      lockHighlightPoint: false,
      highlights: [],
      expanded: false,
      position: undefined,
      configReady: false
    };
  },
  computed: {
    limitLineLabelsProp() {
      return this.parentLimitLineLabels ?? this.limitLineLabels;
    },
    gridLinesProp() {
      return this.gridLines ?? !this.options.compact;
    },
    plotLegendPositionClass() {
      return this.position ? `plot-legend-${this.position}` : '';
    },
    plotLegendExpandedStateClass() {
      if (this.expanded) {
        return 'plot-legend-expanded';
      } else {
        return 'plot-legend-collapsed';
      }
    }
  },
  watch: {
    gridLines(newGridLines) {
      this.gridLines = newGridLines;
    },
    cursorGuide(newCursorGuide) {
      this.cursorGuide = newCursorGuide;
    }
  },
  created() {
    eventHelpers.extend(this);
    this.imageExporter = new ImageExporter(this.openmct);
    this.loadComposition();
    this.setupClockChangedEvent((domainObject) => {
      this.triggerUnsubscribeFromStaleness(domainObject);
      this.subscribeToStaleness(domainObject);
    });
  },
  unmounted() {
    this.destroy();
  },
  methods: {
    loadComposition() {
      this.compositionCollection = this.openmct.composition.get(this.domainObject);

      if (this.compositionCollection) {
        this.compositionCollection.on('add', this.subscribeToStaleness);
        this.compositionCollection.on('remove', this.removeSubscription);
        this.compositionCollection.load();
      }
    },
    removeSubscription(identifier) {
      this.triggerUnsubscribeFromStaleness({
        identifier
      });
    },
    loadingUpdated(loading) {
      this.loading = loading;
      this.$emit('loading-updated', ...arguments);
    },
    destroy() {
      if (this.compositionCollection) {
        this.compositionCollection.off('add', this.subscribeToStaleness);
        this.compositionCollection.off('remove', this.removeSubscription);
      }

      this.imageExporter = null;
      this.stopListening();
    },
    exportJPG() {
      const plotElement = this.$refs.plotContainer;
      this.imageExporter.exportJPG(plotElement, 'plot.jpg', 'export-plot');
    },
    exportPNG() {
      const plotElement = this.$refs.plotContainer;
      this.imageExporter.exportPNG(plotElement, 'plot.png', 'export-plot');
    },
    setStatus(status) {
      this.status = status;
    },
    getViewContext() {
      return {
        exportPNG: this.exportPNG,
        exportJPG: this.exportJPG
      };
    },
    lockHighlightPointUpdated(data) {
      this.lockHighlightPoint = data;
      this.$emit('lock-highlight-point', ...arguments);
    },
    highlightsUpdated(data) {
      this.highlights = data;
      this.$emit('highlights', ...arguments);
    },
    legendHoverChanged(data) {
      this.limitLineLabels = data;
    },
    updateExpanded(expanded) {
      this.expanded = expanded;
    },
    updatePosition(position) {
      this.position = position;
    },
    updateReady(ready) {
      this.configReady = ready;
      this.$emit('config-loaded', ...arguments);
    },
    onYTickWidthChange() {
      this.$emit('plot-y-tick-width', ...arguments);
    },
    onCursorGuideChange() {
      this.$emit('cursor-guide', ...arguments);
    },
    onGridLinesChange() {
      this.$emit('grid-lines', ...arguments);
    }
  }
};
</script>
