<!--
 Open MCT, Copyright (c) 2014-2026, United States Government
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
  <div ref="plotWrapper" class="has-local-controls" :class="{ 's-unsynced': isZoomed }">
    <div v-if="isZoomed || hasValuesHiddenByLogScale" class="l-state-indicators">
      <span
        v-if="isZoomed"
        class="l-state-indicators__alert-no-lad t-object-alert t-alert-unsynced icon-alert-triangle"
        title="This plot is not currently displaying the latest data. Reset pan/zoom to view latest data."
      ></span>
      <span
        v-if="hasValuesHiddenByLogScale"
        class="l-state-indicators__alert-no-lad t-object-alert icon-alert-triangle js-log-scale-alert"
        :title="logScaleWarning"
        :aria-label="logScaleWarning"
      ></span>
    </div>
    <div ref="plot" class="c-bar-chart" @plotly_relayout="zoom"></div>
    <div
      v-if="false"
      ref="localControl"
      class="gl-plot__local-controls h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover"
    >
      <button
        v-if="data.length"
        class="c-button icon-reset"
        :disabled="!isZoomed"
        title="Reset pan/zoom"
        @click="reset()"
      ></button>
    </div>
  </div>
</template>
<script>
import Plotly from 'plotly-basic';

import {
  AXIS_SCALING_KEY,
  getAxisBoundsLayout,
  getAxisConfig,
  getLogAxisTickLayout,
  hasNegativeValues,
  isLogModeEnabled
} from '../axisConfig.js';

const LOG_SCALE_WARNING =
  'Negative values cannot be shown on a logarithmic Y axis and have been omitted.';

// `alert` notifications persist until dismissed - only `info` sets the model's
// autoDismiss flag, and it cannot be set through options. Matches Open MCT's
// own DEFAULT_AUTO_DISMISS_TIMEOUT.
const LOG_SCALE_WARNING_DISMISS_MS = 3000;

const MULTI_AXES_X_PADDING_PERCENT = {
  LEFT: 8,
  RIGHT: 94
};

