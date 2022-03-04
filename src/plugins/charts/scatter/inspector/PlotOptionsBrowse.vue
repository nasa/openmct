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
<div class="js-plot-options-browse grid-properties">
    <ul class="l-inspector-part">
        <h2 title="Y axis settings for this object">X Axis</h2>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="X axis selection."
            >X Axis</div>
            <div class="grid-cell value">{{ xKeyLabel }}</div>
        </li>
    </ul>
    <ul class="l-inspector-part">
        <h2 title="Y axis settings for this object">Y Axis</h2>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Y axis selection."
            >Y Axis</div>
            <div class="grid-cell value">{{ yKeyLabel }}</div>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            xKeyLabel: '',
            yKeyLabel: ''
        };
    },
    mounted() {
        this.plotSeries = [];
        this.composition = this.openmct.composition.get(this.domainObject);
        this.registerListeners();
        this.composition.load();
    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        registerListeners() {
            this.composition.on('add', this.addSeries);
            this.composition.on('remove', this.removeSeries);
            this.unobserve = this.openmct.objects.observe(this.domainObject, 'configuration.axes', this.setAxesLabels);
        },
        stopListening() {
            this.composition.off('add', this.addSeries);
            this.composition.off('remove', this.removeSeries);
            if (this.unobserve) {
                this.unobserve();
            }
        },
        addSeries(series, index) {
            this.$set(this.plotSeries, this.plotSeries.length, series);
            this.setAxesLabels();
        },
        removeSeries(series) {
            const index = this.plotSeries.find(plotSeries => this.openmct.objects.areIdsEqual(series.identifier, plotSeries.identifier));
            if (index !== undefined) {
                this.$delete(this.plotSeries, index);
                this.setAxesLabels();
            }
        },
        setAxesLabels() {
            let xKeyOptions = [];
            let yKeyOptions = [];
            this.plotSeries.forEach((series) => {
                const id = this.openmct.objects.makeKeyString(series.identifier);
                xKeyOptions.push({
                    name: series.name,
                    value: id
                });
                yKeyOptions.push({
                    name: series.name,
                    value: id
                });
            });
            if (this.plotSeries.length) {
                let xKeyOptionIndex;
                let yKeyOptionIndex;

                if (this.domainObject.configuration.axes.xKey) {
                    xKeyOptionIndex = xKeyOptions.findIndex(option => option.value === this.domainObject.configuration.axes.xKey);
                    if (xKeyOptionIndex > -1) {
                        this.xKeyLabel = xKeyOptions[xKeyOptionIndex].name;
                    }
                }

                if (this.plotSeries.length > 1 && this.domainObject.configuration.axes.yKey) {
                    yKeyOptionIndex = yKeyOptions.findIndex(option => option.value === this.domainObject.configuration.axes.yKey);
                    if (yKeyOptionIndex > -1) {
                        this.yKeyLabel = yKeyOptions[yKeyOptionIndex].name;
                    }
                }
            }
        }
    }
};
</script>
