<template>
    <multipane class="c-inspector"
               type="vertical">
        <pane class="c-inspector__properties">



            <!-- Static markup from old Open START -->

            <div class="l-grid-properties">
                <ul class="l-inspector-part l-grid-properties__section">
                    <h2 class="first u-first">Properties</h2>
                    <li class="t-repeat grid-row l-grid-properties__row first">
                        <div class="grid-cell label l-grid-properties__label">Title</div>
                        <div class="grid-cell value l-grid-properties__value">CH Overlay Plot</div>
                    </li>
                    <li class="t-repeat grid-row l-grid-properties__row">
                        <div class="grid-cell label l-grid-properties__label">Updated</div>
                        <div class="grid-cell value l-grid-properties__value">2018-06-29 17:38:36 UTC</div>
                    </li>
                    <li class="t-repeat grid-row l-grid-properties__row">
                        <div class="grid-cell label l-grid-properties__label">Type</div>
                        <div class="grid-cell value l-grid-properties__value">Overlay Plot</div>
                    </li>
                </ul>

                <ul class="l-inspector-part l-grid-properties__section">
                    <h2 title="The location of this linked object.">Location</h2>
                    <li class="grid-row l-grid-properties__row">
                        <!-- ngIf: primaryParents.length > 0 -->
                        <div class="grid-cell value l-grid-properties__value">
                            <!-- ngRepeat: parent in contextutalParents --><div class="t-repeat inspector-location" ng-repeat="parent in contextutalParents" ng-class="{ last:($index + 1) === contextualParents.length }">
                            <mct-representation key="'label'" mct-object="parent" ng-click="parent.getCapability('action').perform('navigate')" class="location-item ng-isolate-scope" draggable="true">
                                <div class="t-object-label l-flex-row flex-elem grows">
                                    <div class="t-item-icon flex-elem  icon-folder" ng-class="{ 'l-icon-link':location.isLink() }"></div>
                                    <div class="t-title-label flex-elem grows">My Items</div>
                                </div>
                            </mct-representation>
                        </div><!-- end ngRepeat: parent in contextutalParents -->
                        </div>
                    </li>
                </ul>
            </div>
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            

            <!-- ngIf: !controller.hasProviderView() --><div ng-if="!controller.hasProviderView()" class="ng-scope">
            <mct-representation key="inspectorKey" mct-object="controller.selectedItem()" ng-model="ngModel" class="ng-pristine ng-untouched ng-valid ng-isolate-scope">
                <!-- ngIf: domainObject.getCapability('editor').inEditContext() -->
                <!-- ngIf: !domainObject.getCapability('editor').inEditContext() --><div ng-if="!domainObject.getCapability('editor').inEditContext()" class="ng-scope">
                <mct-representation key="'plot-options-browse'" mct-object="domainObject" class="ng-isolate-scope">
                    <div ng-controller="PlotOptionsController" class="ng-scope">
                        <ul class="tree">
                            <h2 title="Plot series display properties in this object">Plot Series</h2>
                            <!-- ngRepeat: series in config.series.models --><li ng-repeat="series in config.series.models" class="ng-scope">
            <span class="tree-item menus-to-left">
                <span class="ui-symbol view-control flex-elem" ng-class="{ expanded: series.expanded }" ng-click="series.expanded = !series.expanded">
                </span>
                <mct-representation class="rep-object-label ng-isolate-scope" key="'label'" mct-object="series.oldObject" draggable="true"><!--
 Open MCT, Copyright (c) 2014-2018, United States Government
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
<div class="t-object-label l-flex-row flex-elem grows">
    <div class="t-item-icon flex-elem  icon-telemetry l-icon-link" ng-class="{ 'l-icon-link':location.isLink() }"></div>
    <div class="t-title-label flex-elem grows">CH SWG 100</div>
