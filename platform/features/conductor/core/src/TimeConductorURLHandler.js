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

    /**
     * Communicates settings from the URL to the time conductor,
     * and vice versa.
     */
    function TimeConductorURLHandler(tcService) {
        this.tcService = tcService;
    }

    TimeConductorURLHandler.prototype.updateParams = function () {
        var mode = this.tcService.mode();
        var timeSystem = this.tcService.timeSystem();
        var fixed = (mode === 'fixed');
        var deltas = fixed ? [ null, null ] : this.tcService.deltas();
        var bounds = fixed ? this.tcService.bounds() : [ null, null ];

        $location.search(searchParams[SEARCH.MODE], mode);
        $location.search(searchParams[SEARCH.TIME_SYSTEM], timeSystem);
        $location.search(searchParams[SEARCH.START_DELTA], deltas[0]);
        $location.search(searchParams[SEARCH.END_DELTA], deltas[1]);
        $location.search(searchParams[SEARCH.START_BOUND], bounds[0]);
        $location.search(searchParams[SEARCH.END_BOUND], bounds[1]);
    };

    TimeConductorURLHandler.prototype.updateView = function (searchParams) {
        if (searchParams[SEARCH.MODE] !== undefined) {
            this.tcService.mode(searchParams[SEARCH.MODE]);
        }

        if (searchParams[SEARCH.TIME_SYSTEM] !== undefined) {
            this.tcService.timeSystem(searchParams[SEARCH.TIME_SYSTEM]);
        }

        var hasDelta =
            _.isFinite(searchParams[SEARCH.START_DELTA]) &&
            _.isFinite(searchParams[SEARCH.END_DELTA]);
        if (hasDelta) {
            this.tcService.deltas(
                searchParams[SEARCH.START_DELTA],
                searchParams[SEARCH.END_DELTA]
            );
        }

        var hasBounds =
            _.isFinite(searchParams[SEARCH.START_BOUND]) &&
            _.isFinite(searchParams[SEARCH.END_BOUND]);
        if (hasDelta) {
            this.tcService.bounds(
                searchParams[SEARCH.START_BOUND],
                searchParams[SEARCH.END_BOUND]
            );
        }
    };

    return TimeConductorURLHandler;
});
