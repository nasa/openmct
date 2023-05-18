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

import TimeContext, { TIME_CONTEXT_EVENTS } from './TimeContext';

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

  bounds(newBounds) {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.bounds(...arguments);
    } else {
      return super.bounds(...arguments);
    }
  }

  tick(timestamp) {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.tick(...arguments);
    } else {
      return super.tick(...arguments);
    }
  }

  clockOffsets(offsets) {
    if (this.upstreamTimeContext) {
      return this.upstreamTimeContext.clockOffsets(...arguments);
    } else {
      return super.clockOffsets(...arguments);
    }
  }

  stopClock() {
    if (this.upstreamTimeContext) {
      this.upstreamTimeContext.stopClock();
    } else {
      super.stopClock();
    }
  }

  timeOfInterest(newTOI) {
    return this.globalTimeContext.timeOfInterest(...arguments);
  }

  timeSystem(timeSystemOrKey, bounds) {
    return this.globalTimeContext.timeSystem(...arguments);
  }

  /**
   * Set the active clock. Tick source will be immediately subscribed to
   * and ticking will begin. Offsets from 'now' must also be provided. A clock
   * can be unset by calling {@link stopClock}.
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
       * The active clock has changed. Clock can be unset by calling {@link stopClock}
       * @event clock
       * @memberof module:openmct.TimeAPI~
       * @property {Clock} clock The newly activated clock, or undefined
       * if the system is no longer following a clock source
       */
      this.emit('clock', this.activeClock);

      if (this.activeClock !== undefined) {
        this.clockOffsets(offsets);
        this.activeClock.on('tick', this.tick);
      }
    } else if (arguments.length === 1) {
      throw 'When setting the clock, clock offsets must also be provided';
    }

    return this.activeClock;
  }

  /**
   * Causes this time context to follow another time context (either the global context, or another upstream time context)
   * This allows views to have their own time context which points to the appropriate upstream context as necessary, achieving nesting.
   */
  followTimeContext() {
    this.stopFollowingTimeContext();
    if (this.upstreamTimeContext) {
      TIME_CONTEXT_EVENTS.forEach((eventName) => {
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
      this.emit('bounds', this.bounds());
      // now that the view's context is set, tell others to check theirs in case they were following this view's context.
      this.globalTimeContext.emit('refreshContext', viewKey);
    }
  }
}

export default IndependentTimeContext;
