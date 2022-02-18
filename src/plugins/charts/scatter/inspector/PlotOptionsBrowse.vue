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
<div v-if="loaded"
     class="js-plot-options-browse"
>
    <ul class="c-tree">
        <h2 title="Plot series display properties in this object">Plot Series</h2>
        <plot-options-item v-for="series in plotSeries"
                           :key="series.key"
                           :series="series"
        />
    </ul>
    <div v-if="plotSeries.length"
         class="grid-properties"
    >
        <ul class="l-inspector-part">
            <h2 title="Y axis settings for this object">X and Y Axes</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="X and Y axes selections."
                >Label</div>
                <div class="grid-cell value">TO DO</div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import PlotOptionsItem from "./PlotOptionsItem.vue";
import eventHelpers from "../lib/eventHelpers";

export default {
    components: {
        PlotOptionsItem
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            config: {},
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
        },
        getConfig() {
            return {};
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