</div>
</mct-representation>
            </span>
                            <ul class="grid-properties ng-hide" ng-show="series.expanded">
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The field to be plotted as a value for this series.">Value</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        sin
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The line rendering style for this series.">Line Style</div>
                                    <div class="grid-cell value l-grid-properties__value">Linear interpolation
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="Whether markers are displayed, and their size.">Markers</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        Enabled: 2px
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="Display markers visually denoting points in alarm.">Alarm Markers</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        Enabled
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The plot line and marker color for this series.">Color</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        <!-- TODO: get this into a class -->
                                        <span class="color-swatch" ng-style="{
                                  'background': series.get('color').asHexString(),
                                  'display': 'inline-block',
                                  'border': '1px solid rgba(255, 255, 255, 0.2)',
                                  'height': '10px',
                                  'width': '10px',
                                  'vertical-align': 'middle',
                                  'margin-left': '3px',
                                  'margin-top': -'2px'
                               }" style="background: rgb(32, 178, 170); display: inline-block; border: 1px solid rgba(255, 255, 255, 0.2); height: 10px; width: 10px; vertical-align: middle; margin-left: 3px;">
                         </span>
                                    </div>
                                </li>
                            </ul>
                        </li><!-- end ngRepeat: series in config.series.models --><li ng-repeat="series in config.series.models" class="ng-scope">
            <span class="tree-item menus-to-left">
                <span class="ui-symbol view-control flex-elem" ng-class="{ expanded: series.expanded }" ng-click="series.expanded = !series.expanded">
                </span>
                <mct-representation class="rep-object-label ng-isolate-scope" key="'label'" mct-object="series.oldObject" draggable="true"><!--
 Open MCT, Copyright (c) 2014-2018, United States Government
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
<div class="t-object-label l-flex-row flex-elem grows">
    <div class="t-item-icon flex-elem  icon-telemetry" ng-class="{ 'l-icon-link':location.isLink() }"></div>
    <div class="t-title-label flex-elem grows">Original SG in Plot</div>
