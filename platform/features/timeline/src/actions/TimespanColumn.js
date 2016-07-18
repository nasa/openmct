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

define(['../TimelineFormatter'], function (TimelineFormatter) {

    var FORMATTER = new TimelineFormatter();

    /**
     * A column showing start or end times associated with a domain object.
     * @constructor
     * @param {boolean} isStart true if this column refers to the object's
     *        start time; false if it refers to the object's end time
     * @implements {platform/features/timeline.TimelineCSVColumn}
     */
    function TimespanColumn(isStart) {
        this.isStart = isStart;
    }

    TimespanColumn.prototype.name = function () {
        return this.isStart ? "Start" : "End";
    };

    TimespanColumn.prototype.value = function (domainObject) {
        var isStart = this.isStart;
        return domainObject.hasCapability('timespan') ?
            domainObject.useCapability('timespan').then(function (timespan) {
                return FORMATTER.format(
                    isStart ? timespan.getStart() : timespan.getEnd()
                );
            }) : "";
    };

    return TimespanColumn;
});
