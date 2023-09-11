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
  <tr
    class="plot-legend-item"
    :class="{
      'is-stale': isStale,
      'is-status--missing': isMissing
    }"
    @mouseover="toggleHover(true)"
    @mouseleave="toggleHover(false)"
  >
    <td class="plot-series-swatch-and-name">
      <span class="plot-series-color-swatch" :style="{ 'background-color': colorAsHexString }">
      </span>
      <span class="is-status__indicator" title="This item is missing or suspect"></span>
      <span
        ref="seriesName"
        class="plot-series-name"
        @mouseover.ctrl="showToolTip"
        @mouseleave="hideToolTip"
      >
        {{ name }}
      </span>
    </td>

    <td v-if="showTimestampWhenExpanded">
      <span class="plot-series-value cursor-hover hover-value-enabled">
        {{ formattedXValue }}
      </span>
    </td>
    <td v-if="showValueWhenExpanded">
      <span
        class="plot-series-value cursor-hover hover-value-enabled"
        :class="[mctLimitStateClass]"
      >
        {{ formattedYValue }}
      </span>
    </td>
    <td v-if="showUnitsWhenExpanded">
      <span class="plot-series-value cursor-hover hover-value-enabled">
        {{ unit }}
      </span>
    </td>
    <td v-if="showMinimumWhenExpanded" class="mobile-hide">
      <span class="plot-series-value">
        {{ formattedMinY }}
      </span>
    </td>
    <td v-if="showMaximumWhenExpanded" class="mobile-hide">
      <span class="plot-series-value">
        {{ formattedMaxY }}
      </span>
    </td>
  </tr>
</template>

<script>
import { getLimitClass } from '@/plugins/plot/chart/limitUtil';
import eventHelpers from '@/plugins/plot/lib/eventHelpers';
import stalenessMixin from '@/ui/mixins/staleness-mixin';

import tooltipHelpers from '../../../api/tooltips/tooltipMixins';
import configStore from '../configuration/ConfigStore';

export default {
  mixins: [stalenessMixin, tooltipHelpers],
  inject: ['openmct', 'domainObject'],
  props: {
    seriesKeyString: {
      type: String,
      required: true
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
      isMissing: false,
      colorAsHexString: '',
      name: '',
      unit: '',
      formattedYValue: '',
      formattedXValue: '',
      formattedMinY: '',
      formattedMaxY: '',
      mctLimitStateClass: '',
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
    }
  },
  watch: {
    highlights: {
      handler(newHighlights) {
        const highlightedObject = newHighlights.find(
          (highlight) => highlight.seriesKeyString === this.seriesKeyString
        );
        if (newHighlights.length === 0 || highlightedObject) {
          this.initialize(highlightedObject);
        }
      },
      deep: true
    }
  },
  mounted() {
    this.seriesModels = [];
    eventHelpers.extend(this);
    this.config = this.getConfig();
    this.listenTo(this.config.series, 'add', this.onSeriesAdd, this);
    this.listenTo(this.config.series, 'remove', this.onSeriesRemove, this);
    this.config.series.forEach(this.onSeriesAdd, this);
    this.legend = this.config.legend;
    this.loaded = true;
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    onSeriesAdd(series, index) {
      this.seriesModels[index] = series;
      if (series.keyString === this.seriesKeyString) {
        this.listenTo(
          series,
          'change:color',
          (newColor) => {
            this.updateColor(newColor);
          },
          this
        );
        this.listenTo(
          series,
          'change:name',
          () => {
            this.updateName();
          },
          this
        );
        this.subscribeToStaleness(series.domainObject);
        this.initialize();
      }
    },
    onSeriesRemove(seriesToRemove) {
      const seriesIndexToRemove = this.seriesModels.findIndex(
        (series) => series.keyString === seriesToRemove.keyString
      );
      this.seriesModels.splice(seriesIndexToRemove, 1);
    },
    getSeries(keyStringToFind) {
      const foundSeries = this.seriesModels.find((series) => {
        return series.keyString === keyStringToFind;
      });
      return foundSeries;
    },
    getConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      return configStore.get(configId);
    },
    initialize(highlightedObject) {
      const seriesKeyStringToUse = highlightedObject?.seriesKeyString || this.seriesKeyString;
      const seriesObject = this.getSeries(seriesKeyStringToUse);

      this.isMissing = seriesObject.domainObject.status === 'missing';
      this.colorAsHexString = seriesObject.get('color').asHexString();
      this.name = seriesObject.get('name');
      this.unit = seriesObject.get('unit');
      const closest = seriesObject.closest;
      if (closest) {
        this.formattedYValue = seriesObject.formatY(closest);
        this.formattedXValue = seriesObject.formatX(closest);
        this.mctLimitStateClass = seriesObject.closest.mctLimitState
          ? getLimitClass(seriesObject.closest.mctLimitState, 'c-plot-limit--')
          : '';
      } else {
        this.formattedYValue = '';
        this.formattedXValue = '';
        this.mctLimitStateClass = '';
      }

      const stats = seriesObject.get('stats');
      if (stats) {
        this.formattedMinY = seriesObject.formatY(stats.minPoint);
        this.formattedMaxY = seriesObject.formatY(stats.maxPoint);
      } else {
        this.formattedMinY = '';
        this.formattedMaxY = '';
      }
    },
    updateColor(newColor) {
      this.colorAsHexString = newColor.asHexString();
    },
    updateName() {
      const seriesObject = this.getSeries(this.seriesKeyString);
      this.nameWithUnit = seriesObject.nameWithUnit();
    },
    toggleHover(hover) {
      this.hover = hover;
      this.$emit('legendHoverChanged', {
        seriesKey: this.hover ? this.seriesKeyString : ''
      });
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      const seriesIdentifier = this.openmct.objects.parseKeyString(this.seriesKeyString);
      this.buildToolTip(await this.getTelemetryPathString(seriesIdentifier), BELOW, 'seriesName');
    }
  }
};
</script>
