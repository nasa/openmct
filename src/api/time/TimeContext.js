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

import EventEmitter from 'EventEmitter';

import { FIXED_MODE_KEY, MODES, REALTIME_MODE_KEY, TIME_CONTEXT_EVENTS } from './constants';

class TimeContext extends EventEmitter {
  constructor() {
    super();

    //The Time System
    this.timeSystems = new Map();

    this.system = undefined;

    this.clocks = new Map();

    this.boundsVal = {
      start: undefined,
      end: undefined
    };

    this.activeClock = undefined;
    this.offsets = undefined;
    this.mode = undefined;
    this.warnCounts = {};

    this.tick = this.tick.bind(this);
  }

  /**
   * Get or set the time system of the TimeAPI.
   * @param {TimeSystem | string} timeSystemOrKey
   * @param {module:openmct.TimeAPI~TimeConductorBounds} bounds
   * @fires module:openmct.TimeAPI~timeSystem
   * @returns {TimeSystem} The currently applied time system
   * @memberof module:openmct.TimeAPI#
   * @method timeSystem
   */
  timeSystem(timeSystemOrKey, bounds) {
    this.#warnMethodDeprecated('"timeSystem"', '"getTimeSystem" and "setTimeSystem"');

    if (arguments.length >= 1) {
      if (arguments.length === 1 && !this.activeClock) {
        throw new Error('Must specify bounds when changing time system without an active clock.');
      }

      let timeSystem;

      if (timeSystemOrKey === undefined) {
        throw 'Please provide a time system';
      }

      if (typeof timeSystemOrKey === 'string') {
        timeSystem = this.timeSystems.get(timeSystemOrKey);

        if (timeSystem === undefined) {
          throw (
            'Unknown time system ' +
            timeSystemOrKey +
            ". Has it been registered with 'addTimeSystem'?"
          );
        }
      } else if (typeof timeSystemOrKey === 'object') {
        timeSystem = timeSystemOrKey;

        if (!this.timeSystems.has(timeSystem.key)) {
          throw (
            'Unknown time system ' +
            timeSystem.key +
            ". Has it been registered with 'addTimeSystem'?"
          );
        }
      } else {
        throw 'Attempt to set invalid time system in Time API. Please provide a previously registered time system object or key';
      }

      this.system = this.#copy(timeSystem);

      /**
       * The time system used by the time
       * conductor has changed. A change in Time System will always be
       * followed by a bounds event specifying new query bounds.
       *
       * @event module:openmct.TimeAPI~timeSystem
       * @property {TimeSystem} The value of the currently applied
       * Time System
       * */
      const system = this.#copy(this.system);
      this.emit('timeSystem', system);
      this.emit(TIME_CONTEXT_EVENTS.timeSystemChanged, system);

      if (bounds) {
        this.bounds(bounds);
      }
    }

    return this.system;
  }

  /**
   * Clock offsets are used to calculate temporal bounds when the system is
   * ticking on a clock source.
   *
   * @typedef {object} ValidationResult
   * @property {boolean} valid Result of the validation - true or false.
   * @property {string} message An error message if valid is false.
   */
  /**
   * Validate the given bounds. This can be used for pre-validation of bounds,
   * for example by views validating user inputs.
   * @param {TimeBounds} bounds The start and end time of the conductor.
   * @returns {ValidationResult} A validation error, or true if valid
   * @memberof module:openmct.TimeAPI#
   * @method validateBounds
   */
  validateBounds(bounds) {
    if (
      bounds.start === undefined ||
      bounds.end === undefined ||
      isNaN(bounds.start) ||
      isNaN(bounds.end)
    ) {
      return {
        valid: false,
        message: 'Start and end must be specified as integer values'
      };
    } else if (bounds.start > bounds.end) {
      return {
        valid: false,
        message: 'Specified start date exceeds end bound'
      };
    }

    return {
      valid: true,
      message: ''
    };
  }

