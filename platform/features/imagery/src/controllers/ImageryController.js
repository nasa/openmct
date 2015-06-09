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

        function ImageryController($scope, telemetryHandler, telemetryFormatter) {
            var timestamp = "",
                imageUrl = "",
                handle;

            function releaseSubscription() {
                if (handle) {
                    handle.unsubscribe();
                    handle = undefined;
                }
            }

            function updateValues() {
                var imageObject = handle && handle.getTelemetryObjects()[0];
                if (imageObject) {
                    timestamp = telemetryFormatter.formatDomainValue(
                        handle.getDomainValue(imageObject)
                    );
                    imageUrl = handle.getRangeValue(imageObject);
                }
            }

            // Create a new subscription; telemetrySubscriber gets
            // to do the meaningful work here.
            function subscribe(domainObject) {
                releaseSubscription();
                timestamp = "";
                imageUrl = "";
                handle = domainObject && telemetryHandler.handle(
                    domainObject,
                    updateValues,
                    true // Lossless
                );
            }

            // Subscribe to telemetry when a domain object becomes available
            $scope.$watch('domainObject', subscribe);

            // Unsubscribe when the plot is destroyed
            $scope.$on("$destroy", releaseSubscription);

            return {
                getTimestamp: function () {
                    return timestamp;
                },
                getImageUrl: function () {
                    return imageUrl;
                }
            };
        }

        return ImageryController;
    }
);
