<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
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
<div ref="plotWrapper"
     class="c-plot holder holder-plot has-control-bar"
>
    <div class="c-control-bar">
        <span class="c-button-set c-button-set--strip-h">
            <button class="c-button icon-download"
                    title="Export This View's Data as PNG"
                    @click="exportPNG()"
            >
                <span class="c-button__label">PNG</span>
            </button>
            <button class="c-button"
                    title="Export This View's Data as JPG"
                    @click="exportJPG()"
            >
                <span class="c-button__label">JPG</span>
            </button>
        </span>
        <button class="c-button icon-crosshair"
                :class="{ 'is-active': cursorGuide }"
                title="Toggle cursor guides"
                @click="toggleCursorGuide"
        >
        </button>
        <button class="c-button"
                :class="{ 'icon-grid-on': gridLines, 'icon-grid-off': !gridLines }"
                title="Toggle grid lines"
                @click="toggleGridLines"
        >
        </button>
    </div>

    <div ref="plotContainer"
         class="l-view-section u-style-receiver js-style-receiver"
    >
        <div v-show="!!pending"
             class="c-loading--overlay loading"
        ></div>
        <mct-plot v-if="config !== undefined"
                  :series-config="config"
                  :x-axis="config.xAxis"
                  :y-axis="config.yAxis"
                  :legend="config.legend"
                  :grid-lines="gridLines"
                  :cursor-guide="cursorGuide"
                  @userViewportChangeEnd="onUserViewportChangeEnd"
        />
    </div>
</div>
</template>

