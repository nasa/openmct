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
/*global define,moment*/

/**
 * Module defining DomainColumn.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A column which will report telemetry domain values
         * (typically, timestamps.) Used by the ScrollingListController.
         *
         * @memberof platform/features/table
         * @constructor
         * @param domainMetadata an object with the machine- and human-
         *        readable names for this domain (in `key` and `name`
         *        fields, respectively.)
         * @param {TelemetryFormatter} telemetryFormatter the telemetry
         *        formatting service, for making values human-readable.
         */
        function DomainColumn(domainMetadata, telemetryFormatter) {
            this.domainMetadata = domainMetadata;
            this.telemetryFormatter = telemetryFormatter;
        }

        DomainColumn.prototype.getTitle = function () {
            return this.domainMetadata.name;
        };

        DomainColumn.prototype.getValue = function (domainObject, datum) {
            return {
                text: this.telemetryFormatter.formatDomainValue(
                    datum[this.domainMetadata.key],
                    this.domainMetadata.format
                )
            };
        };

        return DomainColumn;
    }
);
