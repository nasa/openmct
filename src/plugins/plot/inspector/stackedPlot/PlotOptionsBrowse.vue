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
    class="js-plot-options-browse"
>
    <ul
        class="c-tree"
    >
        <h2 title="Plot series display properties in this object">Plot Series</h2>
        <plot-options-item
            v-for="series in plotSeries"
            :key="series.key"
            :series="series"
        />
    </ul>
    <div
        v-if="plotSeries.length"
        class="grid-properties"
    >
        <ul
            class="l-inspector-part"
        >
            <h2 title="Y axis settings for this object">Y Axis</h2>
            <li class="grid-row">
                <div
                    class="grid-cell label"
                    title="Manually override how the Y axis is labeled."
                >Label</div>
                <div class="grid-cell value">{{ label ? label : "Not defined" }}</div>
            </li>
            <li class="grid-row">
                <div
                    class="grid-cell label"
                    title="Enable log mode."
                >Log mode</div>
                <div class="grid-cell value">
                    {{ logMode ? "Enabled" : "Disabled" }}
                </div>
            </li>
            <li class="grid-row">
                <div
                    class="grid-cell label"
                    title="Automatically scale the Y axis to keep all values in view."
                >Auto scale</div>
                <div class="grid-cell value">
                    {{ autoscale ? "Enabled: " + autoscalePadding : "Disabled" }}
                </div>
            </li>
            <li
                v-if="!autoscale && rangeMin"
                class="grid-row"
            >
                <div
                    class="grid-cell label"
                    title="Minimum Y axis value."
                >Minimum value</div>
                <div class="grid-cell value">{{ rangeMin }}</div>
            </li>
            <li
                v-if="!autoscale && rangeMax"
                class="grid-row"
            >
                <div
                    class="grid-cell label"
                    title="Maximum Y axis value."
                >Maximum value</div>
                <div class="grid-cell value">{{ rangeMax }}</div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import PlotOptionsItem from "../PlotOptionsItem.vue";
import configStore from "../../configuration/ConfigStore";
import eventHelpers from "../../lib/eventHelpers";

export default {
    components: {
        PlotOptionsItem
    },
    inject: ['openmct', 'domainObject', 'path'],
    data() {
        return {
            config: {},
            label: '',
            autoscale: '',
            logMode: false,
            autoscalePadding: '',
            rangeMin: '',
            rangeMax: '',
            position: '',
            loaded: false,
            plotSeries: []
        };
    },
    mounted() {
        eventHelpers.extend(this);
        this.config = this.getConfig();
        this.registerListeners();
        this.initConfiguration();
        this.loaded = true;

    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        initConfiguration() {
            this.label = this.config.yAxis.get('label');
            this.autoscale = this.config.yAxis.get('autoscale');
            this.logMode = this.config.yAxis.get('logMode');
            this.autoscalePadding = this.config.yAxis.get('autoscalePadding');
            const range = this.config.yAxis.get('range');
            if (range) {
                this.rangeMin = range.min;
                this.rangeMax = range.max;
            }
        },
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
            this.initConfiguration();
        },

        resetAllSeries() {
            this.plotSeries = [];
            this.config.series.forEach(this.addSeries, this);
        }
    }
};
</script>
