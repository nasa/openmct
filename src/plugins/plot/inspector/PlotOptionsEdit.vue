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
    class="js-plot-options-edit"
>
    <ul
        v-if="!isStackedPlotObject"
        class="c-tree"
    >
        <h2 title="Display properties for this object">Plot Series</h2>
        <li
            v-for="series in plotSeries"
            :key="series.key"
        >
            <series-form
                :series="series"
                @seriesUpdated="updateSeriesConfigForObject"
            />
        </li>
    </ul>
    <y-axis-form
        v-if="plotSeries.length && !isStackedPlotObject"
        class="grid-properties"
        :y-axis="config.yAxis"
        @seriesUpdated="updateSeriesConfigForObject"
    />
    <ul
        v-if="isStackedPlotObject || !isStackedPlotNestedObject"
        class="l-inspector-part"
    >
        <h2 title="Legend options">Legend</h2>
        <legend-form
            v-if="plotSeries.length"
            class="grid-properties"
            :legend="config.legend"
        />
    </ul>
</div>
</template>
<script>
import SeriesForm from "./forms/SeriesForm.vue";
import YAxisForm from "./forms/YAxisForm.vue";
import LegendForm from "./forms/LegendForm.vue";
import eventHelpers from "../lib/eventHelpers";
import configStore from "../configuration/ConfigStore";

export default {
    components: {
        LegendForm,
        SeriesForm,
        YAxisForm
    },
    inject: ['openmct', 'domainObject', 'path'],
    data() {
        return {
            config: {},
            plotSeries: [],
            loaded: false
        };
    },
    computed: {
        isStackedPlotNestedObject() {
            return this.path.find((pathObject, pathObjIndex) => pathObjIndex > 0 && pathObject.type === 'telemetry.plot.stacked');
        },
        isStackedPlotObject() {
            return this.path.find((pathObject, pathObjIndex) => pathObjIndex === 0 && pathObject.type === 'telemetry.plot.stacked');
        }
    },
    mounted() {
        eventHelpers.extend(this);
        this.config = this.getConfig();
        this.registerListeners();
        this.loaded = true;
    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        getConfig() {
            this.configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            return configStore.get(this.configId);
        },
        registerListeners() {
            this.config.series.forEach(this.addSeries, this);

            this.listenTo(this.config.series, 'add', this.addSeries, this);
            this.listenTo(this.config.series, 'remove', this.resetAllSeries, this);
        },

        addSeries(series, index) {
            this.$set(this.plotSeries, index, series);
        },

        resetAllSeries() {
            this.plotSeries = [];
            this.config.series.forEach(this.addSeries, this);
        },

        updateSeriesConfigForObject(config) {
            const stackedPlotObject = this.path.find((pathObject) => pathObject.type === 'telemetry.plot.stacked');
            let index = stackedPlotObject.configuration.series.findIndex((seriesConfig) => {
                return this.openmct.objects.areIdsEqual(seriesConfig.identifier, config.identifier);
            });
            if (index < 0) {
                index = stackedPlotObject.configuration.series.length;
            }

            const configPath = `configuration.series[${index}].${config.path}`;
            this.openmct.objects.mutate(
                stackedPlotObject,
                configPath,
                config.value
            );

        }
    }
};
</script>
