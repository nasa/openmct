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
        v-if="compositionObjectsConfigLoaded"
        :cursor-locked="!!lockHighlightPoint"
        :highlights="highlights"
        @legendHoverChanged="legendHoverChanged"
        @expanded="updateExpanded"
        @position="updatePosition"
    />
    <div class="l-view-section">
        <stacked-plot-item
            v-for="object in compositionObjects"
            :key="`${object.identifier.namespace}-${object.identifier.key}`"
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
            @configLoaded="configLoadedForObject(object.identifier)"
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

export default {
    components: {
        StackedPlotItem,
        PlotLegend
    },
    inject: ['openmct', 'domainObject', 'path'],
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
            configLoaded: {},
            compositionObjects: [],
            tickWidthMap: {},
            loaded: false,
            lockHighlightPoint: false,
            highlights: [],
            showLimitLineLabels: undefined,
            colorPalette: new ColorPalette(),
            compositionObjectsConfigLoaded: false,
            position: 'top',
            expanded: false
        };
    },
    computed: {
        plotLegendPositionClass() {
            return `plot-legend-${this.position}`;
        },
        plotLegendExpandedStateClass() {
            if (this.expanded) {
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
        //We only need to initialize the stacked plot config for legend properties
        const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.config = this.getConfig(configId);

        this.loaded = true;
        this.imageExporter = new ImageExporter(this.openmct);

        this.composition = this.openmct.composition.get(this.domainObject);
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
        configLoadedForObject(childObjIdentifier) {
            const childObjId = this.openmct.objects.makeKeyString(childObjIdentifier);
            this.configLoaded[childObjId] = true;
            this.setConfigLoadedForComposition();
        },
        setConfigLoadedForComposition() {
            this.compositionObjectsConfigLoaded = this.compositionObjects.length && this.compositionObjects.every(childObject => {
                const id = this.openmct.objects.makeKeyString(childObject.identifier);

                return this.configLoaded[id] === true;
            });
        },
        destroy() {
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            this.composition.off('reorder', this.compositionReorder);
        },

        addChild(child) {
            const id = this.openmct.objects.makeKeyString(child.identifier);

            this.$set(this.tickWidthMap, id, 0);

            this.compositionObjects.push(child);
            this.setConfigLoadedForComposition();
        },

        removeChild(childIdentifier) {
            const id = this.openmct.objects.makeKeyString(childIdentifier);

            this.$delete(this.tickWidthMap, id);

            const childObj = this.compositionObjects.filter((c) => {
                const identifier = this.openmct.objects.makeKeyString(c.identifier);

                return identifier === id;
            })[0];
            if (childObj) {
                const index = this.compositionObjects.indexOf(childObj);
                this.compositionObjects.splice(index, 1);
            }

            const configIndex = this.domainObject.configuration.series.findIndex((seriesConfig) => {
                return this.openmct.objects.areIdsEqual(seriesConfig.identifier, childIdentifier);
            });
            if (configIndex > -1) {
                const cSeries = this.domainObject.configuration.series.slice();
                const series = cSeries.splice(configIndex, 1)[0];
                this.openmct.objects.mutate(this.domainObject, 'configuration.series', cSeries);

                if (childObj.type !== 'telemetry.plot.overlay') {
                    const config = this.getConfig(this.openmct.objects.makeKeyString(series.identifier));
                    if (config) {
                        config.series.remove(config.series.at(0));
                    }
                }
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
        updateExpanded(expanded) {
            this.expanded = expanded;
        },
        updatePosition(position) {
            this.position = position;
        },
        updateReady(ready) {
            this.configReady = ready;
        },
        highlightsUpdated(data) {
            this.highlights = data;
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
