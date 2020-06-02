/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
import HashRelativeURL from './HashRelativeURL.js';

const TIME_EVENTS = ['bounds', 'timeSystem', 'clock', 'clockOffsets'];
const DUMMY_URL="https://nasa.gov";
const SEARCH_MODE = 'tc.mode';
const SEARCH_TIME_SYSTEM = 'tc.timeSystem';
const SEARCH_START_BOUND = 'tc.startBound';
const SEARCH_END_BOUND = 'tc.endBound';
const SEARCH_START_DELTA = 'tc.startDelta';
const SEARCH_END_DELTA = 'tc.endDelta';
const MODE_FIXED = 'fixed';

export default class URLTimeSettingsSynchronizer {
    constructor(openmct) {
        this.openmct = openmct;
        this.isUrlUpdateInProgress = false;

        openmct.on('start', () => this.initialize());
    }

    initialize() {
        this.updateTimeSettings(true);

        window.addEventListener('hashchange', () => this.updateTimeSettings());
        TIME_EVENTS.forEach(event => {
            this.openmct.time.on(event, () => this.setUrlFromTimeApi());
        });

    }

    updateTimeSettings() {
        // Prevent from triggering self
        if (!this.isUrlUpdateInProgress) {
            let url = HashRelativeURL.fromCurrent();
            let timeParameters = this.parseParametersFromUrl(url);

            if (this.areTimeParametersValid(timeParameters)) {
                this.setTimeApiFromUrl(timeParameters);
            } else {
                this.setUrlFromTimeApi();
            }
        } else {
            this.isUrlUpdateInProgress = false;
        }
    }

    createUrlWrapper() {
        return new URL(`${DUMMY_URL}${window.location.hash.substring(1)}`);
    }

    parseParametersFromUrl(url) {
        let mode = url.searchParams.get(SEARCH_MODE);
        let timeSystem = url.searchParams.get(SEARCH_TIME_SYSTEM);

        let startBound = parseInt(url.searchParams.get(SEARCH_START_BOUND), 10);
        let endBound = parseInt(url.searchParams.get(SEARCH_END_BOUND), 10);
        let bounds = {
            start: startBound,
            end: endBound
        };

        let startOffset = parseInt(url.searchParams.get(SEARCH_START_DELTA));
        let endOffset = parseInt(url.searchParams.get(SEARCH_END_DELTA));
        let clockOffsets = {
            start: 0 - startOffset,
            end: endOffset
        };

        return {
            mode,
            timeSystem,
            bounds,
            clockOffsets
        };
    }

    setTimeApiFromUrl(timeParameters) {
        if (timeParameters.mode === 'fixed') {
            if (this.openmct.time.timeSystem().key !== timeParameters.timeSystem) {
                this.openmct.time.timeSystem(
                    timeParameters.timeSystem,
                    timeParameters.bounds
                );
            } else if (!this.areStartAndEndEqual(this.openmct.time.bounds(), timeParameters.bounds)) {
                this.openmct.time.bounds(timeParameters.bounds);
            }
            if (this.openmct.time.clock()) {
                this.openmct.time.stopClock();
            }
        } else {
            if (!this.openmct.time.clock() ||
                this.openmct.time.clock().key !== timeParameters.mode) {
                this.openmct.time.clock(timeParameters.mode, timeParameters.clockOffsets);
            } else if (!this.areStartAndEndEqual(this.openmct.time.clockOffsets(), timeParameters.clockOffsets)) {
                this.openmct.time.clockOffsets(timeParameters.clockOffsets);
            }
            if (!this.openmct.time.timeSystem() ||
                this.openmct.time.timeSystem().key !== timeParameters.timeSystem) {
                this.openmct.time.timeSystem(timeParameters.timeSystem);
            }
        }
    }

    setUrlFromTimeApi() {
        let url = HashRelativeURL.fromCurrent();
        let clock = this.openmct.time.clock();
        let bounds = this.openmct.time.bounds();
        let clockOffsets = this.openmct.time.clockOffsets();

        if (clock === undefined) {
            url.searchParams.set(SEARCH_MODE, MODE_FIXED);
            url.searchParams.set(SEARCH_START_BOUND, bounds.start);
            url.searchParams.set(SEARCH_END_BOUND, bounds.end);

            url.searchParams.delete(SEARCH_START_DELTA);
            url.searchParams.delete(SEARCH_END_DELTA);
        } else {
            url.searchParams.set(SEARCH_MODE, clock.key);

            if (clockOffsets !== undefined) {
                url.searchParams.set(SEARCH_START_DELTA, 0 - clockOffsets.start);
                url.searchParams.set(SEARCH_END_DELTA, clockOffsets.end);
            } else {
                url.searchParams.delete(SEARCH_START_DELTA);
                url.searchParams.delete(SEARCH_END_DELTA);
            }
            url.searchParams.delete(SEARCH_START_BOUND);
            url.searchParams.delete(SEARCH_END_BOUND);
        }

        url.searchParams.set(SEARCH_TIME_SYSTEM, this.openmct.time.timeSystem().key);
        this.isUrlUpdateInProgress = true;
        window.location.hash = url.toRelativePathString();
    }

    areTimeParametersValid(timeParameters) {
        let isValid = false;

        if (this.isModeValid(timeParameters.mode) &&
            this.isTimeSystemValid(timeParameters.timeSystem)) {

            if (timeParameters.mode === 'fixed') {
                isValid = this.areStartAndEndValid(timeParameters.bounds);
            } else {
                isValid = this.areStartAndEndValid(timeParameters.clockOffsets);
            }
        }

        return isValid;
    }

    areStartAndEndValid(bounds) {
        return bounds !== undefined &&
            bounds.start !== undefined &&
            bounds.start !== null &&
            bounds.end !== undefined &&
            bounds.start !== null &&
            !isNaN(bounds.start) &&
            !isNaN(bounds.end);
    }

    isTimeSystemValid(timeSystem) {
        let isValid = timeSystem !== undefined;
        if (isValid) {
            let timeSystemObject = this.openmct.time.timeSystems.get(timeSystem);
            isValid = timeSystemObject !== undefined;
        }
        return isValid;
    }

    isModeValid(mode) {
        let isValid = false;

        if (mode !== undefined &&
            mode !== null) {
            isValid = true;
        }

        if (isValid) {
            if (mode.toLowerCase() === MODE_FIXED) {
                isValid = true;
            } else {
                isValid = this.openmct.time.clocks.get(mode) !== undefined;
            }
        }
        return isValid;
    }

    areStartAndEndEqual(firstBounds, secondBounds) {
        return firstBounds.start === secondBounds.start &&
            firstBounds.end === secondBounds.end;
    }
}
