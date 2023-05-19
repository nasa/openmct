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
    v-if="loaded"
    ref="plot"
    class="gl-plot"
    :class="{ 'js-series-data-loaded': seriesDataLoaded }"
  >
    <slot></slot>
    <div class="plot-wrapper-axis-and-display-area flex-elem grows">
      <div v-if="seriesModels.length" class="u-contents">
        <y-axis
          v-for="(yAxis, index) in yAxesIds"
          :id="yAxis.id"
          :key="`yAxis-${yAxis.id}-${index}`"
          :has-multiple-left-axes="hasMultipleLeftAxes"
          :position="yAxis.id > 2 ? 'right' : 'left'"
          :class="{ 'plot-yaxis-right': yAxis.id > 2 }"
          :tick-width="yAxis.tickWidth"
          :used-tick-width="plotFirstLeftTickWidth"
          :plot-left-tick-width="yAxis.id > 2 ? yAxis.tickWidth : plotLeftTickWidth"
          @yKeyChanged="setYAxisKey"
          @plotYTickWidth="onYTickWidthChange"
          @toggleAxisVisibility="toggleSeriesForYAxis"
        />
      </div>
      <div class="gl-plot-wrapper-display-area-and-x-axis" :style="xAxisStyle">
        <div class="gl-plot-display-area has-local-controls has-cursor-guides">
          <div class="l-state-indicators">
            <span
              class="l-state-indicators__alert-no-lad t-object-alert t-alert-unsynced icon-alert-triangle"
              title="This plot is not currently displaying the latest data. Reset pan/zoom to view latest data."
            ></span>
          </div>

          <mct-ticks
            v-show="gridLines && !options.compact"
            :axis-type="'xAxis'"
            :position="'right'"
          />

          <mct-ticks
            v-for="(yAxis, index) in yAxesIds"
            v-show="gridLines"
            :key="`yAxis-gridlines-${index}`"
            :axis-type="'yAxis'"
            :position="'bottom'"
            :axis-id="yAxis.id"
            @plotTickWidth="onYTickWidthChange"
          />

          <div
            ref="chartContainer"
            class="gl-plot-chart-wrapper"
            :class="[{ 'alt-pressed': altPressed }]"
          >
            <mct-chart
              :rectangles="rectangles"
              :highlights="highlights"
              :annotated-points="annotatedPoints"
              :annotation-selections="annotationSelections"
              :hidden-y-axis-ids="hiddenYAxisIds"
              :annotation-viewing-and-editing-allowed="annotationViewingAndEditingAllowed"
              @plotReinitializeCanvas="initCanvas"
              @chartLoaded="initialize"
            />
          </div>

          <div
            class="gl-plot__local-controls h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover"
          >
            <div v-if="!options.compact" class="c-button-set c-button-set--strip-h js-zoom">
              <button
                class="c-button icon-minus"
                title="Zoom out"
                @click="zoom('out', 0.2)"
              ></button>
              <button class="c-button icon-plus" title="Zoom in" @click="zoom('in', 0.2)"></button>
            </div>
            <div
              v-if="plotHistory.length && !options.compact"
              class="c-button-set c-button-set--strip-h js-pan"
            >
              <button
                class="c-button icon-arrow-left"
                title="Restore previous pan/zoom"
                @click="back()"
              ></button>
              <button
                class="c-button icon-reset"
                title="Reset pan/zoom"
                @click="resumeRealtimeData()"
              ></button>
            </div>
            <div
              v-if="isRealTime && !options.compact"
              class="c-button-set c-button-set--strip-h js-pause"
            >
              <button
                v-if="!isFrozen"
                class="c-button icon-pause"
                title="Pause incoming real-time data"
                @click="pause()"
              ></button>
              <button
                v-if="isFrozen"
                class="c-button icon-arrow-right pause-play is-paused"
                title="Resume displaying real-time data"
                @click="resumeRealtimeData()"
              ></button>
            </div>
            <div v-if="isTimeOutOfSync || isFrozen" class="c-button-set c-button-set--strip-h">
              <button
                class="c-button icon-clock"
                title="Synchronize Time Conductor"
                @click="showSynchronizeDialog()"
              ></button>
            </div>
            <div class="c-button-set c-button-set--strip-h">
              <button
                class="c-button icon-crosshair"
                :class="{ 'is-active': cursorGuide }"
                title="Toggle cursor guides"
                @click="toggleCursorGuide"
              ></button>
              <button
                class="c-button"
                :class="{ 'icon-grid-on': gridLines, 'icon-grid-off': !gridLines }"
                title="Toggle grid lines"
                @click="toggleGridLines"
              ></button>
            </div>
          </div>

          <!--Cursor guides-->
          <div
            v-show="cursorGuide"
            ref="cursorGuideVertical"
            class="c-cursor-guide--v js-cursor-guide--v"
          ></div>
          <div
            v-show="cursorGuide"
            ref="cursorGuideHorizontal"
            class="c-cursor-guide--h js-cursor-guide--h"
          ></div>
        </div>
        <x-axis
          v-if="seriesModels.length > 0 && !options.compact"
          :series-model="seriesModels[0]"
        />
      </div>
    </div>
  </div>
</template>

<script>
import eventHelpers from './lib/eventHelpers';
import LinearScale from './LinearScale';
import PlotConfigurationModel from './configuration/PlotConfigurationModel';
import configStore from './configuration/ConfigStore';

import MctTicks from './MctTicks.vue';
import MctChart from './chart/MctChart.vue';
import XAxis from './axis/XAxis.vue';
import YAxis from './axis/YAxis.vue';
import KDBush from 'kdbush';
import _ from 'lodash';

const OFFSET_THRESHOLD = 10;
const AXES_PADDING = 20;

