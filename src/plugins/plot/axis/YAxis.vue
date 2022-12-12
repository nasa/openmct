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
    class="gl-plot-axis-area gl-plot-y has-local-controls js-plot-y-axis"
    :style="yAxisStyle"
>

    <div
        v-if="canShowYAxisLabel"
        class="gl-plot-label gl-plot-y-label"
        :class="{'icon-gear': (yKeyOptions.length > 1 && singleSeries)}"
    >{{ yAxisLabel }}
    </div>

    <select
        v-if="yKeyOptions.length > 1 && singleSeries"
        v-model="yAxisLabel"
        class="gl-plot-y-label__select local-controls--hidden"
        @change="toggleYAxisLabel"
    >
        <option
            v-for="(option, index) in yKeyOptions"
            :key="index"
            :value="option.name"
            :selected="option.name === yAxisLabel"
        >
            {{ option.name }}
        </option>
    </select>

    <mct-ticks
        :axis-id="id"
        :axis-type="'yAxis'"
        class="gl-plot-ticks"
        :position="'top'"
        @plotTickWidth="onTickWidthChange"
    />
</div>
</template>

<script>
import MctTicks from "../MctTicks.vue";
import configStore from "../configuration/ConfigStore";
import eventHelpers from "../lib/eventHelpers";

export default {
    components: {
        MctTicks
    },
    inject: ['openmct', 'domainObject'],
    props: {
        id: {
            type: Number,
            default() {
                return 1;
            }
        },
        tickWidth: {
            type: Number,
            default() {
                return 0;
            }
        },
        plotWidth: {
            type: Number,
            default() {
                return 0;
            }
        },
        visibleYAxes: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        this.seriesModels = [];

        return {
            yAxisLabel: 'none',
            loaded: false,
            yKeyOptions: [],
            hasSameRangeValue: true,
            singleSeries: true,
            mainYAxisId: null,
            hasAdditionalYAxes: false
        };
    },
    computed: {
        canShowYAxisLabel() {
            return this.singleSeries === true || this.hasSameRangeValue === true;
        },
        yAxisStyle() {
            const isMainYAxis = this?.id === this.mainYAxisId;
            let style;
            const width = `width: ${this.tickWidth + 20}px`;
            const border = `border-right: 1px solid`;
            if (isMainYAxis) {
                if (this.visibleYAxes > 1) {
                    style = `${width}; left: ${this.plotWidth - this.tickWidth + 40}px`;
                } else {
                    style = `${width}; left: ${this.plotWidth - this.tickWidth}px`;
                }
            } else {
                style = `${width}; ${border}; left: ${this.plotWidth - this.tickWidth - 3}px`;
            }

            return style;
        }
    },
    mounted() {
        eventHelpers.extend(this);
        this.initAxisAndSeriesConfig();
        this.loaded = true;
        this.setUpYAxisOptions();
    },
    methods: {
        initAxisAndSeriesConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (config) {
                this.mainYAxisId = config.yAxis.id;
                this.hasAdditionalYAxes = config?.additionalYAxes.length;
                if (this.id && this.id !== this.mainYAxisId) {
                    this.yAxis = config.additionalYAxes.find(yAxis => yAxis.id === this.id);
                } else {
                    this.yAxis = config.yAxis;
                }

                this.config = config;
                this.listenTo(this.config.series, 'add', this.addSeries, this);
                this.listenTo(this.config.series, 'remove', this.removeSeries, this);
                this.listenTo(this.config.series, 'reorder', this.addOrRemoveSeries, this);

                this.config.series.models.forEach(this.addSeries, this);
            }
        },
        addOrRemoveSeries(series) {
            const yAxisId = this.series.get('yAxisId');
            if (yAxisId === this.id) {
                this.addSeries(series);
            } else {
                this.removeSeries(series);
            }
        },
        addSeries(series, index) {
            const yAxisId = series.get('yAxisId');
            const seriesIndex = this.seriesModels.findIndex(model => this.openmct.objects.areIdsEqual(model.get('identifier'), series.get('identifier')));

            if (yAxisId === this.id && seriesIndex < 0) {
                this.seriesModels.push(series);
                this.checkRangeValueAndSingleSeries();
                this.setUpYAxisOptions();
            }
        },
        removeSeries(plotSeries) {
            const seriesIndex = this.seriesModels.findIndex(model => this.openmct.objects.areIdsEqual(model.get('identifier'), plotSeries.get('identifier')));
            if (seriesIndex > -1) {
                this.seriesModels.splice(seriesIndex, 1);
                this.checkRangeValueAndSingleSeries();
                this.setUpYAxisOptions();
            }
        },
        checkRangeValueAndSingleSeries() {
            this.hasSameRangeValue = this.seriesModels.every((model) => {
                return model.get('yKey') === this.seriesModels[0].get('yKey');
            });
            this.singleSeries = this.seriesModels.length === 1;
        },
        setUpYAxisOptions() {
            this.yKeyOptions = [];
            if (!this.seriesModels.length) {
                return;
            }

            const seriesModel = this.seriesModels[0];
            if (seriesModel.metadata) {
                this.yKeyOptions = seriesModel.metadata
                    .valuesForHints(['range'])
                    .map(function (o) {
                        return {
                            name: o.name,
                            key: o.key
                        };
                    });
            }

            //  set yAxisLabel if none is set yet
            if (this.yAxisLabel === 'none') {
                let yKey = seriesModel.model.yKey;
                let yKeyModel = this.yKeyOptions.filter(o => o.key === yKey)[0];

                this.yAxisLabel = yKeyModel ? yKeyModel.name : '';
            }
        },
        toggleYAxisLabel() {
            let yAxisObject = this.yKeyOptions.filter(o => o.name === this.yAxisLabel)[0];

            if (yAxisObject) {
                this.$emit('yKeyChanged', yAxisObject.key, this.id);
                this.yAxis.set('label', this.yAxisLabel);
            }
        },
        onTickWidthChange(width) {
            this.$emit('tickWidthChanged', width);
        }
    }
};
</script>
