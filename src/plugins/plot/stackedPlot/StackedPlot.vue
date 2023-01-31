<!--
 Open MCT, Copyright (c) 2014-2022, United States Government
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
    class="c-plot c-plot--stacked holder holder-plot has-control-bar"
    :class="[plotLegendExpandedStateClass, plotLegendPositionClass]"
>
    <plot-legend
        :cursor-locked="!!lockHighlightPoint"
        :series="seriesModels"
        :highlights="highlights"
        :legend="legend"
        @legendHoverChanged="legendHoverChanged"
    />
    <div class="l-view-section">
        <stacked-plot-item
            v-for="objectWrapper in compositionObjects"
            :key="objectWrapper.keyString"
            class="c-plot--stacked-container"
            :child-object="objectWrapper.object"
            :options="options"
            :grid-lines="gridLines"
            :color-palette="colorPalette"
            :cursor-guide="cursorGuide"
            :show-limit-line-labels="showLimitLineLabels"
            :parent-y-tick-width="maxTickWidth"
            @plotYTickWidth="onYTickWidthChange"
            @loadingUpdated="loadingUpdated"
            @cursorGuide="onCursorGuideChange"
            @gridLines="onGridLinesChange"
            @lockHighlightPoint="lockHighlightPointUpdated"
            @highlights="highlightsUpdated"
            @configLoaded="registerSeriesListeners"
        />
    </div>
</div>
</template>

<script>

import PlotConfigurationModel from '../configuration/PlotConfigurationModel';
import configStore from '../configuration/ConfigStore';
import ColorPalette from "@/ui/color/ColorPalette";

import PlotLegend from "../legend/PlotLegend.vue";
import StackedPlotItem from './StackedPlotItem.vue';
import ImageExporter from '../../../exporters/ImageExporter';
import eventHelpers from "@/plugins/plot/lib/eventHelpers";

export default {
    components: {
        StackedPlotItem,
        PlotLegend
    },
    inject: ['openmct', 'domainObject', 'composition', 'path'],
    props: {
        options: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            hideExportButtons: false,
            cursorGuide: false,
            gridLines: true,
            loading: false,
            compositionObjects: [],
            tickWidthMap: {},
            legend: {},
            loaded: false,
            lockHighlightPoint: false,
            highlights: [],
            seriesModels: [],
            showLimitLineLabels: undefined,
            colorPalette: new ColorPalette()
        };
    },
    computed: {
        plotLegendPositionClass() {
            return `plot-legend-${this.config.legend.get('position')}`;
        },
        plotLegendExpandedStateClass() {
            if (this.config.legend.get('expanded')) {
                return 'plot-legend-expanded';
            } else {
                return 'plot-legend-collapsed';
            }
        },
        maxTickWidth() {
            const tickWidthValues = Object.values(this.tickWidthMap);
            const maxLeftTickWidth = Math.max(...tickWidthValues.map(tickWidthItem => tickWidthItem.leftTickWidth));
            const maxRightTickWidth = Math.max(...tickWidthValues.map(tickWidthItem => tickWidthItem.rightTickWidth));
            const multipleLeftAxes = tickWidthValues.some(tickWidthItem => tickWidthItem.multipleLeftAxes === true);

            return {
                leftTickWidth: maxLeftTickWidth,
                rightTickWidth: maxRightTickWidth,
                multipleLeftAxes
            };
        }
    },
    beforeDestroy() {
        this.destroy();
    },
    mounted() {
        eventHelpers.extend(this);
        this.seriesConfig = {};

        const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.config = this.getConfig(configId);

        this.legend = this.config.legend;

        this.loaded = true;
        this.imageExporter = new ImageExporter(this.openmct);

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
                    palette: this.colorPalette,
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
        destroy() {
            this.stopListening();
            configStore.deleteStore(this.config.id);

            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            this.composition.off('reorder', this.compositionReorder);
        },

        addChild(child) {
            const id = this.openmct.objects.makeKeyString(child.identifier);

            this.$set(this.tickWidthMap, id, {
                leftTickWidth: 0,
                rightTickWidth: 0
            });

            this.compositionObjects.push({
                object: child,
                keyString: id
            });
        },

        removeChild(childIdentifier) {
            const id = this.openmct.objects.makeKeyString(childIdentifier);

            this.$delete(this.tickWidthMap, id);

            const configIndex = this.domainObject.configuration.series.findIndex((seriesConfig) => {
                return this.openmct.objects.areIdsEqual(seriesConfig.identifier, childIdentifier);
            });

            if (configIndex > -1) {
                this.domainObject.configuration.series.splice(configIndex, 1);
            }

            this.removeSeries({
                keyString: id
            });

            this.compositionObjects = this.compositionObjects.filter((c) => {
                const identifier = c.keyString;

                return identifier !== id;
            });
        },

        compositionReorder(reorderPlan) {
            let oldComposition = this.compositionObjects.slice();

            reorderPlan.forEach((reorder) => {
                this.compositionObjects[reorder.newIndex] = oldComposition[reorder.oldIndex];
            });
        },

        resetTelemetryAndTicks(domainObject) {
            this.compositionObjects = [];
            this.tickWidthMap = {
                leftTickWidth: 0,
                rightTickWidth: 0
            };
        },

        exportJPG() {
            this.hideExportButtons = true;
            const plotElement = this.$el;

            this.imageExporter.exportJPG(plotElement, 'stacked-plot.jpg', 'export-plot')
                .finally(function () {
                    this.hideExportButtons = false;
                }.bind(this));
        },

        exportPNG() {
            this.hideExportButtons = true;

            const plotElement = this.$el;

            this.imageExporter.exportPNG(plotElement, 'stacked-plot.png', 'export-plot')
                .finally(function () {
                    this.hideExportButtons = false;
                }.bind(this));
        },
        onYTickWidthChange(data, plotId) {
            if (!Object.prototype.hasOwnProperty.call(this.tickWidthMap, plotId)) {
                return;
            }

            this.$set(this.tickWidthMap, plotId, data);
        },
        legendHoverChanged(data) {
            this.showLimitLineLabels = data;
        },
        lockHighlightPointUpdated(data) {
            this.lockHighlightPoint = data;
        },
        highlightsUpdated(data) {
            this.highlights = data;
        },
        registerSeriesListeners(configId) {
            const config = this.getConfig(configId);
            this.seriesConfig[configId] = config;
            const childObject = config.get('domainObject');

            //TODO differentiate between objects with composition and those without
            if (childObject.type === 'telemetry.plot.overlay') {
                this.listenTo(config.series, 'add', this.addSeries, this);
                this.listenTo(config.series, 'remove', this.removeSeries, this);
            }

            config.series.models.forEach(this.addSeries, this);
        },
        addSeries(series) {
            const childObject = series.domainObject;
            //don't add the series if it can have child series this will happen in registerSeriesListeners
            if (childObject.type !== 'telemetry.plot.overlay') {
                const index = this.seriesModels.length;
                this.$set(this.seriesModels, index, series);
            }

        },
        removeSeries(plotSeries) {
            const index = this.seriesModels.findIndex(seriesModel => seriesModel.keyString === plotSeries.keyString);
            if (index > -1) {
                this.$delete(this.seriesModels, index);
            }

            this.stopListening(plotSeries);
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