export default {
  components: {
    XAxis,
    YAxis,
    MctTicks,
    MctChart
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
    },
    initGridLines: {
      type: Boolean,
      default() {
        return true;
      }
    },
    initCursorGuide: {
      type: Boolean,
      default() {
        return false;
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
    limitLineLabels: {
      type: Object,
      default() {
        return {};
      }
    },
    colorPalette: {
      type: Object,
      default() {
        return undefined;
      }
    }
  },
  data() {
    return {
      altPressed: false,
      highlights: [],
      annotatedPoints: [],
      annotationSelections: [],
      lockHighlightPoint: false,
      yKeyOptions: [],
      yAxisLabel: '',
      rectangles: [],
      plotHistory: [],
      selectedXKeyOption: {},
      xKeyOptions: [],
      seriesModels: [],
      legend: {},
      pending: 0,
      isRealTime: this.openmct.time.clock() !== undefined,
      loaded: false,
      isTimeOutOfSync: false,
      isFrozenOnMouseDown: false,
      cursorGuide: this.initCursorGuide,
      gridLines: this.initGridLines,
      yAxes: [],
      hiddenYAxisIds: [],
      yAxisListWithRange: []
    };
  },
  computed: {
    xAxisStyle() {
      const rightAxis = this.yAxesIds.find((yAxis) => yAxis.id > 2);
      const leftOffset = this.hasMultipleLeftAxes ? 2 * AXES_PADDING : AXES_PADDING;
      let style = {
        left: `${this.plotLeftTickWidth + leftOffset}px`
      };
      const parentRightAxisWidth = this.parentYTickWidth.rightTickWidth;

      if (parentRightAxisWidth || rightAxis) {
        style.right = `${(parentRightAxisWidth || rightAxis.tickWidth) + AXES_PADDING}px`;
      }

      return style;
    },
    yAxesIds() {
      return this.yAxes.filter((yAxis) => yAxis.seriesCount > 0);
    },
    hasMultipleLeftAxes() {
      return (
        this.parentYTickWidth.hasMultipleLeftAxes ||
        this.yAxes.filter((yAxis) => yAxis.seriesCount > 0 && yAxis.id <= 2).length > 1
      );
    },
    isNestedWithinAStackedPlot() {
      const isNavigatedObject = this.openmct.router.isNavigatedObject(
        [this.domainObject].concat(this.path)
      );

      return (
        !isNavigatedObject &&
        this.path.find((pathObject, pathObjIndex) => pathObject.type === 'telemetry.plot.stacked')
      );
    },
    isFrozen() {
      return this.config.xAxis.get('frozen') === true && this.config.yAxis.get('frozen') === true;
    },
    annotationViewingAndEditingAllowed() {
      // only allow annotations viewing/editing if plot is paused or in fixed time mode
      return this.isFrozen || !this.isRealTime;
    },
    plotFirstLeftTickWidth() {
      const firstYAxis = this.yAxes.find((yAxis) => yAxis.id === 1);

      return firstYAxis ? firstYAxis.tickWidth : 0;
    },
    plotLeftTickWidth() {
      let leftTickWidth = 0;
      this.yAxes.forEach((yAxis) => {
        if (yAxis.id > 2) {
          return;
        }

        leftTickWidth = leftTickWidth + yAxis.tickWidth;
      });
      const parentLeftTickWidth = this.parentYTickWidth.leftTickWidth;

      return parentLeftTickWidth || leftTickWidth;
    },
    seriesDataLoaded() {
      return this.pending === 0 && this.loaded;
    }
  },
  watch: {
    initGridLines(newGridLines) {
      this.gridLines = newGridLines;
    },
    initCursorGuide(newCursorGuide) {
      this.cursorGuide = newCursorGuide;
    }
  },
  mounted() {
    this.yAxisIdVisibility = {};
    this.offsetWidth = 0;

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    eventHelpers.extend(this);
    this.updateRealTime = this.updateRealTime.bind(this);
    this.updateDisplayBounds = this.updateDisplayBounds.bind(this);
    this.setTimeContext = this.setTimeContext.bind(this);

    this.config = this.getConfig();
    this.legend = this.config.legend;
    this.yAxes = [
      {
        id: this.config.yAxis.id,
        seriesCount: 0,
        tickWidth: 0
      }
    ];
    if (this.config.additionalYAxes) {
      this.yAxes = this.yAxes.concat(
        this.config.additionalYAxes.map((yAxis) => {
          return {
            id: yAxis.id,
            seriesCount: 0,
            tickWidth: 0
          };
        })
      );
    }

    this.$emit('configLoaded', true);

    this.listenTo(this.config.series, 'add', this.addSeries, this);
    this.listenTo(this.config.series, 'remove', this.removeSeries, this);

    this.config.series.models.forEach(this.addSeries, this);

    this.filterObserver = this.openmct.objects.observe(
      this.domainObject,
      'configuration.filters',
      this.updateFiltersAndResubscribe
    );
    this.removeStatusListener = this.openmct.status.observe(
      this.domainObject.identifier,
      this.updateStatus
    );

    this.openmct.objectViews.on('clearData', this.clearData);
    this.$on('loadingComplete', this.loadAnnotations);
    this.openmct.selection.on('change', this.updateSelection);
    this.setTimeContext();

    this.yAxisListWithRange = [this.config.yAxis, ...this.config.additionalYAxes];

    this.loaded = true;
  },
  beforeDestroy() {
    this.openmct.selection.off('change', this.updateSelection);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.body.removeEventListener('click', this.cancelSelection);
    this.destroy();
  },
  methods: {
    async updateSelection(selection) {
      const selectionContext = selection?.[0]?.[0]?.context?.item;
      // on clicking on a search result we highlight the annotation and zoom - we know it's an annotation result when isAnnotationSearchResult === true
      // We shouldn't zoom when we're selecting existing annotations to view them or creating new annotations.
      const selectionType = selection?.[0]?.[0]?.context?.type;
      const validSelectionTypes = ['clicked-on-plot-selection', 'plot-annotation-search-result'];
      const isAnnotationSearchResult = selectionType === 'plot-annotation-search-result';

      if (!validSelectionTypes.includes(selectionType)) {
        // wrong type of selection
        return;
      }

      if (
        selectionContext &&
        !isAnnotationSearchResult &&
        this.openmct.objects.areIdsEqual(selectionContext.identifier, this.domainObject.identifier)
      ) {
        return;
      }

      await this.waitForAxesToLoad();
      const selectedAnnotations = selection?.[0]?.[0]?.context?.annotations;
      //This section is only for the annotations search results entry to displaying annotations
      if (isAnnotationSearchResult) {
        this.showAnnotationsFromSearchResults(selectedAnnotations);
      }

      //This section is common to all entry points for annotation display
      this.prepareExistingAnnotationSelection(selectedAnnotations);
    },
    cancelSelection(event) {
      if (this.$refs?.plot) {
        const clickedInsidePlot = this.$refs.plot.contains(event.target);
        const clickedInsideInspector = event.target.closest('.js-inspector') !== null;
        const clickedOption = event.target.closest('.js-autocomplete-options') !== null;
        if (!clickedInsidePlot && !clickedInsideInspector && !clickedOption) {
          this.rectangles = [];
          this.annotationSelections = [];
          this.selectPlot();
          document.body.removeEventListener('click', this.cancelSelection);
        }
      }
    },
    waitForAxesToLoad() {
      return new Promise((resolve) => {
        // When there is no plot data, the ranges can be undefined
        // in which case we should not perform selection.
        const currentXaxis = this.config.xAxis.get('displayRange');
        const currentYaxis = this.config.yAxis.get('displayRange');
        if (!currentXaxis || !currentYaxis) {
          this.$once('loadingComplete', () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    },
    showAnnotationsFromSearchResults(selectedAnnotations) {
      if (selectedAnnotations?.length) {
        // pause the plot if we haven't already so we can actually display
        // the annotations
        this.freeze();
        // just use first annotation
        const boundingBoxes = Object.values(selectedAnnotations[0].targets);
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        boundingBoxes.forEach((boundingBox) => {
          if (boundingBox.minX < minX) {
            minX = boundingBox.minX;
          }

          if (boundingBox.maxX > maxX) {
            maxX = boundingBox.maxX;
          }

          if (boundingBox.maxY > maxY) {
            maxY = boundingBox.maxY;
          }

          if (boundingBox.minY < minY) {
            minY = boundingBox.minY;
          }
        });

        this.config.xAxis.set('displayRange', {
          min: minX,
          max: maxX
        });
        this.config.yAxis.set('displayRange', {
          min: minY,
          max: maxY
        });
        //Zoom out just a touch so that the highlighted section for annotations doesn't take over the whole view - which is not a nice look.
        this.zoom('out', 0.2);
      }
    },
    handleKeyDown(event) {
      if (event.key === 'Alt') {
        this.altPressed = true;
      }
    },
    handleKeyUp(event) {
      if (event.key === 'Alt') {
        this.altPressed = false;
      }
    },
    setTimeContext() {
      this.stopFollowingTimeContext();

      this.timeContext = this.openmct.time.getContextForView(this.path);
      this.followTimeContext();
    },
    followTimeContext() {
      this.updateDisplayBounds(this.timeContext.bounds());
      this.timeContext.on('clock', this.updateRealTime);
      this.timeContext.on('bounds', this.updateDisplayBounds);
      this.synchronized(true);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('clock', this.updateRealTime);
        this.timeContext.off('bounds', this.updateDisplayBounds);
      }
    },
    getConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
      let config = configStore.get(configId);
      if (!config) {
        config = new PlotConfigurationModel({
          id: configId,
          domainObject: this.domainObject,
          openmct: this.openmct,
          palette: this.colorPalette,
          callback: (data) => {
            this.data = data;
          }
        });
        configStore.add(configId, config);
      }

      return config;
    },
    addSeries(series, index) {
      const yAxisId = series.get('yAxisId');
      this.updateAxisUsageCount(yAxisId, 1);
      this.$set(this.seriesModels, index, series);
      this.listenTo(
        series,
        'change:xKey',
        (xKey) => {
          this.setDisplayRange(series, xKey);
        },
        this
      );
      this.listenTo(
        series,
        'change:yKey',
        () => {
          this.loadSeriesData(series);
        },
        this
      );

      this.listenTo(
        series,
        'change:interpolate',
        () => {
          this.loadSeriesData(series);
        },
        this
      );
      this.listenTo(series, 'change:yAxisId', this.updateTicksAndSeriesForYAxis, this);

      this.loadSeriesData(series);
    },

    removeSeries(plotSeries, index) {
      const yAxisId = plotSeries.get('yAxisId');
      this.updateAxisUsageCount(yAxisId, -1);
      this.seriesModels.splice(index, 1);
      this.stopListening(plotSeries);
    },

    updateTicksAndSeriesForYAxis(newAxisId, oldAxisId) {
      this.updateAxisUsageCount(oldAxisId, -1);
      this.updateAxisUsageCount(newAxisId, 1);

      const foundYAxis = this.yAxes.find((yAxis) => yAxis.id === oldAxisId);
      if (foundYAxis.seriesCount === 0) {
        this.onYTickWidthChange({
          width: foundYAxis.tickWidth,
          yAxisId: foundYAxis.id
        });
      }
    },

    updateAxisUsageCount(yAxisId, updateCountBy) {
      const foundYAxis = this.yAxes.find((yAxis) => yAxis.id === yAxisId);
      if (foundYAxis) {
        foundYAxis.seriesCount = foundYAxis.seriesCount + updateCountBy;
      }
    },
    async loadAnnotations() {
      if (!this.openmct.annotation.getAvailableTags().length) {
        // don't bother loading annotations if there are no tags
        return;
      }

      const rawAnnotationsForPlot = [];
      await Promise.all(
        this.seriesModels.map(async (seriesModel) => {
          const seriesAnnotations = await this.openmct.annotation.getAnnotations(
            seriesModel.model.identifier
          );
          rawAnnotationsForPlot.push(...seriesAnnotations);
        })
      );
      if (rawAnnotationsForPlot) {
        this.annotatedPoints = this.findAnnotationPoints(rawAnnotationsForPlot);
      }
    },
    loadSeriesData(series) {
      //this check ensures that duplicate requests don't happen on load
      if (!this.timeContext) {
        return;
      }

      if (this.$parent.$refs.plotWrapper.offsetWidth === 0) {
        this.scheduleLoad(series);

        return;
      }

      this.offsetWidth = this.$parent.$refs.plotWrapper.offsetWidth;

      this.startLoading();
      const bounds = this.timeContext.bounds();
      const options = {
        size: this.$parent.$refs.plotWrapper.offsetWidth,
        domain: this.config.xAxis.get('key'),
        start: bounds.start,
        end: bounds.end
      };

      series.load(options).then(this.stopLoading.bind(this));
    },

    loadMoreData(range, purge) {
      this.config.series.forEach((plotSeries) => {
        this.offsetWidth = this.$parent.$refs.plotWrapper.offsetWidth;
        this.startLoading();
        plotSeries
          .load({
            size: this.offsetWidth,
            start: range.min,
            end: range.max,
            domain: this.config.xAxis.get('key')
          })
          .then(this.stopLoading.bind(this));
        if (purge) {
          plotSeries.purgeRecordsOutsideRange(range);
        }
      });
    },

    scheduleLoad(series) {
      if (!this.scheduledLoads) {
        this.startLoading();
        this.scheduledLoads = [];
        this.checkForSize = setInterval(
          function () {
            if (this.$parent.$refs.plotWrapper.offsetWidth === 0) {
              return;
            }

            this.stopLoading();
            this.scheduledLoads.forEach(this.loadSeriesData, this);
            delete this.scheduledLoads;
            clearInterval(this.checkForSize);
            delete this.checkForSize;
          }.bind(this)
        );
      }

      if (this.scheduledLoads.indexOf(series) === -1) {
        this.scheduledLoads.push(series);
      }
    },

    startLoading() {
      this.pending += 1;
      this.updateLoading();
    },

    stopLoading() {
      this.pending -= 1;
      this.updateLoading();
      if (this.pending === 0) {
        this.$emit('loadingComplete');
      }
    },

    updateLoading() {
      this.$emit('loadingUpdated', this.pending > 0);
    },

    updateFiltersAndResubscribe(updatedFilters) {
      this.config.series.forEach(function (series) {
        series.updateFiltersAndRefresh(updatedFilters[series.keyString]);
      });
    },

    clearSeries() {
      this.config.series.forEach(function (series) {
        series.reset();
      });
    },
    shareCommonParent(domainObjectToFind) {
      return false;
    },
    compositionPathContainsId(domainObjectToFind) {
      if (!domainObjectToFind.composition) {
        return false;
      }

      return domainObjectToFind.composition.some((compositionIdentifier) => {
        return this.openmct.objects.areIdsEqual(
          compositionIdentifier,
          this.domainObject.identifier
        );
      });
    },

    clearData(domainObjectToClear) {
      // If we don't have an object to clear (global), or the IDs are equal, just clear the data.
      // If we have an object to clear, but the IDs don't match, we need to check the composition
      // of the object we've been asked to clear to see if it contains the id we're looking for.
      // This happens with stacked plots for example.
      // If we find the ID, clear the plot.
      if (
        !domainObjectToClear ||
        this.openmct.objects.areIdsEqual(
          domainObjectToClear.identifier,
          this.domainObject.identifier
        ) ||
        this.compositionPathContainsId(domainObjectToClear)
      ) {
        this.clearSeries();
      }
    },

    setDisplayRange(series, xKey) {
      if (this.config.series.models.length !== 1) {
        return;
      }

      const displayRange = series.getDisplayRange(xKey);
      this.config.xAxis.set('range', displayRange);
    },
    updateRealTime(clock) {
      this.isRealTime = clock !== undefined;
    },

    /**
     * Track latest display bounds.  Forces update when not receiving ticks.
     */
    updateDisplayBounds(bounds, isTick) {
      const newRange = {
        min: bounds.start,
        max: bounds.end
      };
      this.config.xAxis.set('range', newRange);
      if (!isTick) {
        this.clearPanZoomHistory();
        this.synchronizeIfBoundsMatch();
        this.loadMoreData(newRange, true);
      } else {
        // If we're not panning or zooming (time conductor and plot x-axis times are not out of sync)
        // Drop any data that is more than 1x (max-min) before min.
        // Limit these purges to once a second.
        const isPanningOrZooming = this.isTimeOutOfSync;
        const purgeRecords =
          !isPanningOrZooming && (!this.nextPurge || this.nextPurge < Date.now());
        if (purgeRecords) {
          const keepRange = {
            min: newRange.min - (newRange.max - newRange.min),
            max: newRange.max
          };
          this.config.series.forEach(function (series) {
            series.purgeRecordsOutsideRange(keepRange);
          });
          this.nextPurge = Date.now() + 1000;
        }
      }
    },

    /**
     * Handle end of user viewport change: load more data for current display
     * bounds, and mark view as synchronized if necessary.
     */
    userViewportChangeEnd() {
      this.synchronizeIfBoundsMatch();
      const xDisplayRange = this.config.xAxis.get('displayRange');
      this.loadMoreData(xDisplayRange);
    },

    /**
     * mark view as synchronized if bounds match configured bounds.
     */
    synchronizeIfBoundsMatch() {
      const xDisplayRange = this.config.xAxis.get('displayRange');
      const xRange = this.config.xAxis.get('range');
      this.synchronized(xRange.min === xDisplayRange.min && xRange.max === xDisplayRange.max);
    },

    /**
     * Getter/setter for "synchronized" value.  If not synchronized and
     * time conductor is in clock mode, will mark objects as unsynced so that
     * displays can update accordingly.
     */
    synchronized(value) {
      const isLocalClock = this.timeContext.clock();

      if (typeof value !== 'undefined') {
        this._synchronized = value;
        this.isTimeOutOfSync = value !== true;

        const isUnsynced = isLocalClock && !value;
        this.setStatus(isUnsynced);
      }

      return this._synchronized;
    },

    setStatus(isNotInSync) {
      const outOfSync =
        isNotInSync === true || this.isTimeOutOfSync === true || this.isFrozen === true;
      if (outOfSync === true) {
        this.openmct.status.set(this.domainObject.identifier, 'timeconductor-unsynced');
      } else {
        this.openmct.status.set(this.domainObject.identifier, '');
      }
    },

    initCanvas() {
      if (this.canvas) {
        this.stopListening(this.canvas);
      }

      this.canvas = this.$refs.chartContainer.querySelectorAll('canvas')[1];

      if (!this.options.compact) {
        this.listenTo(this.canvas, 'mousemove', this.trackMousePosition, this);
        this.listenTo(this.canvas, 'mouseleave', this.untrackMousePosition, this);
        this.listenTo(this.canvas, 'mousedown', this.onMouseDown, this);
        this.listenTo(this.canvas, 'click', this.selectNearbyAnnotations, this);
        this.listenTo(this.canvas, 'wheel', this.wheelZoom, this);
      }
    },

    marqueeAnnotations(annotationsToSelect) {
      annotationsToSelect.forEach((annotationToSelect) => {
        Object.keys(annotationToSelect.targets).forEach((targetKeyString) => {
          const target = annotationToSelect.targets[targetKeyString];
          const series = this.seriesModels.find(
            (seriesModel) => seriesModel.keyString === targetKeyString
          );
          if (!series) {
            return;
          }

          const yAxisId = series.get('yAxisId');
          const rectangle = {
            start: {
              x: target.minX,
              y: [target.minY],
              yAxisIds: [yAxisId]
            },
            end: {
              x: target.maxX,
              y: [target.maxY],
              yAxisIds: [yAxisId]
            },
            color: [1, 1, 1, 0.1]
          };
          this.rectangles.push(rectangle);
        });
      });
    },
    gatherNearbyAnnotations() {
      const nearbyAnnotations = [];
      this.config.series.models.forEach((series) => {
        if (series?.closest?.annotationsById) {
          Object.values(series.closest.annotationsById).forEach((closeAnnotation) => {
            const addedAnnotationAlready = nearbyAnnotations.some((annotation) => {
              return (
                _.isEqual(annotation.targets, closeAnnotation.targets) &&
                _.isEqual(annotation.tags, closeAnnotation.tags)
              );
            });
            if (!addedAnnotationAlready) {
              nearbyAnnotations.push(closeAnnotation);
            }
          });
        }
      });

      return nearbyAnnotations;
    },

    prepareExistingAnnotationSelection(annotations) {
      const targetDomainObjects = {};
      this.config.series.models.forEach((series) => {
        targetDomainObjects[series.keyString] = series.domainObject;
      });

      const targetDetails = {};
      const uniqueBoundsAnnotations = [];
      annotations.forEach((annotation) => {
        Object.entries(annotation.targets).forEach(([key, value]) => {
          targetDetails[key] = value;
        });

        const boundingBoxAlreadyAdded = uniqueBoundsAnnotations.some((existingAnnotation) => {
          const existingBoundingBox = Object.values(existingAnnotation.targets)[0];
          const newBoundingBox = Object.values(annotation.targets)[0];

          return (
            existingBoundingBox.minX === newBoundingBox.minX &&
            existingBoundingBox.minY === newBoundingBox.minY &&
            existingBoundingBox.maxX === newBoundingBox.maxX &&
            existingBoundingBox.maxY === newBoundingBox.maxY
          );
        });
        if (!boundingBoxAlreadyAdded) {
          uniqueBoundsAnnotations.push(annotation);
        }
      });
      this.marqueeAnnotations(uniqueBoundsAnnotations);

      return {
        targetDomainObjects,
        targetDetails
      };
    },
    initialize() {
      this.handleWindowResize = _.debounce(this.handleWindowResize, 500);
      this.plotContainerResizeObserver = new ResizeObserver(this.handleWindowResize);
      this.plotContainerResizeObserver.observe(this.$parent.$refs.plotWrapper);

      // Setup canvas etc.
      this.xScale = new LinearScale(this.config.xAxis.get('displayRange'));
      this.yScale = [];
      this.yAxisListWithRange.forEach((yAxis) => {
        this.yScale.push({
          id: yAxis.id,
          scale: new LinearScale(yAxis.get('displayRange'))
        });
      });

      this.pan = undefined;
      this.marquee = undefined;

      this.chartElementBounds = undefined;
      this.tickUpdate = false;

      this.initCanvas();

      this.config.yAxisLabel = this.config.yAxis.get('label');

      this.cursorGuideVertical = this.$refs.cursorGuideVertical;
      this.cursorGuideHorizontal = this.$refs.cursorGuideHorizontal;

      this.listenTo(this.config.xAxis, 'change:displayRange', this.onXAxisChange, this);
      this.yAxisListWithRange.forEach((yAxis) => {
        this.listenTo(yAxis, 'change:displayRange', this.onYAxisChange.bind(this, yAxis.id), this);
      });
    },

    onXAxisChange(displayBounds) {
      if (displayBounds) {
        this.xScale.domain(displayBounds);
      }
    },

    onYAxisChange(yAxisId, displayBounds) {
      if (displayBounds) {
        this.yScale
          .filter((yAxis) => yAxis.id === yAxisId)
          .forEach((yAxis) => {
            yAxis.scale.domain(displayBounds);
          });
      }
    },

    /**
     * Aggregate widths of all left and right y axes and send them up to any parent plots
     * @param {Object} tickWidthWithYAxisId - the width and yAxisId of the tick bar
     * @param fromDifferentObject
     */
    onYTickWidthChange(tickWidthWithYAxisId, fromDifferentObject) {
      const { width, yAxisId } = tickWidthWithYAxisId;
      if (yAxisId) {
        const index = this.yAxes.findIndex((yAxis) => yAxis.id === yAxisId);
        if (fromDifferentObject) {
          // Always accept tick width if it comes from a different object.
          this.yAxes[index].tickWidth = width;
        } else {
          // Otherwise, only accept tick with if it's larger.
          const newWidth = Math.max(width, this.yAxes[index].tickWidth);
          if (width !== this.yAxes[index].tickWidth) {
            this.yAxes[index].tickWidth = newWidth;
          }
        }

        const id = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        const leftTickWidth = this.yAxes
          .filter((yAxis) => yAxis.id < 3)
          .reduce((previous, current) => {
            return previous + current.tickWidth;
          }, 0);
        const rightTickWidth = this.yAxes
          .filter((yAxis) => yAxis.id > 2)
          .reduce((previous, current) => {
            return previous + current.tickWidth;
          }, 0);
        this.$emit(
          'plotYTickWidth',
          {
            hasMultipleLeftAxes: this.hasMultipleLeftAxes,
            leftTickWidth,
            rightTickWidth
          },
          id
        );
      }
    },

    toggleSeriesForYAxis({ id, visible }) {
      //if toggling to visible, re-fetch the data for the series that are part of this y Axis
      if (visible === true) {
        this.config.series.models
          .filter((model) => model.get('yAxisId') === id)
          .forEach(this.loadSeriesData, this);
      }

      this.yAxisIdVisibility[id] = visible;
      this.hiddenYAxisIds = Object.keys(this.yAxisIdVisibility)
        .map(Number)
        .filter((key) => {
          return this.yAxisIdVisibility[key] === false;
        });
    },

    trackMousePosition(event) {
      this.trackChartElementBounds(event);
      this.xScale.range({
        min: 0,
        max: this.chartElementBounds.width
      });
      this.yScale.forEach((yAxis) => {
        yAxis.scale.range({
          min: 0,
          max: this.chartElementBounds.height
        });
      });

      this.positionOverElement = {
        x: event.clientX - this.chartElementBounds.left,
        y: this.chartElementBounds.height - (event.clientY - this.chartElementBounds.top)
      };

      const yLocationForPositionOverPlot = this.yScale.map((yAxis) =>
        yAxis.scale.invert(this.positionOverElement.y)
      );
      const yAxisIds = this.yScale.map((yAxis) => yAxis.id);
      // Also store the order of yAxisIds so that we can associate the y location to the yAxis
      this.positionOverPlot = {
        x: this.xScale.invert(this.positionOverElement.x),
        y: yLocationForPositionOverPlot,
        yAxisIds
      };

      if (this.cursorGuide) {
        this.updateCrosshairs(event);
      }

      this.highlightValues(this.positionOverPlot.x);
      this.updateMarquee();
      this.updatePan();
      event.preventDefault();
    },

    getYPositionForYAxis(object, yAxis) {
      const index = object.yAxisIds.findIndex((yAxisId) => yAxisId === yAxis.get('id'));

      return object.y[index];
    },

    updateCrosshairs(event) {
      this.cursorGuideVertical.style.left = event.clientX - this.chartElementBounds.x + 'px';
      this.cursorGuideHorizontal.style.top = event.clientY - this.chartElementBounds.y + 'px';
    },

    trackChartElementBounds(event) {
      if (event.target === this.canvas) {
        this.chartElementBounds = event.target.getBoundingClientRect();
      }
    },

    onPlotHighlightSet($e, point) {
      if (point === this.highlightPoint) {
        return;
      }

      this.highlightValues(point);
    },

    highlightValues(point) {
      this.highlightPoint = point;
      if (this.lockHighlightPoint) {
        return;
      }

      if (!point) {
        this.highlights = [];
        this.config.series.models.forEach((series) => delete series.closest);
      } else {
        this.highlights = this.config.series.models
          .filter((series) => series.getSeriesData().length > 0)
          .map((series) => {
            series.closest = series.nearestPoint(point);

            return {
              series: series,
              point: series.closest
            };
          });
      }

      this.$emit('highlights', this.highlights);
    },

    untrackMousePosition() {
      this.positionOverElement = undefined;
      this.positionOverPlot = undefined;
      this.highlightValues();
    },

    onMouseDown(event) {
      // do not monitor drag events on browser context click
      if (event.ctrlKey) {
        return;
      }

      this.listenTo(window, 'mouseup', this.onMouseUp, this);
      this.listenTo(window, 'mousemove', this.trackMousePosition, this);

      // track frozen state on mouseDown to be read on mouseUp
      const isFrozen =
        this.config.xAxis.get('frozen') === true && this.config.yAxis.get('frozen') === true;
      this.isFrozenOnMouseDown = isFrozen;

      if (event.altKey && !event.shiftKey) {
        return this.startPan(event);
      } else if (event.altKey && event.shiftKey) {
        this.freeze();

        return this.startMarquee(event, true);
      } else {
        return this.startMarquee(event, false);
      }
    },

    onMouseUp(event) {
      this.stopListening(window, 'mouseup', this.onMouseUp, this);
      this.stopListening(window, 'mousemove', this.trackMousePosition, this);

      if (this.isMouseClick() && event.shiftKey) {
        this.lockHighlightPoint = !this.lockHighlightPoint;
        this.$emit('lockHighlightPoint', this.lockHighlightPoint);
      }

      if (this.pan) {
        return this.endPan(event);
      }

      if (this.marquee) {
        this.endMarquee(event);
      }

      // resume the plot if no pan, zoom, or drag action is taken
      // needs to follow endMarquee so that plotHistory is pruned
      const isAction = Boolean(this.plotHistory.length);
      if (!isAction && !this.isFrozenOnMouseDown) {
        this.clearPanZoomHistory();
        this.synchronizeIfBoundsMatch();
      }
    },

    isMouseClick() {
      if (!this.marquee) {
        return false;
      }

      const { start, end } = this.marquee;
      const someYPositionOverPlot = start.y.some((y) => y);

      return start.x === end.x && someYPositionOverPlot;
    },

    updateMarquee() {
      if (!this.marquee) {
        return;
      }

      this.marquee.end = this.positionOverPlot;
      this.marquee.endPixels = this.positionOverElement;
    },

    startMarquee(event, annotationEvent) {
      this.rectangles = [];
      this.annotationSelections = [];
      this.canvas.classList.remove('plot-drag');
      this.canvas.classList.add('plot-marquee');

      this.trackMousePosition(event);
      if (this.positionOverPlot) {
        this.freeze();
        this.marquee = {
          startPixels: this.positionOverElement,
          endPixels: this.positionOverElement,
          start: this.positionOverPlot,
          end: this.positionOverPlot,
          color: [1, 1, 1, 0.25]
        };
        if (annotationEvent) {
          this.marquee.annotationEvent = true;
        }

        this.rectangles.push(this.marquee);
        this.trackHistory();
      }
    },
    selectNearbyAnnotations(event) {
      // need to stop propagation right away to prevent selecting the plot itself
      event.stopPropagation();

      const nearbyAnnotations = this.gatherNearbyAnnotations();

      if (this.annotationViewingAndEditingAllowed && this.annotationSelections.length) {
        //no annotations were found, but we are adding some now
        return;
      }

      if (this.annotationViewingAndEditingAllowed && nearbyAnnotations.length) {
        //show annotations if some were found
        const { targetDomainObjects, targetDetails } =
          this.prepareExistingAnnotationSelection(nearbyAnnotations);
        this.selectPlotAnnotations({
          targetDetails,
          targetDomainObjects,
          annotations: nearbyAnnotations
        });

        return;
      }

      //Fall through to here if either there is no new selection add tags or no existing annotations were retrieved
      this.selectPlot();
    },
    selectPlot() {
      // should show plot itself if we didn't find any annotations
      const selection = this.createPathSelection();
      this.openmct.selection.select(selection, true);
    },
    createPathSelection() {
      let selection = [];
      selection.unshift({
        element: this.$el,
        context: {
          item: this.domainObject
        }
      });
      this.path.forEach((pathObject, index) => {
        selection.push({
          element: this.openmct.layout.$refs.browseObject.$el,
          context: {
            item: pathObject
          }
        });
      });

      return selection;
    },
    selectPlotAnnotations({ targetDetails, targetDomainObjects, annotations }) {
      const annotationContext = {
        type: 'clicked-on-plot-selection',
        targetDetails,
        targetDomainObjects,
        annotations,
        annotationType: this.openmct.annotation.ANNOTATION_TYPES.PLOT_SPATIAL,
        onAnnotationChange: this.onAnnotationChange
      };
      const selection = this.createPathSelection();
      if (
        selection.length &&
        this.openmct.objects.areIdsEqual(
          selection[0].context.item.identifier,
          this.domainObject.identifier
        )
      ) {
        selection[0].context = {
          ...selection[0].context,
          ...annotationContext
        };
      } else {
        selection.unshift({
          element: this.$el,
          context: {
            item: this.domainObject,
            ...annotationContext
          }
        });
      }

      this.openmct.selection.select(selection, true);

      document.body.addEventListener('click', this.cancelSelection);
    },
    selectNewPlotAnnotations(boundingBoxPerYAxis, pointsInBox, event) {
      let targetDomainObjects = {};
      let targetDetails = {};
      let annotations = [];
      pointsInBox.forEach((pointInBox) => {
        if (pointInBox.length) {
          const seriesID = pointInBox[0].series.keyString;
          const boundingBoxWithId = boundingBoxPerYAxis.find(
            (box) => box.id === pointInBox[0].series.get('yAxisId')
          );
          targetDetails[seriesID] = boundingBoxWithId?.boundingBox;

          targetDomainObjects[seriesID] = pointInBox[0].series.domainObject;
        }
      });
      this.selectPlotAnnotations({
        targetDetails,
        targetDomainObjects,
        annotations
      });
    },
    findAnnotationPoints(rawAnnotations) {
      const annotationsByPoints = [];
      rawAnnotations.forEach((rawAnnotation) => {
        if (rawAnnotation.targets) {
          const targetValues = Object.values(rawAnnotation.targets);
          const targetKeys = Object.keys(rawAnnotation.targets);
          if (targetValues && targetValues.length) {
            let boundingBoxPerYAxis = [];
            targetValues.forEach((boundingBox, index) => {
              const seriesId = targetKeys[index];
              const series = this.seriesModels.find(
                (seriesModel) => seriesModel.keyString === seriesId
              );
              if (!series) {
                return;
              }

              boundingBoxPerYAxis.push({
                id: series.get('yAxisId'),
                boundingBox
              });
            });

            const pointsInBox = this.getPointsInBox(boundingBoxPerYAxis, rawAnnotation);
            if (pointsInBox && pointsInBox.length) {
              annotationsByPoints.push(pointsInBox.flat());
            }
          }
        }
      });

      return annotationsByPoints.flat();
    },
    getPointsInBox(boundingBoxPerYAxis, rawAnnotation) {
      // load series models in KD-Trees
      const seriesKDTrees = [];
      this.seriesModels.forEach((seriesModel) => {
        const boundingBoxWithId = boundingBoxPerYAxis.find(
          (box) => box.id === seriesModel.get('yAxisId')
        );
        const boundingBox = boundingBoxWithId?.boundingBox;
        //Series was probably added after the last annotations were saved
        if (!boundingBox) {
          return;
        }

        const seriesData = seriesModel.getSeriesData();
        if (seriesData && seriesData.length) {
          const kdTree = new KDBush(
            seriesData,
            (point) => {
              return seriesModel.getXVal(point);
            },
            (point) => {
              return seriesModel.getYVal(point);
            }
          );
          const searchResults = [];
          const rangeResults = kdTree.range(
            boundingBox.minX,
            boundingBox.minY,
            boundingBox.maxX,
            boundingBox.maxY
          );
          rangeResults.forEach((id) => {
            const seriesDatum = seriesData[id];
            if (seriesDatum) {
              const result = {
                series: seriesModel,
                point: seriesDatum
              };
              searchResults.push(result);
            }

            if (rawAnnotation) {
              if (!seriesDatum.annotationsById) {
                seriesDatum.annotationsById = {};
              }

              const annotationKeyString = this.openmct.objects.makeKeyString(
                rawAnnotation.identifier
              );
              seriesDatum.annotationsById[annotationKeyString] = rawAnnotation;
            }
          });
          if (searchResults.length) {
            seriesKDTrees.push(searchResults);
          }
        }
      });

      return seriesKDTrees;
    },
    endAnnotationMarquee(event) {
      const boundingBoxPerYAxis = [];
      this.yAxisListWithRange.forEach((yAxis, yIndex) => {
        const minX = Math.min(this.marquee.start.x, this.marquee.end.x);
        const minY = Math.min(this.marquee.start.y[yIndex], this.marquee.end.y[yIndex]);
        const maxX = Math.max(this.marquee.start.x, this.marquee.end.x);
        const maxY = Math.max(this.marquee.start.y[yIndex], this.marquee.end.y[yIndex]);
        const boundingBox = {
          minX,
          minY,
          maxX,
          maxY
        };
        boundingBoxPerYAxis.push({
          id: yAxis.get('id'),
          boundingBox
        });
      });

      const pointsInBox = this.getPointsInBox(boundingBoxPerYAxis);
      if (!pointsInBox) {
        return;
      }

      this.annotationSelections = pointsInBox.flat();
      this.selectNewPlotAnnotations(boundingBoxPerYAxis, pointsInBox, event);
    },
    endZoomMarquee() {
      const startPixels = this.marquee.startPixels;
      const endPixels = this.marquee.endPixels;
      const marqueeDistance = Math.sqrt(
        Math.pow(startPixels.x - endPixels.x, 2) + Math.pow(startPixels.y - endPixels.y, 2)
      );
      // Don't zoom if mouse moved less than 7.5 pixels.
      if (marqueeDistance > 7.5) {
        this.config.xAxis.set('displayRange', {
          min: Math.min(this.marquee.start.x, this.marquee.end.x),
          max: Math.max(this.marquee.start.x, this.marquee.end.x)
        });
        this.yAxisListWithRange.forEach((yAxis) => {
          const yStartPosition = this.getYPositionForYAxis(this.marquee.start, yAxis);
          const yEndPosition = this.getYPositionForYAxis(this.marquee.end, yAxis);
          yAxis.set('displayRange', {
            min: Math.min(yStartPosition, yEndPosition),
            max: Math.max(yStartPosition, yEndPosition)
          });
        });
        this.userViewportChangeEnd();
      } else {
        // A history entry is created by startMarquee, need to remove
        // if marquee zoom doesn't occur.
        this.plotHistory.pop();
      }
    },
    endMarquee(event) {
      if (this.marquee.annotationEvent) {
        this.endAnnotationMarquee(event);
      } else {
        this.endZoomMarquee();
        this.rectangles = [];
      }

      this.marquee = null;
    },

    onAnnotationChange(annotations) {
      if (this.marquee) {
        this.marquee.annotationEvent = false;
        this.endMarquee();
      }

      this.loadAnnotations();
    },

    zoom(zoomDirection, zoomFactor) {
      const currentXaxis = this.config.xAxis.get('displayRange');

      let doesYAxisHaveRange = false;
      this.yAxisListWithRange.forEach((yAxisModel) => {
        if (yAxisModel.get('displayRange')) {
          doesYAxisHaveRange = true;
        }
      });

      // when there is no plot data, the ranges can be undefined
      // in which case we should not perform zoom
      if (!currentXaxis || !doesYAxisHaveRange) {
        return;
      }

      this.freeze();
      this.trackHistory();

      const xAxisDist = (currentXaxis.max - currentXaxis.min) * zoomFactor;

      if (zoomDirection === 'in') {
        this.config.xAxis.set('displayRange', {
          min: currentXaxis.min + xAxisDist,
          max: currentXaxis.max - xAxisDist
        });

        this.yAxisListWithRange.forEach((yAxisModel) => {
          const currentYaxis = yAxisModel.get('displayRange');
          if (!currentYaxis) {
            return;
          }

          const yAxisDist = (currentYaxis.max - currentYaxis.min) * zoomFactor;
          yAxisModel.set('displayRange', {
            min: currentYaxis.min + yAxisDist,
            max: currentYaxis.max - yAxisDist
          });
        });
      } else if (zoomDirection === 'out') {
        this.config.xAxis.set('displayRange', {
          min: currentXaxis.min - xAxisDist,
          max: currentXaxis.max + xAxisDist
        });

        this.yAxisListWithRange.forEach((yAxisModel) => {
          const currentYaxis = yAxisModel.get('displayRange');
          if (!currentYaxis) {
            return;
          }

          const yAxisDist = (currentYaxis.max - currentYaxis.min) * zoomFactor;
          yAxisModel.set('displayRange', {
            min: currentYaxis.min - yAxisDist,
            max: currentYaxis.max + yAxisDist
          });
        });
      }

      this.userViewportChangeEnd();
    },

    wheelZoom(event) {
      const ZOOM_AMT = 0.1;
      event.preventDefault();

      if (event.wheelDelta === undefined || !this.positionOverPlot) {
        return;
      }

      let xDisplayRange = this.config.xAxis.get('displayRange');

      let doesYAxisHaveRange = false;
      this.yAxisListWithRange.forEach((yAxisModel) => {
        if (yAxisModel.get('displayRange')) {
          doesYAxisHaveRange = true;
        }
      });

      // when there is no plot data, the ranges can be undefined
      // in which case we should not perform zoom
      if (!xDisplayRange || !doesYAxisHaveRange) {
        return;
      }

      this.freeze();
      window.clearTimeout(this.stillZooming);

      let xAxisDist = xDisplayRange.max - xDisplayRange.min;
      let xDistMouseToMax = xDisplayRange.max - this.positionOverPlot.x;
      let xDistMouseToMin = this.positionOverPlot.x - xDisplayRange.min;
      let xAxisMaxDist = xDistMouseToMax / xAxisDist;
      let xAxisMinDist = xDistMouseToMin / xAxisDist;

      let plotHistoryStep;

      if (!plotHistoryStep) {
        const yRangeList = [];
        this.yAxisListWithRange.map((yAxis) => yRangeList.push(yAxis.get('displayRange')));
        plotHistoryStep = {
          x: this.config.xAxis.get('displayRange'),
          y: yRangeList
        };
      }

      if (event.wheelDelta < 0) {
        this.config.xAxis.set('displayRange', {
          min: xDisplayRange.min + xAxisDist * ZOOM_AMT * xAxisMinDist,
          max: xDisplayRange.max - xAxisDist * ZOOM_AMT * xAxisMaxDist
        });

        this.yAxisListWithRange.forEach((yAxisModel) => {
          const yDisplayRange = yAxisModel.get('displayRange');
          if (!yDisplayRange) {
            return;
          }

          const yPosition = this.getYPositionForYAxis(this.positionOverPlot, yAxisModel);
          let yAxisDist = yDisplayRange.max - yDisplayRange.min;
          let yDistMouseToMax = yDisplayRange.max - yPosition;
          let yDistMouseToMin = yPosition - yDisplayRange.min;
          let yAxisMaxDist = yDistMouseToMax / yAxisDist;
          let yAxisMinDist = yDistMouseToMin / yAxisDist;

          yAxisModel.set('displayRange', {
            min: yDisplayRange.min + yAxisDist * ZOOM_AMT * yAxisMinDist,
            max: yDisplayRange.max - yAxisDist * ZOOM_AMT * yAxisMaxDist
          });
        });
      } else if (event.wheelDelta >= 0) {
        this.config.xAxis.set('displayRange', {
          min: xDisplayRange.min - xAxisDist * ZOOM_AMT * xAxisMinDist,
          max: xDisplayRange.max + xAxisDist * ZOOM_AMT * xAxisMaxDist
        });

        this.yAxisListWithRange.forEach((yAxisModel) => {
          const yDisplayRange = yAxisModel.get('displayRange');
          if (!yDisplayRange) {
            return;
          }

          const yPosition = this.getYPositionForYAxis(this.positionOverPlot, yAxisModel);
          let yAxisDist = yDisplayRange.max - yDisplayRange.min;
          let yDistMouseToMax = yDisplayRange.max - yPosition;
          let yDistMouseToMin = yPosition - yDisplayRange.min;
          let yAxisMaxDist = yDistMouseToMax / yAxisDist;
          let yAxisMinDist = yDistMouseToMin / yAxisDist;

          yAxisModel.set('displayRange', {
            min: yDisplayRange.min - yAxisDist * ZOOM_AMT * yAxisMinDist,
            max: yDisplayRange.max + yAxisDist * ZOOM_AMT * yAxisMaxDist
          });
        });
      }

      this.stillZooming = window.setTimeout(
        function () {
          this.plotHistory.push(plotHistoryStep);
          plotHistoryStep = undefined;
          this.userViewportChangeEnd();
        }.bind(this),
        250
      );
    },

    startPan(event) {
      this.canvas.classList.add('plot-drag');
      this.canvas.classList.remove('plot-marquee');

      this.trackMousePosition(event);
      this.freeze();
      this.pan = {
        start: this.positionOverPlot
      };
      event.preventDefault();
      this.trackHistory();

      return false;
    },

    updatePan() {
      // calculate offset between points.  Apply that offset to viewport.
      if (!this.pan) {
        return;
      }

      const dX = this.pan.start.x - this.positionOverPlot.x;
      const xRange = this.config.xAxis.get('displayRange');

      this.config.xAxis.set('displayRange', {
        min: xRange.min + dX,
        max: xRange.max + dX
      });

      const dY = [];
      this.positionOverPlot.y.forEach((yAxisPosition, index) => {
        const yAxisId = this.positionOverPlot.yAxisIds[index];
        dY.push({
          yAxisId: yAxisId,
          y: this.pan.start.y[index] - yAxisPosition
        });
      });

      this.yAxisListWithRange.forEach((yAxis) => {
        const yRange = yAxis.get('displayRange');
        if (!yRange) {
          return;
        }

        const yIndex = dY.findIndex((y) => y.yAxisId === yAxis.get('id'));

        yAxis.set('displayRange', {
          min: yRange.min + dY[yIndex].y,
          max: yRange.max + dY[yIndex].y
        });
      });
    },

    trackHistory() {
      const yRangeList = [];
      const yAxisIds = [];
      this.yAxisListWithRange.forEach((yAxis) => {
        yRangeList.push(yAxis.get('displayRange'));
        yAxisIds.push(yAxis.get('id'));
      });
      this.plotHistory.push({
        x: this.config.xAxis.get('displayRange'),
        y: yRangeList,
        yAxisIds
      });
    },

    endPan() {
      this.pan = undefined;
      this.userViewportChangeEnd();
    },

    freeze() {
      this.yAxisListWithRange.forEach((yAxis) => {
        yAxis.set('frozen', true);
      });
      this.config.xAxis.set('frozen', true);
      this.setStatus();
    },

    resumeRealtimeData() {
      // remove annotation selections
      this.rectangles = [];

      this.clearPanZoomHistory();
      this.userViewportChangeEnd();
    },

    clearPanZoomHistory() {
      this.yAxisListWithRange.forEach((yAxis) => {
        yAxis.set('frozen', false);
      });
      this.config.xAxis.set('frozen', false);
      this.setStatus();
      this.plotHistory = [];
    },

    back() {
      const previousAxisRanges = this.plotHistory.pop();
      if (this.plotHistory.length === 0) {
        this.resumeRealtimeData();

        return;
      }

      this.config.xAxis.set('displayRange', previousAxisRanges.x);
      this.yAxisListWithRange.forEach((yAxis) => {
        const yPosition = this.getYPositionForYAxis(previousAxisRanges, yAxis);
        yAxis.set('displayRange', yPosition);
      });

      this.userViewportChangeEnd();
    },

    setYAxisKey(yKey, yAxisId) {
      const seriesForYAxis = this.config.series.models.filter(
        (model) => model.get('yAxisId') === yAxisId
      );
      seriesForYAxis.forEach((model) => model.set('yKey', yKey));
    },

    pause() {
      this.freeze();
    },

    showSynchronizeDialog() {
      const isLocalClock = this.timeContext.clock();
      if (isLocalClock !== undefined) {
        const message = `
                This action will change the Time Conductor to Fixed Timespan mode with this plot view's current time bounds.
                Do you want to continue?
            `;

        let dialog = this.openmct.overlays.dialog({
          title: 'Synchronize Time Conductor',
          iconClass: 'alert',
          size: 'fit',
          message: message,
          buttons: [
            {
              label: 'OK',
              callback: () => {
                dialog.dismiss();
                this.synchronizeTimeConductor();
              }
            },
            {
              label: 'Cancel',
              callback: () => {
                dialog.dismiss();
              }
            }
          ]
        });
      } else {
        this.openmct.notifications.alert('Time conductor bounds have changed.');
        this.synchronizeTimeConductor();
      }
    },

    synchronizeTimeConductor() {
      this.timeContext.stopClock();
      const range = this.config.xAxis.get('displayRange');
      this.timeContext.bounds({
        start: range.min,
        end: range.max
      });
      this.isTimeOutOfSync = false;
    },

    destroy() {
      if (this.config) {
        configStore.deleteStore(this.config.id);
      }

      this.stopListening();

      if (this.checkForSize) {
        clearInterval(this.checkForSize);
        delete this.checkForSize;
      }

      if (this.filterObserver) {
        this.filterObserver();
      }

      if (this.removeStatusListener) {
        this.removeStatusListener();
      }

      if (this.plotContainerResizeObserver) {
        this.plotContainerResizeObserver.disconnect();
      }

      this.stopFollowingTimeContext();
      this.openmct.objectViews.off('clearData', this.clearData);
    },
    updateStatus(status) {
      this.$emit('statusUpdated', status);
    },
    handleWindowResize() {
      const { plotWrapper } = this.$parent.$refs;
      if (!plotWrapper) {
        return;
      }

      const newOffsetWidth = plotWrapper.offsetWidth;
      //we ignore when width gets smaller
      const offsetChange = newOffsetWidth - this.offsetWidth;
      if (offsetChange > OFFSET_THRESHOLD) {
        this.offsetWidth = newOffsetWidth;
        this.config.series.models.forEach(this.loadSeriesData, this);
      }
    },
    toggleCursorGuide() {
      this.cursorGuide = !this.cursorGuide;
      this.$emit('cursorGuide', this.cursorGuide);
    },
    toggleGridLines() {
      this.gridLines = !this.gridLines;
      this.$emit('gridLines', this.gridLines);
    }
  }
};
</script>
