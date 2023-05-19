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
  <div ref="plotWrapper" class="c-plot holder holder-plot has-control-bar" :class="staleClass">
    <div
      ref="plotContainer"
      class="l-view-section u-style-receiver js-style-receiver"
      :class="{ 's-status-timeconductor-unsynced': status && status === 'timeconductor-unsynced' }"
    >
      <progress-bar
        v-show="!!loading"
        class="c-telemetry-table__progress-bar"
        :model="{ progressPerc: undefined }"
      />
      <mct-plot
        :class="[plotLegendExpandedStateClass, plotLegendPositionClass]"
        :init-grid-lines="gridLines"
        :init-cursor-guide="cursorGuide"
        :options="options"
        :limit-line-labels="limitLineLabels"
        @loadingUpdated="loadingUpdated"
        @statusUpdated="setStatus"
        @configLoaded="updateReady"
        @lockHighlightPoint="lockHighlightPointUpdated"
        @highlights="highlightsUpdated"
      >
        <plot-legend
          v-if="configReady"
          :cursor-locked="lockHighlightPoint"
          :highlights="highlights"
          @legendHoverChanged="legendHoverChanged"
          @expanded="updateExpanded"
          @position="updatePosition"
        />
      </mct-plot>
    </div>
  </div>
</template>

<script>
import eventHelpers from './lib/eventHelpers';
import ImageExporter from '../../exporters/ImageExporter';
import MctPlot from './MctPlot.vue';
import PlotLegend from './legend/PlotLegend.vue';
import ProgressBar from '../../ui/components/ProgressBar.vue';
import StalenessUtils from '@/utils/staleness';

export default {
  components: {
    MctPlot,
    ProgressBar,
    PlotLegend
  },
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    options: {
      type: Object,
      default() {
        return {
          compact: false
        };
      }
    }
  },
  data() {
    return {
      //Don't think we need this as it appears to be stacked plot specific
      // hideExportButtons: false
      cursorGuide: false,
      gridLines: !this.options.compact,
      loading: false,
      status: '',
      staleObjects: [],
      limitLineLabels: undefined,
      lockHighlightPoint: false,
      highlights: [],
      expanded: false,
      position: undefined,
      configReady: false
    };
  },
  computed: {
    staleClass() {
      if (this.staleObjects.length !== 0) {
        return 'is-stale';
      }

      return '';
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
  mounted() {
    eventHelpers.extend(this);
    this.imageExporter = new ImageExporter(this.openmct);
    this.loadComposition();
    this.stalenessSubscription = {};
  },
  beforeDestroy() {
    this.destroy();
  },
  methods: {
    loadComposition() {
      this.compositionCollection = this.openmct.composition.get(this.domainObject);

      if (this.compositionCollection) {
        this.compositionCollection.on('add', this.addItem);
        this.compositionCollection.on('remove', this.removeItem);
        this.compositionCollection.load();
      }
    },
    addItem(object) {
      const keystring = this.openmct.objects.makeKeyString(object.identifier);

      if (!this.stalenessSubscription[keystring]) {
        this.stalenessSubscription[keystring] = {};
        this.stalenessSubscription[keystring].stalenessUtils = new StalenessUtils(
          this.openmct,
          object
        );
      }

      this.openmct.telemetry.isStale(object).then((stalenessResponse) => {
        if (stalenessResponse !== undefined) {
          this.handleStaleness(keystring, stalenessResponse);
        }
      });
      const unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(
        object,
        (stalenessResponse) => {
          this.handleStaleness(keystring, stalenessResponse);
        }
      );

      this.stalenessSubscription[keystring].unsubscribe = unsubscribeFromStaleness;
    },
    removeItem(object) {
      const SKIP_CHECK = true;
      const keystring = this.openmct.objects.makeKeyString(object);
      this.stalenessSubscription[keystring].unsubscribe();
      this.stalenessSubscription[keystring].stalenessUtils.destroy();
      this.handleStaleness(keystring, { isStale: false }, SKIP_CHECK);
      delete this.stalenessSubscription[keystring];
    },
    handleStaleness(id, stalenessResponse, skipCheck = false) {
      if (
        skipCheck ||
        this.stalenessSubscription[id].stalenessUtils.shouldUpdateStaleness(stalenessResponse, id)
      ) {
        const index = this.staleObjects.indexOf(id);
        if (stalenessResponse.isStale) {
          if (index === -1) {
            this.staleObjects.push(id);
          }
        } else {
          if (index !== -1) {
            this.staleObjects.splice(index, 1);
          }
        }
      }
    },
    loadingUpdated(loading) {
      this.loading = loading;
    },
    destroy() {
      if (this.stalenessSubscription) {
        Object.values(this.stalenessSubscription).forEach((stalenessSubscription) => {
          stalenessSubscription.unsubscribe();
          stalenessSubscription.stalenessUtils.destroy();
        });
      }

      if (this.compositionCollection) {
        this.compositionCollection.off('add', this.addItem);
        this.compositionCollection.off('remove', this.removeItem);
      }

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
    },
    highlightsUpdated(data) {
      this.highlights = data;
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
    }
  }
};
</script>