export default {
  inject: ['openmct', 'domainObject'],
  props: {
    data: {
      type: Array,
      default() {
        return [];
      }
    },
    plotAxisTitle: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  emits: ['subscribe', 'unsubscribe'],
  data() {
    return {
      isZoomed: false,
      hasValuesHiddenByLogScale: false
    };
  },
  computed: {
    logScaleWarning() {
      return LOG_SCALE_WARNING;
    }
  },
  watch: {
    data: {
      immediate: false,
      handler: 'updateData'
    }
  },
  created() {
    this.registerListeners();
  },
  mounted() {
    this.plotResizeObserver.observe(this.$refs.plotWrapper);
    Plotly.newPlot(this.$refs.plot, Array.from(this.data), this.getLayout(), {
      responsive: true,
      displayModeBar: false
    });
  },
  beforeUnmount() {
    if (this.plotResizeObserver) {
      this.plotResizeObserver.unobserve(this.$refs.plotWrapper);
      this.plotResizeObserver.disconnect();
      clearTimeout(this.resizeTimer);
    }

    if (this.removeBarColorListener) {
      this.removeBarColorListener();
    }

    if (this.removeAxisScalingListener) {
      this.removeAxisScalingListener();
    }

    clearTimeout(this.logScaleNotificationTimer);

    Plotly.purge(this.$refs.plot);
  },
  methods: {
    /**
     * Build the range portion of an axis layout from the persisted scaling
     * configuration. A range may fix either end, both, or neither - see
     * `getAxisBoundsLayout`, which also handles converting bounds to the log
     * units Plotly expects on a logarithmic axis.
     */
    getAxisRangeLayout(axisKey) {
      const axis = getAxisConfig(this.domainObject, axisKey);
      const logMode = isLogModeEnabled(this.domainObject, axisKey);
      const axisType = logMode ? { type: 'log', ...getLogAxisTickLayout() } : {};

      if (axis.autoscale !== false || !axis.range) {
        return { ...axisType, autorange: true };
      }

      return { ...axisType, ...getAxisBoundsLayout(axis.range, logMode) };
    },
    getLayout() {
      const yAxesMeta = this.getYAxisMeta();
      const primaryYaxis = this.getYaxisLayout(yAxesMeta['1']);
      const xAxisDomain = this.getXAxisDomain(yAxesMeta);

      return {
        autosize: true,
        showlegend: false,
        textposition: 'auto',
        font: {
          family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          size: '12px',
          color: '#666'
        },
        xaxis: {
          domain: xAxisDomain,
          ...this.getAxisRangeLayout('xAxis'),
          title: this.plotAxisTitle.xAxisTitle,
          automargin: true,
          fixedrange: true
        },
        yaxis: primaryYaxis,
        margin: {
          l: 5,
          r: 5,
          t: 5,
          b: 0
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent'
      };
    },
    getYAxisMeta() {
      const yAxisMeta = {};

      this.data.forEach((datum) => {
        const yAxisMetadata = datum.yAxisMetadata;
        const range = '1';
        const side = 'left';
        const name = '';
        const unit = yAxisMetadata.units;

        yAxisMeta[range] = {
          range,
          side,
          name,
          unit
        };
      });

      return yAxisMeta;
    },
    getXAxisDomain(yAxisMeta) {
      let leftPaddingPerc = 0;
      let rightPaddingPerc = 100;
      let rightSide =
        yAxisMeta && Object.values(yAxisMeta).filter((axisMeta) => axisMeta.side === 'right');
      let leftSide =
        yAxisMeta && Object.values(yAxisMeta).filter((axisMeta) => axisMeta.side === 'left');
      if (yAxisMeta && rightSide.length > 1) {
        rightPaddingPerc = MULTI_AXES_X_PADDING_PERCENT.RIGHT;
      }

      if (yAxisMeta && leftSide.length > 1) {
        leftPaddingPerc = MULTI_AXES_X_PADDING_PERCENT.LEFT;
      }

      return [leftPaddingPerc / 100, rightPaddingPerc / 100];
    },
    getYaxisLayout(yAxisMeta) {
      if (!yAxisMeta) {
        // yAxisMeta is derived from the traces, so it is empty until data
        // arrives. Still apply the configured scaling, otherwise a fixed
        // range would not take effect on an empty plot.
        return this.getAxisRangeLayout('yAxis');
      }

      const { name, range, side = 'left', unit } = yAxisMeta;
      const title = `${name} ${unit ? '(' + unit + ')' : ''}`;
      const yaxis = {
        automargin: true,
        fixedrange: true,
        title,
        ...this.getAxisRangeLayout('yAxis')
      };

      if (range === '1') {
        return yaxis;
      }

      yaxis.anchor = side.toLowerCase() === 'left' ? 'free' : 'x';
      yaxis.showline = side.toLowerCase() === 'left';
      yaxis.side = side.toLowerCase();
      yaxis.overlaying = 'y';
      yaxis.position = 0.01;

      return yaxis;
    },
    registerListeners() {
      this.removeBarColorListener = this.openmct.objects.observe(
        this.domainObject,
        'configuration.barStyles',
        this.barColorChanged
      );
      this.removeAxisScalingListener = this.openmct.objects.observe(
        this.domainObject,
        `configuration.${AXIS_SCALING_KEY}`,
        this.updatePlot
      );
      this.resizeTimer = false;
      if (window.ResizeObserver) {
        this.plotResizeObserver = new ResizeObserver(() => {
          // debounce and trigger window resize so that plotly can resize the plot
          clearTimeout(this.resizeTimer);
          this.resizeTimer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 250);
        });
      }
    },
    reset() {
      this.updatePlot();

      this.isZoomed = false;
      this.$emit('subscribe');
    },
    barColorChanged() {
      const colors = [];
      const indices = [];
      this.data.forEach((item, index) => {
        const key = item.key;
        const colorExists =
          this.domainObject.configuration.barStyles.series[key] &&
          this.domainObject.configuration.barStyles.series[key].color;
        indices.push(index);
        if (colorExists) {
          colors.push(this.domainObject.configuration.barStyles.series[key].color);
        } else {
          colors.push(item.marker.color);
        }
      });
      const plotUpdate = {
        'marker.color': colors
      };
      Plotly.restyle(this.$refs.plot, plotUpdate, indices);
    },
    updateData() {
      this.updatePlot();
    },
    updateLocalControlPosition() {
      const localControl = this.$refs.localControl;
      localControl.style.display = 'none';

      const plot = this.$refs.plot;
      const bgLayer = this.$el.querySelector('.bglayer');

      const plotBoundingRect = plot.getBoundingClientRect();
      const bgLayerBoundingRect = bgLayer.getBoundingClientRect();

      const top = bgLayerBoundingRect.top - plotBoundingRect.top + 5;
      const left = bgLayerBoundingRect.left - plotBoundingRect.left + 5;

      localControl.style.top = `${top}px`;
      localControl.style.left = `${left}px`;
      localControl.style.display = 'block';
    },
    updatePlot() {
      if (!this.$refs || !this.$refs.plot) {
        return;
      }

      this.updateLogScaleWarning();
      Plotly.react(this.$refs.plot, Array.from(this.data), this.getLayout());
    },
    /**
     * Decide whether a logarithmic Y axis will silently discard values, and
     * warn the first time it will.
     *
     * Only negative values are reported. Plotly also drops values of exactly
     * zero, but a channel reading zero is ordinary and warning about it would
     * be noise. Each trace carries its own `yMin`, tracked by BarGraphView
     * while the values are assembled, so this is one comparison per trace
     * rather than a walk over every point.
     *
     * The notification is edge triggered: this runs on every telemetry update,
     * so alerting whenever the condition holds would fire continuously.
     */
    updateLogScaleWarning() {
      const previous = this.hasValuesHiddenByLogScale;

      this.hasValuesHiddenByLogScale =
        isLogModeEnabled(this.domainObject, 'yAxis') &&
        this.data.some((trace) => hasNegativeValues(trace.yMin));

      if (this.hasValuesHiddenByLogScale && !previous) {
        this.showLogScaleNotification();
      }
    },
    /**
     * Raise the log scale warning as a self-dismissing alert, so the banner
     * does not stack up with others and leave the operator clearing it by hand.
     * The chart's own indicator stays for as long as the condition holds.
     */
    showLogScaleNotification() {
      const notification = this.openmct.notifications.alert(LOG_SCALE_WARNING);

      clearTimeout(this.logScaleNotificationTimer);
      this.logScaleNotificationTimer = setTimeout(() => {
        notification.dismiss();
      }, LOG_SCALE_WARNING_DISMISS_MS);
    },
    zoom(eventData) {
      const autorange = eventData['xaxis.autorange'];
      const { autosize } = eventData;

      if (autosize || autorange) {
        this.isZoomed = false;
        this.reset();

        return;
      }

      this.isZoomed = true;
      this.$emit('unsubscribe');
    }
  }
};
</script>
