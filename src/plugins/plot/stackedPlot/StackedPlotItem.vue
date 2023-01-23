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
<div></div>
</template>
<script>

import MctPlot from '../MctPlot.vue';
import Vue from "vue";
import conditionalStylesMixin from "./mixins/objectStyles-mixin";
import stalenessMixin from '@/ui/mixins/staleness-mixin';
import configStore from "@/plugins/plot/configuration/ConfigStore";
import PlotConfigurationModel from "@/plugins/plot/configuration/PlotConfigurationModel";
import ProgressBar from "../../../ui/components/ProgressBar.vue";

export default {
    mixins: [conditionalStylesMixin, stalenessMixin],
    inject: ['openmct', 'domainObject', 'path'],
    props: {
        childObject: {
            type: Object,
            default() {
                return {};
            }
        },
        options: {
            type: Object,
            default() {
                return {};
            }
        },
        gridLines: {
            type: Boolean,
            default() {
                return true;
            }
        },
        cursorGuide: {
            type: Boolean,
            default() {
                return true;
            }
        },
        showLimitLineLabels: {
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
        },
        plotTickWidth: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    watch: {
        gridLines(newGridLines) {
            this.updateComponentProp('gridLines', newGridLines);
        },
        cursorGuide(newCursorGuide) {
            this.updateComponentProp('cursorGuide', newCursorGuide);
        },
        plotTickWidth(width) {
            this.updateComponentProp('plotTickWidth', width);
        },
        showLimitLineLabels: {
            handler(data) {
                this.updateComponentProp('limitLineLabels', data);
            },
            deep: true
        }
    },
    mounted() {
        this.updateView();
    },
    beforeDestroy() {
        if (this.removeSelectable) {
            this.removeSelectable();
        }

        if (this.component) {
            this.component.$destroy();
        }
    },
    methods: {
        updateComponentProp(prop, value) {
            if (this.component) {
                this.component[prop] = value;
            }
        },
        updateView() {
            this.isStale = false;

            this.triggerUnsubscribeFromStaleness();

            if (this.component) {
                this.component.$destroy();
                this.component = undefined;
                this.$el.innerHTML = '';
            }

            const onTickWidthChange = this.onTickWidthChange;
            const onLockHighlightPointUpdated = this.onLockHighlightPointUpdated;
            const onHighlightsUpdated = this.onHighlightsUpdated;
            const onConfigLoaded = this.onConfigLoaded;
            const onCursorGuideChange = this.onCursorGuideChange;
            const onGridLinesChange = this.onGridLinesChange;
            const setStatus = this.setStatus;

            const openmct = this.openmct;
            const path = this.path;

            //If this object is not persistable, then package it with it's parent
            const object = this.getPlotObject();

            const getProps = this.getProps;
            const isMissing = openmct.objects.isMissing(object);
            let viewContainer = document.createElement('div');
            this.$el.append(viewContainer);

            this.subscribeToStaleness(object, (isStale) => {
                this.updateComponentProp('isStale', isStale);
            });

            this.component = new Vue({
                el: viewContainer,
                components: {
                    MctPlot,
                    ProgressBar
                },
                provide: {
                    openmct,
                    domainObject: object,
                    path
                },
                data() {
                    return {
                        ...getProps(),
                        onTickWidthChange,
                        onLockHighlightPointUpdated,
                        onHighlightsUpdated,
                        onConfigLoaded,
                        onCursorGuideChange,
                        onGridLinesChange,
                        setStatus,
                        isMissing,
                        loading: false
                    };
                },
                methods: {
                    loadingUpdated(loaded) {
                        this.loading = loaded;
                    }
                },
                template: '<div v-if="!isMissing" ref="plotWrapper" class="l-view-section u-style-receiver js-style-receiver" :class="{\'s-status-timeconductor-unsynced\': status && status === \'timeconductor-unsynced\', \'is-stale\': isStale}"><progress-bar v-show="loading !== false" class="c-telemetry-table__progress-bar" :model="{progressPerc: undefined}" /><mct-plot :init-grid-lines="gridLines" :init-cursor-guide="cursorGuide" :plot-tick-width="plotTickWidth" :limit-line-labels="limitLineLabels" :color-palette="colorPalette" :options="options" @plotTickWidth="onTickWidthChange" @lockHighlightPoint="onLockHighlightPointUpdated" @highlights="onHighlightsUpdated" @configLoaded="onConfigLoaded" @cursorGuide="onCursorGuideChange" @gridLines="onGridLinesChange" @statusUpdated="setStatus" @loadingUpdated="loadingUpdated"/></div>'
            });

            this.setSelection();
        },
        onLockHighlightPointUpdated() {
            this.$emit('lockHighlightPoint', ...arguments);
        },
        onHighlightsUpdated() {
            this.$emit('highlights', ...arguments);
        },
        onConfigLoaded() {
            this.$emit('configLoaded', ...arguments);
        },
        onTickWidthChange() {
            this.$emit('plotTickWidth', ...arguments);
        },
        onCursorGuideChange() {
            this.$emit('cursorGuide', ...arguments);
        },
        onGridLinesChange() {
            this.$emit('gridLines', ...arguments);
        },
        setStatus(status) {
            this.status = status;
            this.updateComponentProp('status', status);
        },
        setSelection() {
            let childContext = {};
            childContext.item = this.childObject;
            this.context = childContext;
            if (this.removeSelectable) {
                this.removeSelectable();
            }

            this.removeSelectable = this.openmct.selection.selectable(
                this.$el, this.context);
        },
        getProps() {
            return {
                limitLineLabels: this.showLimitLineLabels,
                gridLines: this.gridLines,
                cursorGuide: this.cursorGuide,
                plotTickWidth: this.plotTickWidth,
                options: this.options,
                status: this.status,
                colorPalette: this.colorPalette,
                isStale: this.isStale
            };
        },
        getPlotObject() {
            if (this.childObject.configuration && this.childObject.configuration.series) {
                //If the object has a configuration, allow initialization of the config from it's persisted config
                return this.childObject;
            } else {
                //If object is missing, warn and return object
                if (this.openmct.objects.isMissing(this.childObject)) {
                    console.warn('Missing domain object');

                    return this.childObject;
                }

                // If the object does not have configuration, initialize the series config with the persisted config from the stacked plot
                const configId = this.openmct.objects.makeKeyString(this.childObject.identifier);
                let config = configStore.get(configId);
                if (!config) {
                    let persistedSeriesConfig = this.domainObject.configuration.series.find((seriesConfig) => {
                        return this.openmct.objects.areIdsEqual(seriesConfig.identifier, this.childObject.identifier);
                    });

                    if (!persistedSeriesConfig) {
                        persistedSeriesConfig = {
                            series: {},
                            yAxis: {}
                        };
                    }

                    config = new PlotConfigurationModel({
                        id: configId,
                        domainObject: {
                            ...this.childObject,
                            configuration: {
                                series: [
                                    {
                                        identifier: this.childObject.identifier,
                                        ...persistedSeriesConfig.series
                                    }
                                ],
                                yAxis: persistedSeriesConfig.yAxis

                            }
                        },
                        openmct: this.openmct,
                        palette: this.colorPalette,
                        callback: (data) => {
                            this.data = data;
                        }
                    });
                    configStore.add(configId, config);
                }

                return this.childObject;
            }
        }
    }
};
</script>
