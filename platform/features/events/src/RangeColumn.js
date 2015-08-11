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
 * Module defining DomainColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A column which will report telemetry range values
         * (typically, measurements.) Used by the ScrollingListController.
         *
         * @memberof platform/features/events
         * @constructor
         * @implements {platform/features/events.EventsColumn}
         * @param rangeMetadata an object with the machine- and human-
         *        readable names for this range (in `key` and `name`
         *        fields, respectively.)
         * @param {TelemetryFormatter} telemetryFormatter the telemetry
         *        formatting service, for making values human-readable.
         */
        function RangeColumn(rangeMetadata, telemetryFormatter) {
            this.rangeMetadata = rangeMetadata;
            this.telemetryFormatter = telemetryFormatter;
        }

        RangeColumn.prototype.getTitle = function () {
            return this.rangeMetadata.name;
        };
        RangeColumn.prototype.getValue = function (domainObject, data, index) {
            var rangeKey = this.rangeMetadata.key;
            return this.telemetryFormatter.formatRangeValue(
                data.getRangeValue(index, rangeKey)
            );
        };

        return RangeColumn;
    }
);
