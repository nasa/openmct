const DUMMY_URL="https://nasa.gov";
const SEARCH_MODE = 'tc.mode';
const SEARCH_TIME_SYSTEM = 'tc.timeSystem';
const SEARCH_START_BOUND = 'tc.startBound';
const SEARCH_END_BOUND = 'tc.endBound';
const SEARCH_START_DELTA = 'tc.startDelta';
const SEARCH_END_DELTA = 'tc.endDelta';
const MODE_FIXED = 'fixed';
const TIME_EVENTS = ['bounds', 'timeSystem', 'clock', 'clockOffsets'];

let clearHashListener;

export default function () {
    return function install(openmct) {
        let isUrlUpdateInProgress = false;

        openmct.on('start', () => {
            // Only allow one hash listener to exist at once. Window is a singleton shared between instances of Open MCT.
            // This is mostly just an issue in testing.

            if (clearHashListener !== undefined) {
                clearHashListener();
            }
            updateTimeSettings(true);

            window.addEventListener('hashchange', updateTimeSettings);
            clearHashListener = () => {
                window.removeEventListener('hashchange', updateTimeSettings);
            }
            TIME_EVENTS.forEach(event => openmct.time.on(event, setUrlFromTimeApi));
        });

        function updateTimeSettings() {
            // Prevent from triggering self
            if (!isUrlUpdateInProgress) {
                let url = createUrlWrapper();
                let timeParameters = parseParametersFromUrl(url);

                if (areTimeParametersValid(timeParameters)) {
                    setTimeApiFromUrl(timeParameters);
                } else {
                    setUrlFromTimeApi();
                }
            } else {
                isUrlUpdateInProgress = false;
            }
        }

        function createUrlWrapper() {
            return new URL(`${DUMMY_URL}${window.location.hash.substring(1)}`);
        }

        function parseParametersFromUrl(url) {
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

        function setTimeApiFromUrl(timeParameters) {
            if (timeParameters.mode === 'fixed') {
                if (openmct.time.timeSystem().key !== timeParameters.timeSystem) {
                    openmct.time.timeSystem(
                        timeParameters.timeSystem,
                        timeParameters.bounds
                    );
                } else if (!areStartAndEndEqual(openmct.time.bounds(), timeParameters.bounds)) {
                    openmct.time.bounds(timeParameters.bounds);
                }
                if (openmct.time.clock()) {
                    openmct.time.stopClock();
                }
            } else {
                if (!openmct.time.clock() ||
                    openmct.time.clock().key !== timeParameters.mode) {
                    openmct.time.clock(timeParameters.mode, timeParameters.clockOffsets);
                } else if (!areStartAndEndEqual(openmct.time.clockOffsets(), timeParameters.clockOffsets)) {
                    openmct.time.clockOffsets(timeParameters.clockOffsets);
                }
                if (!openmct.time.timeSystem() ||
                    openmct.time.timeSystem().key !== timeParameters.timeSystem) {
                    openmct.time.timeSystem(timeParameters.timeSystem);
                }
            }
        }

        function setUrlFromTimeApi() {
            let url = createUrlWrapper();
            let clock = openmct.time.clock();
            let bounds = openmct.time.bounds();
            let clockOffsets = openmct.time.clockOffsets();

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

            url.searchParams.set(SEARCH_TIME_SYSTEM, openmct.time.timeSystem().key);
            isUrlUpdateInProgress = true;
            window.location.hash = `#${url.pathname}${url.search}`;
        }

        function areTimeParametersValid(timeParameters) {
            let isValid = false;

            if (isModeValid(timeParameters.mode) &&
                isTimeSystemValid(timeParameters.timeSystem)) {

                if (timeParameters.mode === 'fixed') {
                    isValid = areStartAndEndValid(timeParameters.bounds);
                } else {
                    isValid = areStartAndEndValid(timeParameters.clockOffsets);
                }
            }

            return isValid;
        }

        function areStartAndEndValid(bounds) {
            return bounds !== undefined &&
                bounds.start !== undefined &&
                bounds.start !== null &&
                bounds.end !== undefined &&
                bounds.start !== null &&
                !isNaN(bounds.start) &&
                !isNaN(bounds.end);
        }

        function isTimeSystemValid(timeSystem) {
            let isValid = timeSystem !== undefined;
            if (isValid) {
                let timeSystemObject = openmct.time.timeSystems.get(timeSystem);
                isValid = timeSystemObject !== undefined;
            }
            return isValid;
        }

        function isModeValid(mode) {
            let isValid = false;

            if (mode !== undefined &&
                mode !== null) {
                isValid = true;
            }

            if (isValid) {
                if (mode.toLowerCase() === MODE_FIXED) {
                    isValid = true;
                } else {
                    isValid = openmct.time.clocks.get(mode) !== undefined;
                }
            }
            return isValid;
        }

        function areStartAndEndEqual(firstBounds, secondBounds) {
            return firstBounds.start === secondBounds.start &&
                firstBounds.end === secondBounds.end;
        }
    }
}
