/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    'lodash'
], function (
    _
) {
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

    TimeSettingsURLHandler.prototype.parseQueryParams = function () {
        var searchParams = _.pick(this.$location.search(), Object.values(SEARCH));
        var parsedParams = {
            clock: searchParams[SEARCH.MODE],
            timeSystem: searchParams[SEARCH.TIME_SYSTEM]
        };
        if (!isNaN(parseInt(searchParams[SEARCH.START_DELTA], 0xA)) &&
            !isNaN(parseInt(searchParams[SEARCH.END_DELTA], 0xA))) {
            parsedParams.clockOffsets = {
                start: -searchParams[SEARCH.START_DELTA],
                end: +searchParams[SEARCH.END_DELTA]
            };
        }
        if (!isNaN(parseInt(searchParams[SEARCH.START_BOUND], 0xA)) &&
            !isNaN(parseInt(searchParams[SEARCH.END_BOUND], 0xA))) {
            parsedParams.bounds = {
                start: +searchParams[SEARCH.START_BOUND],
                end: +searchParams[SEARCH.END_BOUND]
            };
        }
        return parsedParams;
    };

    TimeSettingsURLHandler.prototype.updateTime = function () {
        var params = this.parseQueryParams();
        if (_.isEqual(params, this.last)) {
            return; // Do nothing;
        }
        this.last = params;

        if (!params.timeSystem) {
            this.updateQueryParams();
        } else if (params.clock === 'fixed' && params.bounds) {
            if (!this.time.timeSystem() ||
                this.time.timeSystem().key !== params.timeSystem) {

                this.time.timeSystem(
                    params.timeSystem,
                    params.bounds
                );
            } else if (!_.isEqual(this.time.bounds(), params.bounds)) {
                this.time.bounds(params.bounds);
            }
            if (this.time.clock()) {
                this.time.stopClock();
            }
        } else if (params.clockOffsets) {
            if (params.clock === 'fixed') {
                this.time.stopClock();
                return;
            }
            if (!this.time.clock() ||
                this.time.clock().key !== params.clock) {

                this.time.clock(params.clock, params.clockOffsets);
            } else if (!_.isEqual(this.time.clockOffsets(), params.clockOffsets)) {
                this.time.clockOffsets(params.clockOffsets);
            }
            if (!this.time.timeSystem() ||
                this.time.timeSystem().key !== params.timeSystem) {

                this.time.timeSystem(params.timeSystem);
            }
        } else {
            // Neither found, update from timeSystem.
            this.updateQueryParams();
        }
    };

    return TimeSettingsURLHandler;
});
