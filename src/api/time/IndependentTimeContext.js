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

import TimeContext from './TimeContext';
import { MODES, REALTIME_MODE_KEY, TIME_CONTEXT_EVENTS } from './constants';

/**
 * The IndependentTimeContext handles getting and setting time of the openmct application in general.
 * Views will use the GlobalTimeContext unless they specify an alternate/independent time context here.
 */
class IndependentTimeContext extends TimeContext {
  constructor(openmct, globalTimeContext, objectPath) {
    super();
    this.openmct = openmct;
    this.unlisteners = [];
    this.globalTimeContext = globalTimeContext;
    // We always start with the global time context.
    // This upstream context will be undefined when an independent time context is added later.
    this.upstreamTimeContext = this.globalTimeContext;
    this.objectPath = objectPath;
    this.refreshContext = this.refreshContext.bind(this);
    this.resetContext = this.resetContext.bind(this);
    this.removeIndependentContext = this.removeIndependentContext.bind(this);

    this.refreshContext();

    this.globalTimeContext.on('refreshContext', this.refreshContext);
    this.globalTimeContext.on('removeOwnContext', this.removeIndependentContext);
  }

  bounds() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.bounds(...arguments);
    } else {
      return super.bounds(...arguments);
    }
  }

  getBounds() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.getBounds();
    } else {
      return super.getBounds();
    }
  }

  setBounds() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.setBounds(...arguments);
    } else {
      return super.setBounds(...arguments);
    }
  }

  tick() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.tick(...arguments);
    } else {
      return super.tick(...arguments);
    }
  }

  clockOffsets() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.clockOffsets(...arguments);
    } else {
      return super.clockOffsets(...arguments);
    }
  }

  getClockOffsets() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.getClockOffsets();
    } else {
      return super.getClockOffsets();
    }
  }

  setClockOffsets() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.setClockOffsets(...arguments);
    } else {
      return super.setClockOffsets(...arguments);
    }
  }

  timeOfInterest(newTOI) {
    return this.globalTimeContext.timeOfInterest(...arguments);
  }

  timeSystem(timeSystemOrKey, bounds) {
    return this.globalTimeContext.timeSystem(...arguments);
  }

  /**
   * Get the time system of the TimeAPI.
   * @returns {TimeSystem} The currently applied time system
   * @memberof module:openmct.TimeAPI#
   * @method getTimeSystem
   */
  getTimeSystem() {
    return this.globalTimeContext.getTimeSystem();
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
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.clock(...arguments);
    }

    if (arguments.length === 2) {
      let clock;

      if (typeof keyOrClock === 'string') {
        clock = this.globalTimeContext.clocks.get(keyOrClock);
        if (clock === undefined) {
          throw "Unknown clock '" + keyOrClock + "'. Has it been registered with 'addClock'?";
        }
      } else if (typeof keyOrClock === 'object') {
        clock = keyOrClock;
        if (!this.globalTimeContext.clocks.has(clock.key)) {
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
        //set the mode here or isRealtime will be false even if we're in clock mode
        this.setMode(REALTIME_MODE_KEY);

        this.clockOffsets(offsets);
        this.activeClock.on('tick', this.tick);
      }
    } else if (arguments.length === 1) {
      throw 'When setting the clock, clock offsets must also be provided';
    }

    return this.activeClock;
  }

  /**
   * Get the active clock.
   * @return {Clock} the currently active clock;
   */
  getClock() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.getClock();
    }

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
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.setClock(...arguments);
    }

    let clock;

    if (typeof keyOrClock === 'string') {
      clock = this.globalTimeContext.clocks.get(keyOrClock);
      if (clock === undefined) {
        throw `Unknown clock ${keyOrClock}. Has it been registered with 'addClock'?`;
      }
    } else if (typeof keyOrClock === 'object') {
      clock = keyOrClock;
      if (!this.globalTimeContext.clocks.has(clock.key)) {
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

    return this.activeClock;
  }

  /**
   * Get the current mode.
   * @return {Mode} the current mode;
   */
  getMode() {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.getMode();
    }

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

    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.setMode(...arguments);
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

    //We are also going to set bounds here
    if (offsetsOrBounds !== undefined) {
      if (this.mode === REALTIME_MODE_KEY) {
        this.setClockOffsets(offsetsOrBounds);
      } else {
        this.setBounds(offsetsOrBounds);
      }
    }

    return this.mode;
  }

  /**
   * Causes this time context to follow another time context (either the global context, or another upstream time context)
   * This allows views to have their own time context which points to the appropriate upstream context as necessary, achieving nesting.
   */
  followTimeContext() {
    this.stopFollowingTimeContext();
    if (this.upstreamTimeContext) {
      Object.values(TIME_CONTEXT_EVENTS).forEach((eventName) => {
        const thisTimeContext = this;
        this.upstreamTimeContext.on(eventName, passthrough);
        this.unlisteners.push(() => {
          thisTimeContext.upstreamTimeContext.off(eventName, passthrough);
        });
        function passthrough() {
          thisTimeContext.emit(eventName, ...arguments);
        }
      });
    }
  }

  /**
   * Stops following any upstream time context
   */
  stopFollowingTimeContext() {
    this.unlisteners.forEach((unlisten) => unlisten());
    this.unlisteners = [];
  }

  resetContext() {
    if (this.upstreamTimeContext) {
      this.stopFollowingTimeContext();
      this.upstreamTimeContext = undefined;
    }
  }

  /**
   * Refresh the time context, following any upstream time contexts as necessary
   */
  refreshContext(viewKey) {
    const key = this.openmct.objects.makeKeyString(this.objectPath[0].identifier);
    if (viewKey && key === viewKey) {
      return;
    }

    //this is necessary as the upstream context gets reassigned after this
    this.stopFollowingTimeContext();

    this.upstreamTimeContext = this.getUpstreamContext();
    this.followTimeContext();

    // Emit bounds so that views that are changing context get the upstream bounds
    this.emit('bounds', this.bounds());
    this.emit(TIME_CONTEXT_EVENTS.boundsChanged, this.getBounds());
  }

  hasOwnContext() {
    return this.upstreamTimeContext === undefined;
  }

  getUpstreamContext() {
    // If a view has an independent context, don't return an upstream context
    // Be aware that when a new independent time context is created, we assign the global context as default
    if (this.hasOwnContext()) {
      return undefined;
    }

    let timeContext = this.globalTimeContext;
    this.objectPath.some((item, index) => {
      const key = this.openmct.objects.makeKeyString(item.identifier);
      // we're only interested in parents, not self, so index > 0
      const itemContext = this.globalTimeContext.independentContexts.get(key);
      if (index > 0 && itemContext && itemContext.hasOwnContext()) {
        //upstream time context
        timeContext = itemContext;

        return true;
      }

      return false;
    });

    return timeContext;
  }

  /**
   * Set the time context of a view to follow any upstream time contexts as necessary (defaulting to the global context)
   * This needs to be separate from refreshContext
   */
  removeIndependentContext(viewKey) {
    const key = this.openmct.objects.makeKeyString(this.objectPath[0].identifier);
    if (viewKey && key === viewKey) {
      //this is necessary as the upstream context gets reassigned after this
      this.stopFollowingTimeContext();

      let timeContext = this.globalTimeContext;

      this.objectPath.some((item, index) => {
        const objectKey = this.openmct.objects.makeKeyString(item.identifier);
        // we're only interested in any parents, not self, so index > 0
        const itemContext = this.globalTimeContext.independentContexts.get(objectKey);
        if (index > 0 && itemContext && itemContext.hasOwnContext()) {
          //upstream time context
          timeContext = itemContext;

          return true;
        }

        return false;
      });

      this.upstreamTimeContext = timeContext;

      this.followTimeContext();

      // Emit bounds so that views that are changing context get the upstream bounds
      this.emit('bounds', this.getBounds());
      this.emit(TIME_CONTEXT_EVENTS.boundsChanged, this.getBounds());
      // now that the view's context is set, tell others to check theirs in case they were following this view's context.
      this.globalTimeContext.emit('refreshContext', viewKey);
    }
  }

  #copy(object) {
    return JSON.parse(JSON.stringify(object));
  }
}

export default IndependentTimeContext;
