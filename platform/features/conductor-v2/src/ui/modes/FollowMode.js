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

define(
    ['./TimeConductorMode'],
    function (TimeConductorMode) {

        /**
         * A parent class for Realtime and LAD modes, which both advance the
         * time conductor bounds over time. The event that advances the time
         * conductor is abstracted to a TickSource. Unlike FixedMode, the
         * two 'follow' modes define 'deltas' which are offsets from a fixed
         * end point. Thus, in follow mode, the end time of the conductor is
         * the mode relevant, with both offsets defined relative to it.
         * @constructor
         */
        function FollowMode(metadata, conductor, timeSystems) {
            TimeConductorMode.call(this, metadata, conductor, timeSystems);

            this._deltas = undefined;
        }

        FollowMode.prototype = Object.create(TimeConductorMode.prototype);

        FollowMode.prototype.initialize = function () {
            TimeConductorMode.prototype.initialize.apply(this);
            this.conductor.follow(true);
        };

        /**
         * @private
         * @param time
         */
        FollowMode.prototype.tick = function (time) {
            var deltas = this.deltas();
            this.conductor.bounds({
                start: time - deltas.start,
                end: time + deltas.end
            });
        };

        /**
         * @private
         * @param tickSource
         */
        FollowMode.prototype.listenToTickSource = function () {
            if (this._selectedTimeSystem &&
                this._timeSystems[0]) {

                var tickSource = this._timeSystems[0].tickSources()[0];
                if (tickSource) {
                    this.tickSourceUnlisten = tickSource.listen(this.tick.bind(this));
                }
            }
        };

        /**
         * On time system change, default the bounds values in the time
         * conductor, using the deltas associated with this mode.
         * @param timeSystem
         * @returns {TimeSystem}
         */
        FollowMode.prototype.selectedTimeSystem = function (timeSystem) {
            TimeConductorMode.prototype.selectedTimeSystem.apply(this, arguments);

            if (timeSystem) {
                var defaults = timeSystem.defaults()[0];

                if (arguments.length > 0) {
                    var bounds = {
                        start: defaults.bounds.start,
                        end: defaults.bounds.end
                    };

                    if (defaults.deltas) {
                        bounds.start = bounds.end - defaults.deltas.start;
                        bounds.end = bounds.end + defaults.deltas.end;
                        this._deltas = JSON.parse(JSON.stringify(defaults.deltas));
                    }

                    this.conductor.timeSystem(timeSystem, bounds);

                    this.listenToTickSource();
                }
            }
            return this._selectedTimeSystem;
        };

        /**
         * Get or set the current value for the deltas used by this time system.
         * On change, the new deltas will be used to calculate and set the
         * bounds on the time conductor.
         * @param deltas
         * @returns {TimeSystemDeltas}
         */
        FollowMode.prototype.deltas = function (deltas) {
            if (arguments.length !== 0) {
                var oldEnd = this.conductor.bounds().end;

                if (this._deltas && this._deltas.end){
                    //Calculate the previous 'true' end value (without delta)
                    oldEnd = oldEnd - this._deltas.end;
                }

                this._deltas = deltas;

                var newBounds = {
                    start: oldEnd - this._deltas.start,
                    end: oldEnd + this._deltas.end
                };

                this.conductor.bounds(newBounds);
            }
            return this._deltas;
        };

        /**
         * Stop listening to tick sources
         */
        FollowMode.prototype.destroy = function () {
            if (this.tickSourceUnlisten) {
                this.tickSourceUnlisten();
            }
        };

        return FollowMode;
    }
);
