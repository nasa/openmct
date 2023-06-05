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
    class="plot-legend-item"
    :class="{
      'is-stale': isStale,
      'is-status--missing': isMissing
    }"
    @mouseover="toggleHover(true)"
    @mouseleave="toggleHover(false)"
  >
    <div class="plot-series-swatch-and-name">
      <span class="plot-series-color-swatch" :style="{ 'background-color': colorAsHexString }">
      </span>
      <span class="is-status__indicator" title="This item is missing or suspect"></span>
      <span class="plot-series-name">{{ nameWithUnit }}</span>
    </div>
    <div
      v-show="
        !!highlights.length &&
        valueToShowWhenCollapsed !== 'none' &&
        valueToShowWhenCollapsed !== 'unit'
      "
      class="plot-series-value hover-value-enabled"
      :class="[
        { 'cursor-hover': notNearest },
        valueToDisplayWhenCollapsedClass,
        mctLimitStateClass
      ]"
    >
      <span v-if="valueToShowWhenCollapsed === 'nearestValue'">{{ formattedYValue }}</span>
      <span v-else-if="valueToShowWhenCollapsed === 'nearestTimestamp'">{{ formattedXValue }}</span>
      <span v-else>{{ formattedYValueFromStats }}</span>
    </div>
  </div>
</template>
<script>
import { getLimitClass } from '@/plugins/plot/chart/limitUtil';
import eventHelpers from '../lib/eventHelpers';
import stalenessMixin from '@/ui/mixins/staleness-mixin';
import configStore from '../configuration/ConfigStore';

export default {
  mixins: [stalenessMixin],
  inject: ['openmct', 'domainObject'],
  props: {
    seriesObject: {
      type: Object,
      required: true,
      default() {
        return {};
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
      isMissing: false,
      colorAsHexString: '',
      nameWithUnit: '',
      formattedYValue: '',
      formattedXValue: '',
      mctLimitStateClass: '',
      formattedYValueFromStats: '',
      loaded: false
    };
  },
  computed: {
    valueToShowWhenCollapsed() {
      return this.loaded ? this.legend.get('valueToShowWhenCollapsed') : [];
    },
    valueToDisplayWhenCollapsedClass() {
      return `value-to-display-${this.valueToShowWhenCollapsed}`;
    },
    notNearest() {
      return this.valueToShowWhenCollapsed.indexOf('nearest') > -1;
    }
  },
  watch: {
    highlights(newHighlights) {
      const highlightedObject = newHighlights.find(
        (highlight) => highlight.series.keyString === this.seriesObject.keyString
      );
      if (newHighlights.length === 0 || highlightedObject) {
        this.initialize(highlightedObject);
      }
    }
  },
  mounted() {
    eventHelpers.extend(this);
    this.config = this.getConfig();
    this.legend = this.config.legend;
    this.loaded = true;
    this.listenTo(
      this.seriesObject,
      'change:color',
      (newColor) => {
        this.updateColor(newColor);
      },
      this
    );
    this.listenTo(
      this.seriesObject,
      'change:name',
      () => {
        this.updateName();
      },
      this
    );
    this.subscribeToStaleness(this.seriesObject.domainObject);
    this.initialize();
  },
  beforeDestroy() {
    this.stopListening();
  },
  methods: {
    getConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      return configStore.get(configId);
    },
    initialize(highlightedObject) {
      const seriesObject = highlightedObject?.series || this.seriesObject;

      this.isMissing = seriesObject.domainObject.status === 'missing';
      this.colorAsHexString = seriesObject.get('color').asHexString();
      this.nameWithUnit = seriesObject.nameWithUnit();

      const closest = seriesObject.closest;
      if (closest) {
        this.formattedYValue = seriesObject.formatY(closest);
        this.formattedXValue = seriesObject.formatX(closest);
        this.mctLimitStateClass = closest.mctLimitState
          ? getLimitClass(closest.mctLimitState, 'c-plot-limit--')
          : '';
      } else {
        this.formattedYValue = '';
        this.formattedXValue = '';
        this.mctLimitStateClass = '';
      }

      const stats = seriesObject.get('stats');
      if (stats) {
        this.formattedYValueFromStats = seriesObject.formatY(
          stats[this.valueToShowWhenCollapsed + 'Point']
        );
      } else {
        this.formattedYValueFromStats = '';
      }
    },
    updateColor(newColor) {
      this.colorAsHexString = newColor.asHexString();
    },
    updateName() {
      this.nameWithUnit = this.seriesObject.nameWithUnit();
    },
    toggleHover(hover) {
      this.hover = hover;
      this.$emit('legendHoverChanged', {
        seriesKey: this.hover ? this.seriesObject.keyString : ''
      });
    }
  }
};
</script>
