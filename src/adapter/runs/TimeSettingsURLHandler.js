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

define([], function () {
    // Parameter names in query string
    var SEARCH = {
        MODE: 'tc.mode',
        TIME_SYSTEM: 'tc.timeSystem',
        START_BOUND: 'tc.startBound',
        END_BOUND: 'tc.endBound',
        START_DELTA: 'tc.startDelta',
        END_DELTA: 'tc.endDelta'
    };
    var TIME_EVENTS = ['bounds', 'timeSystem', 'clock', 'clockOffsets'];
    // Used to shorthand calls to $location, which clears null parameters
    var NULL_PARAMETERS = { key: null, start: null, end: null };

    /**
     * Communicates settings from the URL to the time API,
     * and vice versa.
     */
    function TimeSettingsURLHandler(time, $location, $rootScope) {
        this.time = time;
        this.$location = $location;

        $rootScope.$on('$locationChangeSuccess', this.updateTime.bind(this));

        TIME_EVENTS.forEach(function (event) {
            this.time.on(event, this.updateQueryParams.bind(this));
        }, this);

        this.updateTime(); // Initialize
    }

    TimeSettingsURLHandler.prototype.updateQueryParams = function () {
        var clock = this.time.clock();
        var fixed = !clock;
        var mode = fixed ? 'fixed' : clock.key;
        var timeSystem = this.time.timeSystem() || NULL_PARAMETERS;
        var bounds = fixed ? this.time.bounds() : NULL_PARAMETERS;
        var deltas = fixed ? NULL_PARAMETERS : this.time.clockOffsets();

        bounds = bounds || NULL_PARAMETERS;
        deltas = deltas || NULL_PARAMETERS;
        if (deltas.start) {
            deltas = { start: -deltas.start, end: deltas.end };
        }

        this.$location.search(SEARCH.MODE, mode);
        this.$location.search(SEARCH.TIME_SYSTEM, timeSystem.key);
        this.$location.search(SEARCH.START_BOUND, bounds.start);
        this.$location.search(SEARCH.END_BOUND, bounds.end);
        this.$location.search(SEARCH.START_DELTA, deltas.start);
        this.$location.search(SEARCH.END_DELTA, deltas.end);
    };

    TimeSettingsURLHandler.prototype.updateTime = function () {
        var searchParams = this.$location.search();
        var mode = searchParams[SEARCH.MODE];
        var timeSystem = searchParams[SEARCH.TIME_SYSTEM];
        var clockOffsets = {
            start: -searchParams[SEARCH.START_DELTA],
            end: +searchParams[SEARCH.END_DELTA]
        };
        var bounds = {
            start: +searchParams[SEARCH.START_BOUND],
            end: +searchParams[SEARCH.END_BOUND]
        };
        var fixed = (mode === 'fixed');
        var clock = fixed ? undefined : mode;
        var hasDeltas =
            !isNaN(parseInt(searchParams[SEARCH.START_DELTA], 0xA)) &&
            !isNaN(parseInt(searchParams[SEARCH.END_DELTA], 0xA));
        var hasBounds =
            !isNaN(parseInt(searchParams[SEARCH.START_BOUND], 0xA)) &&
            !isNaN(parseInt(searchParams[SEARCH.END_BOUND], 0xA));

        if (fixed && timeSystem && hasBounds) {
            this.time.timeSystem(timeSystem, bounds);
            this.time.stopClock();
        }

        if (!fixed && clock && hasDeltas) {
            this.time.clock(clock, clockOffsets);
            this.time.timeSystem(timeSystem);
        }

        if (hasDeltas && !fixed) {
            this.time.clockOffsets(clockOffsets);
        }

        if (hasBounds && fixed) {
            this.time.bounds(bounds);
        }
    };

    return TimeSettingsURLHandler;
});
