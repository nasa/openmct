/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define([], function () {
    /**
     * A column showing utilization costs associated with activities.
     * @constructor
     * @param {string} key the key for the particular cost
     * @implements {platform/features/timeline.TimelineCSVColumn}
     */
    function UtilizationColumn(resource) {
        this.resource = resource;
    }

    UtilizationColumn.prototype.name = function () {
        var units = {
            "Kbps": "Kb",
            "watts": "watt-seconds"
        }[this.resource.units] || "unknown units";

        return this.resource.name + " (" + units + ")";
    };

    UtilizationColumn.prototype.value = function (domainObject) {
        var resource = this.resource;

        function getCost(utilization) {
            var seconds = (utilization.end - utilization.start) / 1000;
            return seconds * utilization.value;
        }

        function getUtilizationValue(utilizations) {
            utilizations = utilizations.filter(function (utilization) {
                return utilization.key === resource.key;
            });

            if (utilizations.length === 0) {
                return "";
            }

            return utilizations.map(getCost).reduce(function (a, b) {
                return a + b;
            }, 0);
        }

        return domainObject.hasCapability('utilization') ?
            domainObject.getCapability('utilization').internal()
                .then(getUtilizationValue) :
            "";
    };

    return UtilizationColumn;
});
