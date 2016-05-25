/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    "./BoundsHolder"
], function (BoundsHolder) {

    function TimeConductor(Topic) {

        // Modes and event types
        /**
         * Start and End point modes. One of FIXED or RELATIVE.
         * @readonly
         * @enum {Number}
         */
        this.EventTypes = {
            USER: 1,
            TICK: 2,
            EITHER: 3
        };

        /**
         * Start and End point modes. One of FIXED or RELATIVE.
         * @enum {Number}
         */
        this.Modes = {
            FIXED: 1,
            RELATIVE: 2
        }

        // Member variables
        this.toi = undefined;
        this.system = undefined;
        this.startModeValue = undefined;
        this.endModeValue = undefined;
        this.bounds = {
            inner: new TimeConductorBounds(this),
            outer: new TimeConductorBounds(this)
        }

        this.topic = new Topic();
    }

    /**
     * Set the mode of the start points of the inner and outer bounds.
     * @param newMode {BoundsHolder.Modes} specifies the new start mode, and any options. Mode is one of RELATIVE or FIXED
     * @returns {BoundsHolder.Modes|*} The currently set bounds start mode.
     */
    TimeConductor.prototype.startMode = function(newMode) {
        if (arguments.length > 0) {
            this.startModeValue = newMode;
            //Notify listeners
            this.topic.notify(this);
        }
        return this.startModeValue;
    };

    /**
     * Set the mode of the end points of the inner and outer bounds.
     * @param newMode {BoundsHolder.Modes} the new end mode. One of FIXED or RELATIVE. An end mode of RELATIVE sets delta
     * relative to 'now'. A delta value of zero is follow time.
     * @returns {BoundsHolder.Modes|*} The currently set bounds end mode.
     */
    TimeConductor.prototype.endMode = function (newMode) {
        if (arguments.length > 0) {
            this.endModeValue = newMode;
            this.topic.notify(this);
        }
        return this.endModeValue;
    };

    /**
     * Get or set the time of interest.
     * @param newTOI
     * @returns {*}
     */
    TimeConductor.prototype.timeOfInterest = function (newTOI) {
        if (arguments.length > 0) {
            this.toi = newTOI;
            this.topic.notify(this);
        }
        return this.toi;
    };

    /**
     * Get or set the time system used.
     * @param newSystem
     * @returns {*}
     */
    TimeConductor.prototype.timeSystem = function (newSystem) {
        if (arguments.length > 0) {
            this.system = newSystem;
            this.topic.notify(this);
        }
        return this.system;
    };

    /**
     * Listen for changes to properties directly on the TimeConductor itself. For changes to bounds,
     * [attach listeners to the bounds themselves]{@link TimeConductorBounds.listen}
     * @param listener A callback function to call when the value of a property on the TimeConductor changes. The
     * callback will be invoked with the TimeConductor passed as a parameter
     * @see {@link TimeConductorBounds.listen}
     * @returns {Function} a deregister function for the listener
     */
    TimeConductor.prototype.listen = function (listener) {
        return this.topic.listen(listener);
    };

    return TimeConductor;
});