  /**
   * Get or set the start and end time of the time conductor. Basic validation
   * of bounds is performed.
   *
   * @param {module:openmct.TimeAPI~TimeConductorBounds} newBounds
   * @throws {Error} Validation error
   * @fires module:openmct.TimeAPI~bounds
   * @returns {module:openmct.TimeAPI~TimeConductorBounds}
   * @memberof module:openmct.TimeAPI#
   * @method bounds
   */
  bounds(newBounds) {
    this.#warnMethodDeprecated('"bounds"', '"getBounds" and "setBounds"');

    if (arguments.length > 0) {
      const validationResult = this.validateBounds(newBounds);
      if (validationResult.valid !== true) {
        throw new Error(validationResult.message);
      }

      //Create a copy to avoid direct mutation of conductor bounds
      this.boundsVal = this.#copy(newBounds);
      /**
       * The start time, end time, or both have been updated.
       * @event bounds
       * @memberof module:openmct.TimeAPI~
       * @property {TimeConductorBounds} bounds The newly updated bounds
       * @property {boolean} [tick] `true` if the bounds update was due to
       * a "tick" event (ie. was an automatic update), false otherwise.
       */
      this.emit('bounds', this.boundsVal, false);
      this.emit(TIME_CONTEXT_EVENTS.boundsChanged, this.boundsVal, false);
    }

    //Return a copy to prevent direct mutation of time conductor bounds.
    return this.#copy(this.boundsVal);
  }

  /**
   * Validate the given offsets. This can be used for pre-validation of
   * offsets, for example by views validating user inputs.
   * @param {ClockOffsets} offsets The start and end offsets from a 'now' value.
   * @returns { ValidationResult } A validation error, and true/false if valid or not
   * @memberof module:openmct.TimeAPI#
   * @method validateOffsets
   */
  validateOffsets(offsets) {
    if (
      offsets.start === undefined ||
      offsets.end === undefined ||
      isNaN(offsets.start) ||
      isNaN(offsets.end)
    ) {
      return {
        valid: false,
        message: 'Start and end offsets must be specified as integer values'
      };
    } else if (offsets.start >= offsets.end) {
      return {
        valid: false,
        message: 'Specified start offset must be < end offset'
      };
    }

    return {
      valid: true,
      message: ''
    };
  }

  /**
   * @typedef {Object} TimeBounds
   * @property {number} start The start time displayed by the time conductor
   * in ms since epoch. Epoch determined by currently active time system
   * @property {number} end The end time displayed by the time conductor in ms
   * since epoch.
   * @memberof module:openmct.TimeAPI~
   */

  /**
   * Clock offsets are used to calculate temporal bounds when the system is
   * ticking on a clock source.
   *
   * @typedef {object} ClockOffsets
   * @property {number} start A time span relative to the current value of the
   * ticking clock, from which start bounds will be calculated. This value must
   * be < 0. When a clock is active, bounds will be calculated automatically
   * based on the value provided by the clock, and the defined clock offsets.
   * @property {number} end A time span relative to the current value of the
   * ticking clock, from which end bounds will be calculated. This value must
   * be >= 0.
   */
  /**
   * Get or set the currently applied clock offsets. If no parameter is provided,
   * the current value will be returned. If provided, the new value will be
   * used as the new clock offsets.
   * @param {ClockOffsets} offsets
   * @returns {ClockOffsets}
   */
  clockOffsets(offsets) {
    this.#warnMethodDeprecated('"clockOffsets"', '"getClockOffsets" and "setClockOffsets"');

    if (arguments.length > 0) {
      const validationResult = this.validateOffsets(offsets);
      if (validationResult.valid !== true) {
        throw new Error(validationResult.message);
      }

      this.offsets = offsets;

      const currentValue = this.activeClock.currentValue();
      const newBounds = {
        start: currentValue + offsets.start,
        end: currentValue + offsets.end
      };

      this.bounds(newBounds);

      /**
       * Event that is triggered when clock offsets change.
       * @event clockOffsets
       * @memberof module:openmct.TimeAPI~
       * @property {ClockOffsets} clockOffsets The newly activated clock
       * offsets.
       */
      this.emit('clockOffsets', offsets);
    }

    return this.offsets;
  }

