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
/*global define,Float32Array*/

/**
 * Prepares data to be rendered in a GL Plot. Handles
 * the conversion from data API to displayable buffers.
 */
define(
    [],
    function () {
        'use strict';

        var MAX_POINTS = 86400,
            INITIAL_SIZE = 675; // 1/128 of MAX_POINTS

        /**
         * @memberof platform/features/plot
         * @constructor
         * @param {TelemetryHandle} handle the handle to telemetry access
         * @param {string} range the key to use when looking up range values
         */
        function PlotLimitTracker(handle, range) {
            var legendClasses = {};

            function updateLimit(telemetryObject) {
                var limit = telemetryObject.getCapability('limit'),
                    datum = handle.getDatum(telemetryObject);

                if (limit && datum) {
                    legendClasses[telemetryObject.getId()] =
                        (limit.evaluate(datum, range) || {}).cssClass;
                }
            }

            return {
                update: function () {
                    legendClasses = {};
                    handle.getTelemetryObjects().forEach(updateLimit);
                },
                getLegendClass: function (domainObject) {
                    var id = domainObject && domainObject.getId();
                    return id && legendClasses[id];
                }
            };
        }

        return PlotLimitTracker;

    }
);
