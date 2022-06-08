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
            v-for="object in compositionObjects"
            :key="object.id"
            class="c-plot--stacked-container"
            :child-object="object"
            :options="options"
            :grid-lines="gridLines"
            :color-palette="colorPalette"
            :cursor-guide="cursorGuide"
            :show-limit-line-labels="showLimitLineLabels"
            :plot-tick-width="maxTickWidth"
            @plotTickWidth="onTickWidthChange"
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
        this.seriesConfig = {};

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
            return Math.max(...Object.values(this.tickWidthMap));
        }
    },
    beforeDestroy() {
        this.destroy();
    },
    mounted() {
        eventHelpers.extend(this);

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

            this.$set(this.tickWidthMap, id, 0);
            const persistedConfig = this.domainObject.configuration.series && this.domainObject.configuration.series.find((seriesConfig) => {
                return this.openmct.objects.areIdsEqual(seriesConfig.identifier, child.identifier);
            });
            if (persistedConfig === undefined) {
                this.openmct.objects.mutate(
                    this.domainObject,
                    'configuration.series[' + this.compositionObjects.length + ']',
                    {
                        identifier: child.identifier
                    }
                );
            }

            this.compositionObjects.push(child);
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

            const childObj = this.compositionObjects.filter((c) => {
                const identifier = this.openmct.objects.makeKeyString(c.identifier);

                return identifier === id;
            })[0];
            if (childObj) {
                const index = this.compositionObjects.indexOf(childObj);
                this.compositionObjects.splice(index, 1);
            }
        },

        compositionReorder(reorderPlan) {
            let oldComposition = this.compositionObjects.slice();

            reorderPlan.forEach((reorder) => {
                this.compositionObjects[reorder.newIndex] = oldComposition[reorder.oldIndex];
            });
        },

        resetTelemetryAndTicks(domainObject) {
            this.compositionObjects = [];
            this.tickWidthMap = {};
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
        onTickWidthChange(width, plotId) {
            if (!Object.prototype.hasOwnProperty.call(this.tickWidthMap, plotId)) {
                return;
            }

            this.$set(this.tickWidthMap, plotId, width);
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
            this.seriesConfig[configId] = this.getConfig(configId);
            this.listenTo(this.seriesConfig[configId].series, 'add', this.addSeries, this);
            this.listenTo(this.seriesConfig[configId].series, 'remove', this.removeSeries, this);

            this.seriesConfig[configId].series.models.forEach(this.addSeries, this);
        },
        addSeries(series) {
            const index = this.seriesModels.length;
            this.$set(this.seriesModels, index, series);
        },
        removeSeries(plotSeries) {
            const index = this.seriesModels.findIndex(seriesModel => this.openmct.objects.areIdsEqual(seriesModel.identifier, plotSeries.identifier));
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
