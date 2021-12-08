/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import TimeContext, { TIME_CONTEXT_EVENTS, TIME_CONTEXT_METHODS } from "./TimeContext";

/**
 * The IndependentTimeContext handles getting and setting time of the openmct application in general.
 * Views will use the GlobalTimeContext unless they specify an alternate/independent time context here.
 */
class IndependentTimeContext extends TimeContext {
    constructor(globalTimeContext, objectPath) {
        super();
        this.unlisteners = [];
        this.globalTimeContext = globalTimeContext;
        this.objectPath = objectPath;
        this.refreshContext = this.refreshContext.bind(this);

        TIME_CONTEXT_METHODS.forEach((functionName) => {
            const wrappedFunction = this[functionName].bind(this);
            this[functionName] = this.handleTimeContextMethods.bind(this, functionName, wrappedFunction);
        });

        this.refreshContext();

        this.globalTimeContext.on('refreshContext', this.refreshContext);
    }

    /**
     * Causes this time context to call methods on another time context (either the global context, or another upstream time context)
     * This allows views to have their own time context which points to the appropriate upstream context as necessary, achieving nesting.
     * @param {*} functionName name of the time context class method
     * @param {*} wrappedFunction the original class method on this (to prevent recursion)
     * @param {*} args any arguments passed to the called class method
     */
    handleTimeContextMethods(functionName, wrappedFunction, ...args) {
        if (this.upstreamTimeContext) {
            return this.upstreamTimeContext[functionName](...args);
        } else {
            return wrappedFunction(...args);
        }
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
                previousClock.off("tick", this.tick);
            }

            this.activeClock = clock;

            /**
             * The active clock has changed. Clock can be unset by calling {@link stopClock}
             * @event clock
             * @memberof module:openmct.TimeAPI~
             * @property {Clock} clock The newly activated clock, or undefined
             * if the system is no longer following a clock source
             */
            this.emit("clock", this.activeClock);

            if (this.activeClock !== undefined) {
                this.clockOffsets(offsets);
                this.activeClock.on("tick", this.tick);
            }

        } else if (arguments.length === 1) {
            throw "When setting the clock, clock offsets must also be provided";
        }

        return this.activeClock;
    }

    /**
     * Causes this time context to follow another time context (either the global context, or another upstream time context)
     * This allows views to have their own time context which points to the appropriate upstream context as necessary, achieving nesting.
     * @param {*} upstreamTimeContext
     */
    followTimeContext() {
        this.stopFollowingTimeContext();
        if (this.upstreamTimeContext) {
            TIME_CONTEXT_EVENTS.forEach((eventName) => {
                const thisTimeContext = this;
                this.upstreamTimeContext.on(eventName, passthrough);
                this.unlisteners.push(() => this.upstreamTimeContext.off(eventName, passthrough));
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
        this.unlisteners.forEach(unlisten => unlisten());
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
    refreshContext() {
        this.upstreamTimeContext = this.getUpstreamContext();
        this.followTimeContext();
    }

    hasOwnContext() {
        return this.upstreamTimeContext === undefined;
    }

    getUpstreamContext() {
        let timeContext = this.globalTimeContext;

        this.objectPath.forEach((item, index) => {
            const key = this.globalTimeContext.openmct.objects.makeKeyString(item.identifier);
            //first index is the view object itself
            if (index > 0 && this.globalTimeContext.independentContexts.get(key)) {
                //upstream time context
                timeContext = this.globalTimeContext.independentContexts.get(key);
            }
        });

        return timeContext;
    }
}

export default IndependentTimeContext;
