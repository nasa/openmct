/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define(['lodash'], function (_) {
    // Parameter names in query string
    var SEARCH = {
        MODE: 'tc.mode',
        TIME_SYSTEM: 'tc.timeSystem',
        START_BOUND: 'tc.startBound',
        END_BOUND: 'tc.endBound',
        START_DELTA: 'tc.startDelta',
        END_DELTA: 'tc.endDelta'
    };

    function TimeConductorURLHandler(tcViewService) {
        this.tcViewService = tcViewService;
    }

    TimeConductorURLHandler.prototype.updateParams = function () {

    };

    TimeConductorURLHandler.prototype.updateView = function (searchParams) {
        if (searchParams[SEARCH.MODE] !== undefined) {
            // TODO: How to communicate this to/from TC?
        }

        if (searchParams[SEARCH.TIME_SYSTEM] !== undefined) {
            // TODO: Update time system
        }

        var hasDelta =
            _.isFinite(searchParams[SEARCH.START_DELTA]) &&
            _.isFinite(searchParams[SEARCH.END_DELTA]);
        if (hasDelta) {
            // TODO Update delta
        }

        var hasBounds =
            _.isFinite(searchParams[SEARCH.START_BOUNDS]) &&
            _.isFinite(searchParams[SEARCH.END_BOUNDS]);
        if (hasDelta) {
            // TODO Update bounds
        }
    };

    return TimeConductorURLHandler;
});