  /**
   * Stop following the currently active clock. This will
   * revert all views to showing a static time frame defined by the current
   * bounds.
   */
  stopClock() {
    this.#warnMethodDeprecated('"stopClock"');

    this.setMode(FIXED_MODE_KEY);
  }

  /**
   * Set the active clock. Tick source will be immediately subscribed to
   * and ticking will begin. Offsets from 'now' must also be provided.
   *
   * @param {Clock || string} keyOrClock The clock to activate, or its key
   * @param {ClockOffsets} offsets on each tick these will be used to calculate
   * the start and end bounds. This maintains a sliding time window of a fixed
   * width that automatically updates.
   * @fires module:openmct.TimeAPI~clock
   * @return {Clock} the currently active clock;
   */
  clock(keyOrClock, offsets) {
    this.#warnMethodDeprecated('"clock"', '"getClock" and "setClock"');

    if (arguments.length === 2) {
      let clock;

      if (typeof keyOrClock === 'string') {
        clock = this.clocks.get(keyOrClock);
        if (clock === undefined) {
          throw "Unknown clock '" + keyOrClock + "'. Has it been registered with 'addClock'?";
        }
      } else if (typeof keyOrClock === 'object') {
        clock = keyOrClock;
        if (!this.clocks.has(clock.key)) {
          throw "Unknown clock '" + keyOrClock.key + "'. Has it been registered with 'addClock'?";
        }
      }

      const previousClock = this.activeClock;
      if (previousClock !== undefined) {
        previousClock.off('tick', this.tick);
      }

      this.activeClock = clock;

      /**
       * The active clock has changed.
       * @event clock
       * @memberof module:openmct.TimeAPI~
       * @property {Clock} clock The newly activated clock, or undefined
       * if the system is no longer following a clock source
       */
      this.emit('clock', this.activeClock);
      this.emit(TIME_CONTEXT_EVENTS.clockChanged, this.activeClock);

      if (this.activeClock !== undefined) {
        //set the mode or isRealtime will be false even though we're in clock mode
        this.setMode(REALTIME_MODE_KEY);

        this.clockOffsets(offsets);
        this.activeClock.on('tick', this.tick);
      }
    } else if (arguments.length === 1) {
      throw 'When setting the clock, clock offsets must also be provided';
    }

    return this.isRealTime() ? this.activeClock : undefined;
  }

  /**
   * Update bounds based on provided time and current offsets
   * @param {number} timestamp A time from which bounds will be calculated
   * using current offsets.
   */
  tick(timestamp) {
    // always emit the timestamp
    this.emit('tick', timestamp);

    if (this.mode === REALTIME_MODE_KEY) {
      const newBounds = {
        start: timestamp + this.offsets.start,
        end: timestamp + this.offsets.end
      };

      this.boundsVal = newBounds;
      // "bounds" will be deprecated in a future release
      this.emit('bounds', this.boundsVal, true);
      this.emit(TIME_CONTEXT_EVENTS.boundsChanged, this.boundsVal, true);
    }
  }

  /**
   * Get the timestamp of the current clock
   * @returns {number} current timestamp of current clock regardless of mode
   * @memberof module:openmct.TimeAPI#
   * @method now
   */

  now() {
    return this.activeClock.currentValue();
  }

  /**
   * Get the time system of the TimeAPI.
   * @returns {TimeSystem} The currently applied time system
   * @memberof module:openmct.TimeAPI#
   * @method getTimeSystem
   */
  getTimeSystem() {
    return this.system;
  }

