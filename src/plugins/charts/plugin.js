/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import { BAR_GRAPH_KEY } from './BarGraphConstants';
import { SCATTER_PLOT_KEY } from './scatter/ScatterPlotConstants.js';
import BarGraphViewProvider from './BarGraphViewProvider';
import ScatterPlotViewProvider from './scatter/ScatterPlotViewProvider';
import BarGraphInspectorViewProvider from './inspector/BarGraphInspectorViewProvider';
import ScatterPlotInspectorViewProvider from './scatter/inspector/ScatterPlotInspectorViewProvider';
import BarGraphCompositionPolicy from './BarGraphCompositionPolicy';
import ScatterPlotCompositionPolicy from './scatter/ScatterPlotCompositionPolicy';

export default function () {
    return function install(openmct) {
        openmct.types.addType(BAR_GRAPH_KEY, {
            key: BAR_GRAPH_KEY,
            name: "Bar Graph",
            cssClass: "icon-bar-chart",
            description: "View data as a bar graph. Can be added to Display Layouts.",
            creatable: true,
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    barStyles: { series: {} }
                };
            },
            priority: 891
        });

        openmct.types.addType(SCATTER_PLOT_KEY, {
            key: SCATTER_PLOT_KEY,
            name: "X-Y Plot",
            cssClass: "icon-plot",
            description: "View data as a scatter plot. Can be added to Display Layouts.",
            creatable: true,
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    styles: {},
                    axes: {}
                };
            },
            form: [
                {
                    name: 'Upload Underlay data (JSON File)',
                    key: 'selectFile',
                    control: 'file-input',
                    text: 'Select File...',
                    type: 'application/json',
                    property: [
                        "selectFile"
                    ]
                },
                {
                    name: "Minimum Y Axis value",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    required: true,
                    property: [
                        "configuration",
                        "rangeMin"
                    ]
                },
                {
                    name: "Maximum Y Axis value",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    required: true,
                    property: [
                        "configuration",
                        "rangeMax"
                    ]
                },
                {
                    name: "Minimum X Axis value",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    required: true,
                    property: [
                        "configuration",
                        "domainMin"
                    ]
                },
                {
                    name: "Maximum X Axis value",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    required: true,
                    property: [
                        "configuration",
                        "domainMax"
                    ]
                }
            ],
            priority: 891
        });

        openmct.objectViews.addProvider(new BarGraphViewProvider(openmct));
        openmct.objectViews.addProvider(new ScatterPlotViewProvider(openmct));

        openmct.inspectorViews.addProvider(new BarGraphInspectorViewProvider(openmct));
        openmct.inspectorViews.addProvider(new ScatterPlotInspectorViewProvider(openmct));

        openmct.composition.addPolicy(new BarGraphCompositionPolicy(openmct).allow);
        openmct.composition.addPolicy(new ScatterPlotCompositionPolicy(openmct).allow);
    };
}

