/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import { FIXED_MODE_KEY, REALTIME_MODE_KEY, TIME_CONTEXT_EVENTS } from '../../api/time/constants';

const SEARCH_MODE = 'tc.mode';
const SEARCH_TIME_SYSTEM = 'tc.timeSystem';
const SEARCH_START_BOUND = 'tc.startBound';
const SEARCH_END_BOUND = 'tc.endBound';
const SEARCH_START_DELTA = 'tc.startDelta';
const SEARCH_END_DELTA = 'tc.endDelta';
const TIME_EVENTS = [
  TIME_CONTEXT_EVENTS.timeSystemChanged,
  TIME_CONTEXT_EVENTS.modeChanged,
  TIME_CONTEXT_EVENTS.clockChanged,
  TIME_CONTEXT_EVENTS.clockOffsetsChanged
];

export default class URLTimeSettingsSynchronizer {
  constructor(openmct) {
    this.openmct = openmct;
    this.isUrlUpdateInProgress = false;

    this.initialize = this.initialize.bind(this);
    this.destroy = this.destroy.bind(this);
    this.updateTimeSettings = this.updateTimeSettings.bind(this);
    this.setUrlFromTimeApi = this.setUrlFromTimeApi.bind(this);
    this.updateBounds = this.updateBounds.bind(this);

    openmct.on('start', this.initialize);
    openmct.on('destroy', this.destroy);
  }

  initialize() {
    this.updateTimeSettings();
    this.openmct.router.on('change:params', this.updateTimeSettings);

    TIME_EVENTS.forEach((event) => {
      this.openmct.time.on(event, this.setUrlFromTimeApi);
    });
    this.openmct.time.on('bounds', this.updateBounds);
  }

  destroy() {
    this.openmct.router.off('change:params', this.updateTimeSettings);

    this.openmct.off('start', this.initialize);
    this.openmct.off('destroy', this.destroy);

    TIME_EVENTS.forEach((event) => {
      this.openmct.time.off(event, this.setUrlFromTimeApi);
    });
    this.openmct.time.off('bounds', this.updateBounds);
  }

  updateTimeSettings() {
    const timeParameters = this.parseParametersFromUrl();

    if (this.areTimeParametersValid(timeParameters)) {
      this.setTimeApiFromUrl(timeParameters);
      this.openmct.router.setLocationFromUrl();
    } else {
      this.setUrlFromTimeApi();
    }
  }

  parseParametersFromUrl() {
    const searchParams = this.openmct.router.getAllSearchParams();
    const mode = searchParams.get(SEARCH_MODE);
    const timeSystem = searchParams.get(SEARCH_TIME_SYSTEM);
    const startBound = parseInt(searchParams.get(SEARCH_START_BOUND), 10);
    const endBound = parseInt(searchParams.get(SEARCH_END_BOUND), 10);
    const bounds = {
      start: startBound,
      end: endBound
    };
    const startOffset = parseInt(searchParams.get(SEARCH_START_DELTA), 10);
    const endOffset = parseInt(searchParams.get(SEARCH_END_DELTA), 10);
    const clockOffsets = {
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
    const timeSystem = this.openmct.time.getTimeSystem();

    if (timeParameters.mode === FIXED_MODE_KEY) {
      // should update timesystem
      if (timeSystem.key !== timeParameters.timeSystem) {
        this.openmct.time.setTimeSystem(timeParameters.timeSystem, timeParameters.bounds);
      }
      if (!this.areStartAndEndEqual(this.openmct.time.getBounds(), timeParameters.bounds)) {
        this.openmct.time.setMode(FIXED_MODE_KEY, timeParameters.bounds);
      } else {
        this.openmct.time.setMode(FIXED_MODE_KEY);
      }
    } else {
      const clock = this.openmct.time.getClock();

      if (clock?.key !== timeParameters.mode) {
        this.openmct.time.setClock(timeParameters.mode);
      }

      if (
        !this.areStartAndEndEqual(this.openmct.time.getClockOffsets(), timeParameters.clockOffsets)
      ) {
        this.openmct.time.setMode(REALTIME_MODE_KEY, timeParameters.clockOffsets);
      } else {
        this.openmct.time.setMode(REALTIME_MODE_KEY);
      }

      if (timeSystem?.key !== timeParameters.timeSystem) {
        this.openmct.time.setTimeSystem(timeParameters.timeSystem);
      }
    }
  }

  updateBounds(bounds, isTick) {
    if (!isTick) {
      this.setUrlFromTimeApi();
    }
  }

  setUrlFromTimeApi() {
    const searchParams = this.openmct.router.getAllSearchParams();
    const clock = this.openmct.time.getClock();
    const mode = this.openmct.time.getMode();
    const bounds = this.openmct.time.getBounds();
    const clockOffsets = this.openmct.time.getClockOffsets();

    if (mode === FIXED_MODE_KEY) {
      searchParams.set(SEARCH_MODE, FIXED_MODE_KEY);
      searchParams.set(SEARCH_START_BOUND, bounds.start);
      searchParams.set(SEARCH_END_BOUND, bounds.end);

      searchParams.delete(SEARCH_START_DELTA);
      searchParams.delete(SEARCH_END_DELTA);
    } else {
      searchParams.set(SEARCH_MODE, clock.key);

      if (clockOffsets !== undefined) {
        searchParams.set(SEARCH_START_DELTA, 0 - clockOffsets.start);
        searchParams.set(SEARCH_END_DELTA, clockOffsets.end);
      } else {
        searchParams.delete(SEARCH_START_DELTA);
        searchParams.delete(SEARCH_END_DELTA);
      }

      searchParams.delete(SEARCH_START_BOUND);
      searchParams.delete(SEARCH_END_BOUND);
    }

    searchParams.set(SEARCH_TIME_SYSTEM, this.openmct.time.getTimeSystem().key);
    this.openmct.router.updateParams(searchParams);
  }

  areTimeParametersValid(timeParameters) {
    let isValid = false;

    if (
      this.isModeValid(timeParameters.mode) &&
      this.isTimeSystemValid(timeParameters.timeSystem)
    ) {
      if (timeParameters.mode === FIXED_MODE_KEY) {
        isValid = this.areStartAndEndValid(timeParameters.bounds);
      } else {
        isValid = this.areStartAndEndValid(timeParameters.clockOffsets);
      }
    }

    return isValid;
  }

  areStartAndEndValid(bounds) {
    return (
      bounds !== undefined &&
      bounds.start !== undefined &&
      bounds.start !== null &&
      bounds.end !== undefined &&
      bounds.start !== null &&
      !isNaN(bounds.start) &&
      !isNaN(bounds.end)
    );
  }

  isTimeSystemValid(timeSystem) {
    let isValid = timeSystem !== undefined;

    if (isValid) {
      const timeSystemObject = this.openmct.time.timeSystems.get(timeSystem);
      isValid = timeSystemObject !== undefined;
    }

    return isValid;
  }

  isModeValid(mode) {
    let isValid = false;

    if (mode !== undefined && mode !== null) {
      isValid = true;
    }

    if (
      isValid &&
      (mode.toLowerCase() === FIXED_MODE_KEY || this.openmct.time.clocks.get(mode) !== undefined)
    ) {
      isValid = true;
    }

    return isValid;
  }

  areStartAndEndEqual(firstBounds, secondBounds) {
    return firstBounds?.start === secondBounds.start && firstBounds?.end === secondBounds.end;
  }
}
