/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
import EventTelmetryProvider from './EventTelemetryProvider';

export default function EventGeneratorPlugin(options) {
    return function install(openmct) {
        openmct.types.addType("example.eventGenerator", {
            name: "Event Message Generator",
            description: "For development use. Creates sample event message data that mimics a live data stream.",
            cssClass: "icon-generator-events",
            creatable: true,
            initialize: function (object) {
                object.telemetry = {
                    duration: 5
                };
            }
        });
        // openmct.telemetry.addProvider(new EventTelmetryProvider());
        const provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === 'eexample.eventGenerator';
            },
            subscribe: function (domainObject, callback) {
                const interval = setInterval(() => {
                    var datum = {
                        name: `foo-bar ${Date.now()}`,
                        utc: Date.now(),
                        value: Math.floor(Math.random() * 100)
                    };
                    datum.value = String(datum.value);
                    callback(datum);
                }, 1000);

                return function () {
                    clearInterval(interval);
                };
            }
        };

        openmct.telemetry.addProvider(provider);

    };
}
