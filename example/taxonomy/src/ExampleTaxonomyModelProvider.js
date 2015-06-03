/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    [],
    function () {
        "use strict";

        function ExampleTaxonomyModelProvider($q) {
            var models = {},
                packetId,
                telemetryId,
                i,
                j;

            // Add some "subsystems"
            for (i = 0; i < 3; i += 1) {
                packetId = "examplePacket" + i;

                models[packetId] = {
                    name: "Stub Subsystem " + (i + 1),
                    type: "telemetry.panel",
                    composition: []
                };

                // Add some "telemetry points"
                for (j = 0; j < 100 * (i + 1); j += 1) {
                    telemetryId = "exampleTelemetry" + j;
                    models[telemetryId] = {
                        name: "SWG" + i + "." + j,
                        type: "generator",
                        telemetry: {
                            period: 10 + i + j
                        }
                    };
                    models[packetId].composition.push(telemetryId);
                }
            }

            return {
                getModels: function () {
                    return $q.when(models);
                }
            };
        }

        return ExampleTaxonomyModelProvider;
    }
);