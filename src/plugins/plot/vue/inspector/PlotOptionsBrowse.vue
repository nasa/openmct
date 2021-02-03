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
        <h2 title="Plot series display properties in this object">Plot Series</h2>
        <li v-for="series in config.series.models"
            :key="series.key"
        >
            <plot-options-item :series="series" />
        </li><!-- end repeat -->
    </ul>
    <div class="grid-properties">
        <ul class="l-inspector-part">
            <h2 title="Y axis settings for this object">Y Axis</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Manually override how the Y axis is labeled."
                >Label</div>
                <div class="grid-cell value">{{ config.yAxis.get('label') ? config.yAxis.get('label') : "Not defined" }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Automatically scale the Y axis to keep all values in view."
                >Autoscale</div>
                <div class="grid-cell value">
                    {{ config.yAxis.get('autoscale') ? "Enabled: " : "Disabled" }}
                    {{ config.yAxis.get('autoscale') ? (config.yAxis.get('autoscalePadding')) : "" }}
                </div>
            </li>
            <li v-if="!form.yAxis.autoscale"
                class="grid-row"
            >
                <div class="grid-cell label"
                     title="Minimum Y axis value."
                >Minimum value</div>
                <div class="grid-cell value">{{ config.yAxis.get('range').min }}</div>
            </li>
            <li v-if="!form.yAxis.autoscale"
                class="grid-row"
            >
                <div class="grid-cell label"
                     title="Maximum Y axis value."
                >Maximum value</div>
                <div class="grid-cell value">{{ config.yAxis.get('range').max }}</div>
            </li>
        </ul>
        <ul class="l-inspector-part">
            <h2 title="Legend settings for this object">Legend</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="The position of the legend relative to the plot display area."
                >Position</div>
                <div class="grid-cell value capitalize">{{ config.legend.get('position') }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Hide the legend when the plot is small"
                >Hide when plot small</div>
                <div class="grid-cell value">{{ config.legend.get('hideLegendWhenSmall') ? "Yes" : "No" }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Show the legend expanded by default"
                >Expand by Default</div>
                <div class="grid-cell value">{{ config.legend.get('expandByDefault') ? "Yes" : "No" }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="What to display in the legend when it's collapsed."
                >Show when collapsed:</div>
                <div class="grid-cell value">{{
                    config.legend.get('valueToShowWhenCollapsed').replace('nearest', '')
                }}
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="What to display in the legend when it's expanded."
                >Show when expanded:</div>
                <div class="grid-cell value comma-list">
                    <span v-if="config.legend.get('showTimestampWhenExpanded')">Timestamp</span>
                    <span v-if="config.legend.get('showValueWhenExpanded')">Value</span>
                    <span v-if="config.legend.get('showMinimumWhenExpanded')">Min</span>
                    <span v-if="config.legend.get('showMaximumWhenExpanded')">Max</span>
                    <span v-if="config.legend.get('showUnitsWhenExpanded')">Units</span>
                </div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import PlotOptionsItem from "./PlotOptionsItem.vue";
import configStore from "../single/configuration/configStore";
import eventHelpers from "../single/lib/eventHelpers";

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        PlotOptionsItem
    },
    data() {
        return {
            config: {}
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
        },

        updateDomainObject(domainObject) {
            this.domainObject = domainObject;
            this.formDomainObject = domainObject;
        }
    }
};
</script>
