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
 * Module defining DomainColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A column which will report telemetry domain values
         * (typically, timestamps.) Used by the ScrollingListController.
         *
         * @memberof platform/features/rtscrolling
         * @constructor
         * @param domainMetadata an object with the machine- and human-
         *        readable names for this domain (in `key` and `name`
         *        fields, respectively.)
         * @param {TelemetryFormatter} telemetryFormatter the telemetry
         *        formatting service, for making values human-readable.
         */
        function DomainColumn(telemetryFormatter) {
            return {
                /**
                 * Get the title to display in this column's header.
                 * @returns {string} the title to display
                 * @memberof platform/features/rtscrolling.DomainColumn#
                 */
                getTitle: function () {
                    return "Time";
                },
                /**
                 * Get the text to display inside a row under this
                 * column.
                 * @returns {string} the text to display
                 * @memberof platform/features/rtscrolling.DomainColumn#
                 */
                getValue: function (domainObject, handle) {
                    return {
                        text: telemetryFormatter.formatDomainValue(
                            handle.getDomainValue(domainObject)
                        )
                    };
                }
            };
        }

        return DomainColumn;
    }
);

