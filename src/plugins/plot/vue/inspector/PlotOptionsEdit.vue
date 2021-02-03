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
            <plot-options-editable-item :series="series" />
        </li>
    </ul>
    <div class="grid-properties"
         ng-show="!!config.series.models.length"
         ng-controller="PlotYAxisFormController"
         form-model="config.yAxis"
    >
        <ul class="l-inspector-part">
            <h2>Y Axis</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Manually override how the Y axis is labeled."
                >Label</div>
                <div class="grid-cell value"><input class="c-input--flex"
                                                    type="text"
                                                    ng-model="form.label"
                ></div>
            </li>
        </ul>
        <ul class="l-inspector-part">
            <h2>Y Axis Scaling</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Automatically scale the Y axis to keep all values in view."
                >Autoscale</div>
                <div class="grid-cell value"><input type="checkbox"
                                                    ng-model="form.autoscale"
                ></div>
            </li>
            <li class="grid-row"
                ng-show="form.autoscale"
            >
                <div class="grid-cell label"
                     title="Percentage of padding above and below plotted min and max values. 0.1, 1.0, etc."
                >
                    Padding</div>
                <div class="grid-cell value">
                    <input class="c-input--flex"
                           type="text"
                           ng-model="form.autoscalePadding"
                    >
                </div>
            </li>
        </ul>
        <ul class="l-inspector-part"
            ng-show="!form.autoscale"
        >
            <div class="grid-span-all form-error"
                 ng-show="!form.autoscale && validation.range"
            >
                {{ validation.range }}
            </div>
            <li class="grid-row force-border">
                <div class="grid-cell label"
                     title="Minimum Y axis value."
                >Minimum Value</div>
                <div class="grid-cell value">
                    <input class="c-input--flex"
                           type="number"
                           ng-model="form.range.min"
                    >
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Maximum Y axis value."
                >Maximum Value</div>
                <div class="grid-cell value"><input class="c-input--flex"
                                                    type="number"
                                                    ng-model="form.range.max"
                ></div>
            </li>
        </ul>
    </div>
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
import PlotOptionsEditableItem from "./PlotOptionsEditableItem.vue";
export default {
    components: {
        PlotOptionsEditableItem
    }
};
</script>
