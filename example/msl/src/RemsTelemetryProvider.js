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
/*global define */
define (
    ['./RemsTelemetrySeries'],
    function (RemsTelemetrySeries) {
        "use strict";

        var SOURCE = "rems.source";

        function RemsTelemetryProvider(adapter, $q){
            /*
             Filters requests for telemetry so that it only handles requests for
             this source
             */
            function matchesSource(request) {
                return (request.source === SOURCE);
            }

            return {
                requestTelemetry: function(requests) {
                    var packaged = {},
                        relevantReqs = requests.filter(matchesSource);

                    function addToPackage(history) {
                        packaged[SOURCE][history.id] =
                            new RemsTelemetrySeries(history.value);
                    }

                    function handleRequest(request) {
                        var key = request.key;
                        return adapter.history(key).then(addToPackage);
                    }
                    packaged[SOURCE] = {};
                    return $q.all(relevantReqs.map(handleRequest))
                        .then(function () {
                            return packaged;
                        });
                },
                subscribe: function (callback, requests) {
                    return function() {};
                },
                unsubscribe: function (callback, requests) {
                    return function() {};
                }
            }

        }

        return RemsTelemetryProvider;
    }
);