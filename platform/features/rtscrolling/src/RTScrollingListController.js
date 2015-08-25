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
/*global define,Promise*/

/**
 * Module defining ListController. Created by vwoeltje on 11/18/14.
 */
define(
    ["./NameColumn", "./DomainColumn", "./RangeColumn"],
    function (NameColumn, DomainColumn, RangeColumn) {
        "use strict";

        var ROW_COUNT = 100;

        /**
         * The RTScrollingListController is responsible for populating
         * the contents of the scrolling list view.
         * @memberof platform/features/rtscrolling
         * @constructor
         */
        function RTScrollingListController($scope, telemetryHandler, telemetryFormatter) {
            var handle,
                lastUpdated = {},
                lastIds = [],
                columns = [],
                headers = [],
                rows = [];

            function getTelemetryObjects() {
                return handle ? handle.getTelemetryObjects() : [];
            }

            function idsChanged(telemetryObjects) {
                function mismatch(id, index) {
                    return id !== telemetryObjects[index].getId();
                }

                return lastIds.length !== telemetryObjects.length ||
                        lastIds.some(mismatch);
            }

            function setupColumns(telemetryObjects) {
                var id = $scope.domainObject && $scope.domainObject.getId(),
                    firstId =
                        telemetryObjects[0] && telemetryObjects[0].getId();

                columns = [];

                if (telemetryObjects > 1 || id !== firstId) {
                    columns.push(new NameColumn());
                }
                columns.push(new DomainColumn(telemetryFormatter));
                columns.push(new RangeColumn());

                headers = columns.map(function (column) {
                    return column.getTitle();
                });
            }

            function updateObjects(telemetryObjects) {
                if (idsChanged(telemetryObjects)) {
                    setupColumns(telemetryObjects);
                    lastIds = telemetryObjects.map(function (telemetryObject) {
                        return telemetryObject.getId();
                    });
                }
            }

            function addRow(telemetryObject) {
                var id = telemetryObject.getId(),
                    domainValue = handle.getDomainValue(telemetryObject);
                if (lastUpdated[id] !== domainValue &&
                        domainValue !== undefined) {
                    rows.unshift(columns.map(function (column) {
                        return column.getValue(telemetryObject, handle);
                    }));
                    rows.splice(ROW_COUNT, Number.MAX_VALUE);
                    lastUpdated[id] = domainValue;
                }
            }

            function updateValues() {
                getTelemetryObjects().forEach(addRow);
            }

            function releaseSubscription() {
                if (handle) {
                    handle.unsubscribe();
                }
            }

            function makeSubscription(domainObject) {
                releaseSubscription();
                rows = [];
                handle = telemetryHandler.handle(
                    domainObject,
                    updateValues,
                    true
                );
            }

            $scope.$on("$destroy", releaseSubscription);

            $scope.$watch("domainObject", makeSubscription);
            $scope.$watch(getTelemetryObjects, updateObjects);

            return {
                rows: function () {
                    return rows;
                },
                headers: function () {
                    return headers;
                }
            };
        }

        return RTScrollingListController;
    }
);

