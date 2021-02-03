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
<div>
    <ul class="c-tree">
        <h2 title="Display properties for this object">Plot Series</h2>
        <li v-for="series in plotSeries"
            :key="series.key"
        >
            <series-form :series="series"
                         :form-model="'series'"
            />
        </li>
    </ul>
    <yAxis-form v-show="!!config.series.models.length"
                class="grid-properties"
                :form-model="'yAxis'"
    />
    <div class="grid-properties"
         ng-show="!!config.series.models.length"
    >
        <ul class="l-inspector-part"
            ng-controller="PlotLegendFormController"
            form-model="config.legend"
        >
            <h2 title="Legend options">Legend</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="The position of the legend relative to the plot display area."
                >Position</div>
                <div class="grid-cell value">
                    <select ng-model="form.position">
                        <option value="top">Top</option>
                        <option value="right">Right</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                    </select>
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Hide the legend when the plot is small"
                >Hide when plot small</div>
                <div class="grid-cell value"><input type="checkbox"
                                                    ng-model="form.hideLegendWhenSmall"
                ></div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Show the legend expanded by default"
                >Expand by default</div>
                <div class="grid-cell value"><input type="checkbox"
                                                    ng-model="form.expandByDefault"
                ></div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="What to display in the legend when it's collapsed."
                >When collapsed show</div>
                <div class="grid-cell value">
                    <select ng-model="form.valueToShowWhenCollapsed">
                        <option value="none">Nothing</option>
                        <option value="nearestTimestamp">Nearest timestamp</option>
                        <option value="nearestValue">Nearest value</option>
                        <option value="min">Minimum value</option>
                        <option value="max">Maximum value</option>
                        <option value="units">showUnitsWhenExpanded</option>
                    </select>
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="What to display in the legend when it's expanded."
                >When expanded show</div>
                <div class="grid-cell value">
                    <ul>
                        <li><input type="checkbox"
                                   ng-model="form.showTimestampWhenExpanded"
                        > Nearest timestamp</li>
                        <li><input type="checkbox"
                                   ng-model="form.showValueWhenExpanded"
                        > Nearest value</li>
                        <li><input type="checkbox"
                                   ng-model="form.showMinimumWhenExpanded"
                        > Minimum value</li>
                        <li><input type="checkbox"
                                   ng-model="form.showMaximumWhenExpanded"
                        > Maximum value</li>
                        <li><input type="checkbox"
                                   ng-model="form.showUnitsWhenExpanded"
                        > Units</li>
                    </ul>

                </div>
            </li>
        </ul>
    </div>
</div>
</template>
<script>
import SeriesForm from "@/plugins/plot/vue/inspector/forms/SeriesForm";
import eventHelpers from "@/plugins/plot/vue/single/lib/eventHelpers";
import configStore from "@/plugins/plot/vue/single/configuration/configStore";

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        SeriesForm
    },
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
    },
    beforeDestroy() {
        this.stopListening();
        this.unlisten();
    },
    methods: {
        getConfig() {
            this.configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            const config = configStore.get(this.configId);
            if (!config) {
                //TODO: Is this necessary?
                this.$nextTick(this.getConfig);

                return;
            }

            return config;
        },
        registerListeners() {
            this.updateDomainObject(this.config.get('domainObject'));
            this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject);

            this.listenTo(this.config.series, 'add', this.addSeries, this);
            this.listenTo(this.config.series, 'remove', this.resetAllSeries, this);

            this.config.series.forEach(this.addSeries, this);
        },

        updateDomainObject(domainObject) {
            this.domainObject = domainObject;
            this.formDomainObject = domainObject;
        },

        addSeries(series, index) {
            this.plotSeries[index] = series;
            series.locateOldObject(this.domainObject);
        },

        resetAllSeries() {
            this.plotSeries = [];
            this.config.series.forEach(this.addSeries, this);
        }
    }
};
</script>