<script>
import eventHelpers from "./lib/eventHelpers";
import MctPlot from './MctPlot.vue';
import PlotConfigurationModel from './configuration/PlotConfigurationModel';
import configStore from './configuration/configStore';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        MctPlot
    },
    data() {
        return {
            //Don't think we need this as it appears to be stacked plot specific
            // hideExportButtons: false
            cursorGuide: false,
            gridLines: true,
            pending: 0,
            config: undefined
        };
    },
    mounted() {
        eventHelpers.extend(this);

        this.exportImageService = this.openmct.$injector.get('exportImageService');
        this.openmct.objectViews.on('clearData', this.clearData);

        this.config = this.getConfig();
        //TODO: Can replace all the listenTo calls with .on and .off
        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);
        this.config.series.models.forEach(this.addSeries, this);

        this.followTimeConductor();

        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

        this.filterObserver = this.openmct.objects.observe(
            this.domainObject,
            'configuration.filters',
            this.updateFiltersAndResubscribe.bind(this)
        );
    },
    beforeDestroy() {
        this.destroy();
    },
    methods: {
        getConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (!config) {
                const newDomainObject = this.openmct.legacyObject(this.domainObject).useCapability('adapter');
                config = new PlotConfigurationModel({
                    id: configId,
                    domainObject: newDomainObject,
                    openmct: this.openmct
                });
                configStore.add(configId, config);
            }

            return config;
        },
        followTimeConductor() {
            this.openmct.time.on('bounds', this.updateDisplayBounds);
            this.openmct.time.on('timeSystem', this.syncXAxisToTimeSystem);
            this.synchronized(true);
        },

        loadSeriesData(series) {
            if (this.$refs.plotWrapper.offsetWidth === 0) {
                this.scheduleLoad(series);

                return;
            }

            this.startLoading();
            const options = {
                size: this.$refs.plotWrapper.offsetWidth,
                domain: this.config.xAxis.get('key')
            };

            series.load(options)
                .then(this.stopLoading.bind(this));
        },

        scheduleLoad(series) {
            if (!this.scheduledLoads) {
                this.startLoading();
                this.scheduledLoads = [];
                this.checkForSize = setInterval(function () {
                    if (this.$refs.plotWrapper.offsetWidth === 0) {
                        return;
                    }

                    this.stopLoading();
                    this.scheduledLoads.forEach(this.loadSeriesData, this);
                    delete this.scheduledLoads;
                    clearInterval(this.checkForSize);
                    delete this.checkForSize;
                }.bind(this));
            }

            if (this.scheduledLoads.indexOf(series) === -1) {
                this.scheduledLoads.push(series);
            }
        },

        addSeries(series) {
            this.listenTo(series, 'change:xKey', (xKey) => {
                this.setDisplayRange(series, xKey);
            }, this);
            this.listenTo(series, 'change:yKey', () => {
                this.loadSeriesData(series);
            }, this);

            this.listenTo(series, 'change:interpolate', () => {
                this.loadSeriesData(series);
            }, this);

            this.loadSeriesData(series);
        },

        setDisplayRange(series, xKey) {
            if (this.config.series.length !== 1) {
                return;
            }

            const displayRange = series.getDisplayRange(xKey);
            this.config.xAxis.set('range', displayRange);
        },

        removeSeries(plotSeries) {
            this.stopListening(plotSeries);
        },

        syncXAxisToTimeSystem(timeSystem) {
            this.config.xAxis.set('key', timeSystem.key);
            this.config.xAxis.resetSeries();
        },

        destroy() {
            configStore.deleteStore(this.config.id);

            this.stopListening();
            if (this.checkForSize) {
                clearInterval(this.checkForSize);
                delete this.checkForSize;
            }

            if (this.filterObserver) {
                this.filterObserver();
            }
        },

        loadMoreData(range, purge) {
            this.config.series.forEach(plotSeries => {
                this.startLoading();
                plotSeries.load({
                    size: this.$refs.plotWrapper.offsetWidth,
                    start: range.min,
                    end: range.max,
                    domain: this.config.xAxis.get('key')
                })
                    .then(this.stopLoading());
                if (purge) {
                    plotSeries.purgeRecordsOutsideRange(range);
                }
            });
        },

        /**
       * Track latest display bounds.  Forces update when not receiving ticks.
       */
        updateDisplayBounds(bounds, isTick) {

            const xAxisKey = this.config.xAxis.get('key');
            const timeSystem = this.openmct.time.timeSystem();
            const newRange = {
                min: bounds.start,
                max: bounds.end
            };

            if (xAxisKey !== timeSystem.key) {
                this.syncXAxisToTimeSystem(timeSystem);
            }

            this.config.xAxis.set('range', newRange);
            if (!isTick) {
                this.skipReloadOnInteraction = true;
                //TODO: how to do this with Vue?
                this.$scope.$broadcast('plot:clearHistory');
                this.skipReloadOnInteraction = false;
                this.loadMoreData(newRange, true);
            } else {
                // Drop any data that is more than 1x (max-min) before min.
                // Limit these purges to once a second.
                if (!this.nextPurge || this.nextPurge < Date.now()) {
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

        startLoading() {
            this.pending += 1;
        },

        stopLoading() {
            //TODO: Is Vue.$nextTick ok to replace $scope.$evalAsync?
            this.$nextTick().then(() => {
                this.pending -= 1;
            });
        },

        /**
       * Getter/setter for "synchronized" value.  If not synchronized and
       * time conductor is in clock mode, will mark objects as unsynced so that
       * displays can update accordingly.
       * @private
       */
        synchronized(value) {
            if (typeof value !== 'undefined') {
                this._synchronized = value;
                const isUnsynced = !value && this.openmct.time.clock();
                const domainObject = this.openmct.legacyObject(this.domainObject);
                if (domainObject.getCapability('status')) {
                    domainObject.getCapability('status')
                        .set('timeconductor-unsynced', isUnsynced);
                }
            }

            return this._synchronized;
        },

        /**
       * Handle end of user viewport change: load more data for current display
       * bounds, and mark view as synchronized if bounds match configured bounds.
       * @private
       */
        onUserViewportChangeEnd() {
            const xDisplayRange = this.config.xAxis.get('displayRange');
            const xRange = this.config.xAxis.get('range');

            if (!this.skipReloadOnInteraction) {
                this.loadMoreData(xDisplayRange);
            }

            this.synchronized(xRange.min === xDisplayRange.min
            && xRange.max === xDisplayRange.max);
        },

        updateFiltersAndResubscribe(updatedFilters) {
            this.config.series.forEach(function (series) {
                series.updateFiltersAndRefresh(updatedFilters[series.keyString]);
            });
        },

        clearData() {
            this.config.series.forEach(function (series) {
                series.reset();
            });
        },

        /**
       * Export view as JPG.
       */
        exportJPG() {
            const plotElement = this.$refs.plotContainer;

            this.exportImageService.exportJPG(plotElement, 'plot.jpg', 'export-plot');
        },

        /**
       * Export view as PNG.
       */
        exportPNG() {
            const plotElement = this.$refs.plotContainer;

            this.exportImageService.exportPNG(plotElement, 'plot.png', 'export-plot');
        },

        toggleCursorGuide() {
            this.cursorGuide = !this.cursorGuide;
        },

        toggleGridLines() {
            this.gridLines = !this.gridLines;
        }
    }
};

</script>
