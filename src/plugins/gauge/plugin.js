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

import Gauge from './Gauge';
import GaugeFormController from './components/GaugeFormController.vue';
import Vue from 'vue';

export const GAUGE_TYPES = [
    ['Filled Dial', 'dial-filled'],
    ['Needle Dial', 'dial-needle'],
    ['Vertical Meter', 'meter-vertical'],
    ['Horizontal Meter', 'meter-horz']
];

export default function () {
    return function install(openmct) {
        openmct.objectViews.addProvider(new Gauge(openmct));

        openmct.forms.addNewFormControl('gauge-controller', getGaugeFormController());
        openmct.types.addType('gauge', {
            name: "Gauge",
            creatable: true,
            description: "Graphically visualize a telemetry element's current value between a minimum and maximum.",
            cssClass: 'icon-gauge',
            initialize(domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    gaugeController: {
                        gaugeType: GAUGE_TYPES[0],
                        isDisplayMinMax: true,
                        isUseTelemetryLimits: false,
                        limit: 90,
                        max: 100,
                        min: 0,
                        precision: 2
                    }
                };
            },
            form: [
                {
                    name: "Guage Controls",
                    control: "gauge-controller",
                    cssClass: "l-input-sm",
                    key: "gaugeController",
                    property: [
                        "configuration",
                        "gaugeController"
                    ]
                }
            ]
        });
    };

    function getGaugeFormController() {
        return {
            show(element, model, onChange) {
                const rowComponent = new Vue({
                    el: element,
                    components: {
                        GaugeFormController
                    },
                    provide: {
                        openmct: self.openmct
                    },
                    data() {
                        return {
                            model,
                            onChange
                        };
                    },
                    template: `<GaugeFormController :model="model" @onChange="onChange"></GaugeFormController>`
                });

                return rowComponent;
            }
        };
    }
}
