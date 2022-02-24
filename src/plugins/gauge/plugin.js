/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    './gauge'
], function (
    Gauge
) {
    return function plugin() {
        return function install(openmct) {
            openmct.objectViews.addProvider(new Gauge(openmct));

            openmct.types.addType('gauge', {
                name: "Gauge",
                creatable: true,
                description: "Graphically visualize a telemetry element's current value between a minimum and maximum.",
                cssClass: 'icon-gauge',
                initialize(domainObject) {
                    domainObject.composition = [];
                    domainObject.configuration = {
                        min: 0,
                        max: 100,
                        displayMinMax: 'Yes',
                        limit: 90,
                        decimals: 1
                    };
                },
                form: [
                    {
                        name: "Minimum Value",
                        control: "numberfield",
                        cssClass: "l-input-sm l-numeric",
                        key: "min",
                        property: [
                            "configuration",
                            "min"
                        ]
                    },
                    {
                        name: "Maximum Value",
                        control: "numberfield",
                        cssClass: "l-input-sm l-numeric",
                        key: "max",
                        property: [
                            "configuration",
                            "max"
                        ]
                    },
                    {
                        name: "Display Min/Max",
                        control: "textfield",
                        cssClass: "l-input-sm",
                        key: "displayMinMax",
                        property: [
                            "configuration",
                            "displayMinMax"
                        ]
                    },
                    {
                        name: "Limit",
                        control: "numberfield",
                        cssClass: "l-input-sm l-numeric",
                        key: "min",
                        property: [
                            "configuration",
                            "limit"
                        ]
                    },
                    {
                        name: "Decimals",
                        control: "numberfield",
                        cssClass: "l-input-sm l-numeric",
                        key: "decimals",
                        property: [
                            "configuration",
                            "decimals"
                        ]
                    }
                ]
            });
        };
    };
});
