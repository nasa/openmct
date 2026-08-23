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
    <div ref="plot" class="c-scatter-chart"></div>
    <div
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

const MULTI_AXES_X_PADDING_PERCENT = {
  LEFT: 8,
  RIGHT: 94
};

import { getValidatedData } from '@/plugins/plan/util';

import {
  AXIS_SCALING_KEY,
  getAxisBoundsLayout,
  getAxisConfig,
  getLogAxisTickLayout,
  hasNonPositiveValues,
  isLogModeEnabled
} from '../axisConfig.js';

const LOG_SCALE_WARNING =
  'Points with a Y value of zero or less cannot be shown on a logarithmic Y axis and have been omitted.';

// `alert` notifications persist until dismissed - only `info` sets the model's
// autoDismiss flag, and it cannot be set through options. Matches Open MCT's
// own DEFAULT_AUTO_DISMISS_TIMEOUT.
const LOG_SCALE_WARNING_DISMISS_MS = 3000;

const PATH_COLORS = ['blue', 'red', 'green'];
const MARKER_COLOR = 'white';

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
      hasValuesHiddenByLogScale: false,
      yAxisRange: {
        min: '',
        max: ''
      },
      xAxisRange: {
        min: '',
        max: ''
      }
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
      handler() {
        this.updateData();
      },
      deep: true
    }
  },
  mounted() {
    this.getUnderlayPlotData();

    Plotly.newPlot(
      this.$refs.plot,
      Array.from(this.data.concat(this.getShapes(this.shapesData))),
      this.getLayout(),
      {
        responsive: true,
        displayModeBar: false
      }
    );
    this.registerListeners();

    this.$refs.plot.on('plotly_relayout', this.zoom);
  },
  beforeUnmount() {
    if (this.$refs.plot && this.$refs.plot.off) {
      this.$refs.plot.off('plotly_relayout', this.zoom);
    }

    if (this.plotResizeObserver) {
      this.plotResizeObserver.disconnect();
      clearTimeout(this.resizeTimer);
    }

    if (this.unlistenUnderlay) {
      this.unlistenUnderlay();
    }

    if (this.unlistenUnderlayRanges) {
      this.unlistenUnderlayRanges();
    }

    if (this.unlistenAxisScaling) {
      this.unlistenAxisScaling();
    }

    if (this.unobserveColorChanges) {
      this.unobserveColorChanges();
    }

    clearTimeout(this.logScaleNotificationTimer);

    Plotly.purge(this.$refs.plot);
  },
  methods: {
    getUnderlayPlotData() {
      if (this.domainObject.selectFile) {
        this.shapesData = getValidatedData(this.domainObject);
      } else {
        this.shapesData = [];
      }
    },
    observeForUnderlayPlotChanges() {
      this.getUnderlayPlotData();
      this.updateData();
    },
    getAxisMinMax() {
      if (!this.data.length) {
        return;
      }

      // For now, use x and y axes min, max values only if an underlay is available
      if (this.shapesData.length && this.data[0].xaxis) {
        this.xAxisRange = this.data[0].xaxis;
      }

      if (this.shapesData.length && this.data[0].yaxis) {
        this.yAxisRange = this.data[0].yaxis;
      }
    },
    /**
     * Build the range portion of an axis layout. A manually configured range
     * takes precedence; otherwise fall back to the underlay ranges
     * (`configuration.ranges`, set from the create form) so existing Scatter
     * Plots keep their current behavior.
     *
     * A range may fix either end, both, or neither - see `getAxisBoundsLayout`,
     * which also converts bounds to the log units Plotly expects on a
     * logarithmic axis.
     */
    getAxisRangeLayout(axisKey, underlayRange) {
      const axis = getAxisConfig(this.domainObject, axisKey);
      const logMode = isLogModeEnabled(this.domainObject, axisKey);
      const axisType = logMode ? { type: 'log', ...getLogAxisTickLayout() } : {};

      if (axis.autoscale === false && axis.range) {
        return { ...axisType, ...getAxisBoundsLayout(axis.range, logMode) };
      }

      if (underlayRange && underlayRange.min !== '' && underlayRange.max !== '') {
        // The underlay bounds come from the create form and may be strings.
        return {
          ...axisType,
          ...getAxisBoundsLayout(
            { min: Number(underlayRange.min), max: Number(underlayRange.max) },
            logMode
          )
        };
      }

      return { ...axisType, autorange: true };
    },
    getLayout() {
      this.getAxisMinMax();

      const yAxesMeta = this.getYAxisMeta();
      const primaryYaxis = this.getYaxisLayout(yAxesMeta['1']);
      const xAxisDomain = this.getXAxisDomain(yAxesMeta);

      const shapes = this.shapesData.map((shapeData, index) => {
        if (
          !shapeData.x ||
          !shapeData.y ||
          !shapeData.x.length ||
          !shapeData.y.length ||
          shapeData.x.length !== shapeData.y.length
        ) {
          return '';
        }

        let path = `M ${shapeData.x[0]},${shapeData.y[0]}`;
        shapeData.x.forEach((point, shapeIndex) => {
          if (shapeIndex > 0) {
            path = `${path} L${point},${shapeData.y[shapeIndex]}`;
          }
        });

        return {
          path,
          type: 'path',
          line: {
            color: PATH_COLORS[index]
          },
          opacity: 0.5
        };
      });

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
          ...this.getAxisRangeLayout('xAxis', this.xAxisRange),
          title: this.plotAxisTitle.xAxisTitle,
          automargin: true
        },
        yaxis: primaryYaxis,
        margin: {
          l: 5,
          r: 5,
          t: 5,
          b: 0
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        shapes,
        layer: 'below'
      };
    },
    getYAxisMeta() {
      const yAxisMeta = {};

      this.data.forEach((datum) => {
        const yAxisMetadata = datum.yAxisMetadata;
        const range = '1';
        const side = 'left';
        const name = yAxisMetadata.name;
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
        return this.getAxisRangeLayout('yAxis', this.yAxisRange);
      }

      const { name, range, side = 'left', unit } = yAxisMeta;
      const title = `${name} ${unit ? '(' + unit + ')' : ''}`;
      const yaxis = {
        automargin: true,
        title,
        ...this.getAxisRangeLayout('yAxis', this.yAxisRange)
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
      this.unobserveColorChanges = this.openmct.objects.observe(
        this.domainObject,
        'configuration.styles.color',
        this.updateColors
      );
      this.unlistenUnderlay = this.openmct.objects.observe(
        this.domainObject,
        'selectFile',
        this.observeForUnderlayPlotChanges
      );
      this.unlistenUnderlayRanges = this.openmct.objects.observe(
        this.domainObject,
        'configuration.ranges',
        this.updateData
      );
      this.unlistenAxisScaling = this.openmct.objects.observe(
        this.domainObject,
        `configuration.${AXIS_SCALING_KEY}`,
        this.applyAxisScaling
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
        this.plotResizeObserver.observe(this.$refs.plotWrapper);
      }
    },
    updateColors() {
      const colors = [];
      const indices = [];
      this.data.forEach((item, index) => {
        const colorExists = this.domainObject.configuration.styles.color;
        indices.push(index);
        if (colorExists) {
          colors.push(this.domainObject.configuration.styles.color);
        } else {
          colors.push(item.marker.color);
        }
      });
      const plotUpdate = {
        'marker.color': colors
      };

      Plotly.restyle(this.$refs.plot, plotUpdate, indices);
    },
    reset() {
      this.isZoomed = false;

      this.updatePlot();
      this.$emit('subscribe');
    },
    updateData() {
      // New data must not be drawn while a zoom has frozen the plot - see zoom().
      if (this.isZoomed) {
        return;
      }

      this.updatePlot();
    },
    applyAxisScaling() {
      // Changing the scale is not new data, so this redraws even while frozen.
      // It deliberately leaves isZoomed alone: the plot stays frozen and
      // unsubscribed so the trace under inspection survives the rescale.
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
      Plotly.react(
        this.$refs.plot,
        Array.from(this.data.concat(this.getShapes(this.shapesData))),
        this.getLayout()
      );
    },
    /**
     * Decide whether a logarithmic Y axis will silently discard points, and
     * warn the first time it will.
     *
     * Everything a log axis discards is reported here, zero included - unlike
     * the Bar Graph, a Scatter Plot point at zero is a real sample the operator
     * would otherwise not notice going missing. Each trace carries its own
     * `yMin`, tracked by ScatterPlotView while the values are assembled, so
     * this is one comparison per trace rather than a walk over every point.
     * Underlay shapes are not considered - they are drawing annotations rather
     * than telemetry.
     *
     * The notification is edge triggered: this runs on every telemetry update,
     * so alerting whenever the condition holds would fire continuously.
     */
    updateLogScaleWarning() {
      const previous = this.hasValuesHiddenByLogScale;

      this.hasValuesHiddenByLogScale =
        isLogModeEnabled(this.domainObject, 'yAxis') &&
        this.data.some((trace) => hasNonPositiveValues(trace.yMin));

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
    /**
     * Zooming deliberately freezes the plot: it unsubscribes, and `isZoomed`
     * then suppresses redraws from new data. Unlike a time-domain plot, where
     * telemetry accumulates, an incoming frame replaces this trace entirely -
     * so without the freeze, zooming in on a feature of interest would lose
     * that feature the moment the next frame arrived. `reset()` thaws it.
     */
    zoom(eventData) {
      const autorange = eventData['xaxis.autorange'];
      const { autosize } = eventData;

      if (autosize || autorange) {
        return;
      }

      this.isZoomed = true;
      this.$emit('unsubscribe');
    },
    getShapes() {
      let markerData = {
        x: [],
        y: []
      };
      const shapes = this.shapesData.map((shapeData, index) => {
        if (
          !shapeData.x ||
          !shapeData.y ||
          !shapeData.x.length ||
          !shapeData.y.length ||
          shapeData.x.length !== shapeData.y.length
        ) {
          return '';
        }

        let text = [];
        shapeData.x.forEach((point) => {
          text.push(`${parseFloat(point).toPrecision(2)}`);
        });

        markerData.x = markerData.x.concat(shapeData.x);
        markerData.y = markerData.y.concat(shapeData.y);

        return {
          x: shapeData.x,
          y: shapeData.y,
          mode: 'text',
          text,
          textfont: {
            family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            size: '12px',
            color: PATH_COLORS[index]
          },
          opacity: 0.5
        };
      });

      shapes.push({
        x: markerData.x,
        y: markerData.y,
        mode: 'markers',
        marker: {
          size: 6,
          color: MARKER_COLOR
        }
      });

      return shapes;
    }
  }
};
</script>