  /**
   * Set the time system of the TimeAPI.
   * @param {TimeSystem | string} timeSystemOrKey
   * @param {module:openmct.TimeAPI~TimeConductorBounds} bounds
   * @fires module:openmct.TimeAPI~timeSystem
   * @returns {TimeSystem} The currently applied time system
   * @memberof module:openmct.TimeAPI#
   * @method setTimeSystem
   */
  setTimeSystem(timeSystemOrKey, bounds) {
    if (timeSystemOrKey === undefined) {
      throw 'Please provide a time system';
    }

    let timeSystem;

    if (typeof timeSystemOrKey === 'string') {
      timeSystem = this.timeSystems.get(timeSystemOrKey);

      if (timeSystem === undefined) {
        throw `Unknown time system ${timeSystemOrKey}. Has it been registered with 'addTimeSystem'?`;
      }
    } else if (typeof timeSystemOrKey === 'object') {
      timeSystem = timeSystemOrKey;

      if (!this.timeSystems.has(timeSystem.key)) {
        throw `Unknown time system ${timeSystemOrKey.key}. Has it been registered with 'addTimeSystem'?`;
      }
    } else {
      throw 'Attempt to set invalid time system in Time API. Please provide a previously registered time system object or key';
    }

    this.system = this.#copy(timeSystem);
    /**
     * The time system used by the time
     * conductor has changed. A change in Time System will always be
     * followed by a bounds event specifying new query bounds.
     *
     * @event module:openmct.TimeAPI~timeSystem
     * @property {TimeSystem} The value of the currently applied
     * Time System
     * */
    this.emit(TIME_CONTEXT_EVENTS.timeSystemChanged, this.#copy(this.system));
    this.emit('timeSystem', this.#copy(this.system));

    if (bounds) {
      this.setBounds(bounds);
    }
  }

  /**
   * Get the start and end time of the time conductor. Basic validation
   * of bounds is performed.
   * @returns {module:openmct.TimeAPI~TimeConductorBounds}
   * @memberof module:openmct.TimeAPI#
   * @method bounds
   */
  getBounds() {
    //Return a copy to prevent direct mutation of time conductor bounds.
    return this.#copy(this.boundsVal);
  }

  /**
   * Set the start and end time of the time conductor. Basic validation
   * of bounds is performed.
   *
   * @param {module:openmct.TimeAPI~TimeConductorBounds} newBounds
   * @throws {Error} Validation error
   * @fires module:openmct.TimeAPI~bounds
   * @returns {module:openmct.TimeAPI~TimeConductorBounds}
   * @memberof module:openmct.TimeAPI#
   * @method bounds
   */
  setBounds(newBounds) {
    const validationResult = this.validateBounds(newBounds);
    if (validationResult.valid !== true) {
      throw new Error(validationResult.message);
    }

    //Create a copy to avoid direct mutation of conductor bounds
    this.boundsVal = this.#copy(newBounds);
    /**
     * The start time, end time, or both have been updated.
     * @event bounds
     * @memberof module:openmct.TimeAPI~
     * @property {TimeConductorBounds} bounds The newly updated bounds
     * @property {boolean} [tick] `true` if the bounds update was due to
     * a "tick" event (i.e. was an automatic update), false otherwise.
     */
    this.emit(TIME_CONTEXT_EVENTS.boundsChanged, this.boundsVal, false);
    this.emit('bounds', this.boundsVal, false);
  }

  /**
   * Get the active clock.
   * @return {Clock} the currently active clock;
   */
  getClock() {
    return this.activeClock;
  }

  /**
   * Set the active clock. Tick source will be immediately subscribed to
   * and the currently ticking will begin.
   * Offsets from 'now', if provided, will be used to set realtime mode offsets
   *
   * @param {Clock || string} keyOrClock The clock to activate, or its key
   * @fires module:openmct.TimeAPI~clock
   * @return {Clock} the currently active clock;
   */
  setClock(keyOrClock) {
    let clock;

    if (typeof keyOrClock === 'string') {
      clock = this.clocks.get(keyOrClock);
      if (clock === undefined) {
        throw `Unknown clock ${keyOrClock}. Has it been registered with 'addClock'?`;
      }
    } else if (typeof keyOrClock === 'object') {
      clock = keyOrClock;
      if (!this.clocks.has(clock.key)) {
        throw `Unknown clock ${keyOrClock.key}. Has it been registered with 'addClock'?`;
      }
    }

    const previousClock = this.activeClock;
    if (previousClock) {
      previousClock.off('tick', this.tick);
    }

    this.activeClock = clock;
    this.activeClock.on('tick', this.tick);

    /**
     * The active clock has changed.
     * @event clock
     * @memberof module:openmct.TimeAPI~
     * @property {Clock} clock The newly activated clock, or undefined
     * if the system is no longer following a clock source
     */
    this.emit(TIME_CONTEXT_EVENTS.clockChanged, this.activeClock);
    this.emit('clock', this.activeClock);
  }

  /**
   * Get the current mode.
   * @return {Mode} the current mode;
   */
  getMode() {
    return this.mode;
  }

  /**
   * Set the mode to either fixed or realtime.
   *
   * @param {Mode} mode The mode to activate
   * @param {TimeBounds | ClockOffsets} offsetsOrBounds A time window of a fixed width
   * @fires module:openmct.TimeAPI~clock
   * @return {Mode} the currently active mode;
   */
  setMode(mode, offsetsOrBounds) {
    if (!mode) {
      return;
    }

    if (mode === MODES.realtime && this.activeClock === undefined) {
      throw `Unknown clock. Has a clock been registered with 'addClock'?`;
    }

    if (mode !== this.mode) {
      this.mode = mode;
      /**
       * The active mode has changed.
       * @event modeChanged
       * @memberof module:openmct.TimeAPI~
       * @property {Mode} mode The newly activated mode
       */
      this.emit(TIME_CONTEXT_EVENTS.modeChanged, this.#copy(this.mode));
    }

    if (offsetsOrBounds !== undefined) {
      if (this.isRealTime()) {
        this.setClockOffsets(offsetsOrBounds);
      } else {
        this.setBounds(offsetsOrBounds);
      }
    }
  }

  /**
   * Checks if this time context is in realtime mode or not.
   * @returns {boolean} true if this context is in real-time mode, false if not
   */
  isRealTime() {
    return this.mode === MODES.realtime;
  }

  /**
   * Checks if this time context is in fixed mode or not.
   * @returns {boolean} true if this context is in fixed mode, false if not
   */
  isFixed() {
    return this.mode === MODES.fixed;
  }

  /**
   * Get the currently applied clock offsets.
   * @returns {ClockOffsets}
   */
  getClockOffsets() {
    return this.offsets;
  }

  /**
   * Set the currently applied clock offsets. If no parameter is provided,
   * the current value will be returned. If provided, the new value will be
   * used as the new clock offsets.
   * @param {ClockOffsets} offsets
   * @returns {ClockOffsets}
   */
  setClockOffsets(offsets) {
    const validationResult = this.validateOffsets(offsets);
    if (validationResult.valid !== true) {
      throw new Error(validationResult.message);
    }

    this.offsets = this.#copy(offsets);

    const currentValue = this.activeClock.currentValue();
    const newBounds = {
      start: currentValue + offsets.start,
      end: currentValue + offsets.end
    };

    this.setBounds(newBounds);

    /**
     * Event that is triggered when clock offsets change.
     * @event clockOffsets
     * @memberof module:openmct.TimeAPI~
     * @property {ClockOffsets} clockOffsets The newly activated clock
     * offsets.
     */
    this.emit(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.#copy(offsets));
  }

  #warnMethodDeprecated(method, newMethod) {
    const MAX_CALLS = 1; // Only warn once per unique method and newMethod combination

    const key = `${method}.${newMethod}`;
    const currentWarnCount = this.warnCounts[key] || 0;

    if (currentWarnCount >= MAX_CALLS) {
      return; // Don't warn if already warned once
    }

    this.warnCounts[key] = currentWarnCount + 1;

    let message = `[DEPRECATION WARNING]: The ${method} API method is deprecated and will be removed in a future version of Open MCT.`;

    if (newMethod) {
      message += ` Please use the ${newMethod} API method(s) instead.`;
    }

    // TODO: add docs and point to them in warning.
    //  For more information and migration instructions, visit [link to documentation or migration guide].

    console.warn(message);
  }

  #copy(object) {
    return JSON.parse(JSON.stringify(object));
  }
}

export default TimeContext;

/**
@typedef {{start: number, end: number}} Bounds
*/