</div>
</mct-representation>
            </span>
                            <ul class="grid-properties ng-hide" ng-show="series.expanded">
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The field to be plotted as a value for this series.">Value</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        value
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The line rendering style for this series.">Line Style</div>
                                    <div class="grid-cell value l-grid-properties__value">Linear interpolation
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="Whether markers are displayed, and their size.">Markers</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        Enabled: 2px
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="Display markers visually denoting points in alarm.">Alarm Markers</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        Enabled
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The plot line and marker color for this series.">Color</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        <!-- TODO: get this into a class -->
                                        <span class="color-swatch" ng-style="{
                                  'background': series.get('color').asHexString(),
                                  'display': 'inline-block',
                                  'border': '1px solid rgba(255, 255, 255, 0.2)',
                                  'height': '10px',
                                  'width': '10px',
                                  'vertical-align': 'middle',
                                  'margin-left': '3px',
                                  'margin-top': -'2px'
                               }" style="background: rgb(154, 205, 50); display: inline-block; border: 1px solid rgba(255, 255, 255, 0.2); height: 10px; width: 10px; vertical-align: middle; margin-left: 3px;">
                         </span>
                                    </div>
                                </li>
                            </ul>
                        </li><!-- end ngRepeat: series in config.series.models --><!-- end repeat -->
                        </ul>
                        <div class="grid-properties">
                            <ul class="l-inspector-part l-grid-properties__section">
                                <h2 title="Y axis settings for this object">Y Axis</h2>
                                <li class="grid-row">
                                    <div class="grid-cell label l-grid-properties__label" title="Manually override how the Y axis is labeled.">Label</div>
                                    <div class="grid-cell value l-grid-properties__value">Foobar</div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="Automatically scale the Y axis to keep all values in view.">Autoscale</div>
                                    <div class="grid-cell value l-grid-properties__value">
                                        Enabled:
                                        0.1
                                    </div>
                                </li>
                                <!-- ngIf: !form.yAxis.autoscale --><li class="grid-row l-grid-properties__row" ng-if="!form.yAxis.autoscale">
                                <div class="grid-cell label l-grid-properties__label" title="Minimum Y axis value.">Minimum value</div>
                                <div class="grid-cell value l-grid-properties__value">-10</div>
                            </li><!-- end ngIf: !form.yAxis.autoscale -->
                                <!-- ngIf: !form.yAxis.autoscale --><li class="grid-row l-grid-properties__row" ng-if="!form.yAxis.autoscale">
                                <div class="grid-cell label l-grid-properties__label" title="Maximum Y axis value.">Maximum value</div>
                                <div class="grid-cell value l-grid-properties__value">11</div>
                            </li><!-- end ngIf: !form.yAxis.autoscale -->
                            </ul>
                            <ul class="l-inspector-part l-grid-properties__section">
                                <h2 title="Legend settings for this object">Legend</h2>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="The position of the legend relative to the plot display area.">Position</div>
                                    <div class="grid-cell value l-grid-properties__value capitalize">top</div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="Show the legend expanded by default">Expand by Default</div>
                                    <div class="grid-cell value l-grid-properties__value">No</div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="What to display in the legend when it's collapsed.">Show when collapsed:</div>
                                    <div class="grid-cell value l-grid-properties__value">Value
                                    </div>
                                </li>
                                <li class="grid-row l-grid-properties__row">
                                    <div class="grid-cell label l-grid-properties__label" title="What to display in the legend when it's expanded.">Show when expanded:</div>
                                    <div class="grid-cell value l-grid-properties__value comma-list">
                                        <!-- ngIf: config.legend.get('showTimestampWhenExpanded') --><span ng-if="config.legend.get('showTimestampWhenExpanded')" class="ng-scope">Timestamp</span><!-- end ngIf: config.legend.get('showTimestampWhenExpanded') -->
                                        <!-- ngIf: config.legend.get('showValueWhenExpanded') --><span ng-if="config.legend.get('showValueWhenExpanded')" class="ng-scope">Value</span><!-- end ngIf: config.legend.get('showValueWhenExpanded') -->
                                        <!-- ngIf: config.legend.get('showMinimumWhenExpanded') --><span ng-if="config.legend.get('showMinimumWhenExpanded')" class="ng-scope">Min</span><!-- end ngIf: config.legend.get('showMinimumWhenExpanded') -->
                                        <!-- ngIf: config.legend.get('showMaximumWhenExpanded') --><span ng-if="config.legend.get('showMaximumWhenExpanded')" class="ng-scope">Max</span><!-- end ngIf: config.legend.get('showMaximumWhenExpanded') -->
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </mct-representation>
            </div><!-- end ngIf: !domainObject.getCapability('editor').inEditContext() -->
            </mct-representation>
        </div><!-- end ngIf: !controller.hasProviderView() -->




            <!-- Static markup from old Open END -->

        </pane>
        <pane class="l-pane c-inspector__elements"
              splitter="before">
            c-inspector-elements
        </pane>
    </multipane>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    @mixin grid-two-column() {
        display: grid;
        grid-row-gap: 0;
        grid-template-columns: 1fr 2fr;
        align-items: start;
    }

    @mixin grid-two-column-span-cols() {
        grid-column: 1 / 3;
    }

    /******************************* INSPECTOR */
    .c-inspector {
        display: flex;
        flex-flow: column nowrap;
        height: 100%;

        > [class*="__"] {
            min-height: 50px;
            padding: $interiorMarginLg;
        }

        &__properties {
            flex: 1 1 auto;
        }

        &__elements {
            height: 25%;
            flex: 0 1 auto;
        }

        .l-inspector-part {
            display: contents;
        }

        .grid-properties {
            .label {
                color: $colorInspectorPropName;
            }
            .value {
                color: $colorInspectorPropVal;
                word-break: break-all;
                &:first-child {
                    // If there is no preceding .label element, make value span columns
                    @include grid-two-column-span-cols;
                }
            }
        }
    }

    /******************************* PROPERTIES GRID */

    .grid-elem {
        &:not(:first-child) {
            border-top: 1px solid $colorInteriorBorder;
        }
        &.label {
            background-color: rgba(0,0,128,0.2);
        }
        &.value {
            background-color: rgba(0,128,0,0.2);
        }
    }

    // Properties grids
    .l-grid-properties {
        @include grid-two-column;


        h2 {
            // Headers for .l-inspector-part elements
            @include grid-two-column-span-cols;
            border-radius: $controlCr;
            background-color: $colorInspectorSectionHeaderBg;
            color: $colorInspectorSectionHeaderFg;
            font-size: 0.9rem;
            font-weight: normal;
            margin: $interiorMarginLg 0 $interiorMarginSm 0;
            padding: $interiorMarginSm $interiorMargin;
            text-transform: uppercase;

            &.first {
                margin-top: 0;
            }
        }
    }

    .grid-row {
        display: contents;
    }

    .grid-span-all {
        @include grid-two-column-span-cols;
    }

    .grid-row {
        .grid-cell {
            padding: 3px $interiorMarginLg 3px 0;
            &[title] {
                // When a cell has a title, assume it's helpful text
                cursor: help;
            }
        }
        &.force-border,
        &:not(:first-of-type) {
            // Row borders, effected via border-top on child elements of the row
            .grid-cell {
                border-top: 1px solid $colorInspectorSectionHeaderBg;
            }
        }
    }


</style>

<script>
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';
    export default {
        components: {
            multipane,
            pane
        }
    }
</script>
