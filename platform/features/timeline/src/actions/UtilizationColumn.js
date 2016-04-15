/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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

define([], function () {
    "use strict";

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
        return this.resource.name;
    };

    UtilizationColumn.prototype.value = function (domainObject) {
        var resource = this.resource;

        function getUtilizationValue(utilizations) {
            utilizations = utilizations.filter(function (utilization) {
                return key === resource.key;
            });
            return utilizations.length === 1 ? utilizations[0].value : "";
        }

        return !domainObject.hasCapability('utilization') ?
            "" :
            domainObject.getCapability('utilization').internal()
                .then(getUtilizationValue);
    };

    return UtilizationColumn;
});
