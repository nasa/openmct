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
         * Handles time conductor behavior when it is in 'fixed' mode. In
         * fixed mode, the time conductor is bound by two dates and does not
         * progress.
         * @param conductor
         * @param timeSystems
         * @constructor
         */
        function FixedMode(conductor, timeSystems) {
            TimeConductorMode.call(this, conductor, timeSystems);
        }

        FixedMode.prototype = Object.create(TimeConductorMode.prototype);

        FixedMode.prototype.initialize = function () {
            TimeConductorMode.prototype.initialize.apply(this);
            this.conductor.follow(false);
        };

        /**
         * Defines behavior to occur when selected time system changes. In
         * this case, sets default bounds on the time conductor.
         * @param timeSystem
         * @returns {*}
         */
        FixedMode.prototype.selectedTimeSystem = function (timeSystem){
            TimeConductorMode.prototype.selectedTimeSystem.apply(this, arguments);

            if (timeSystem) {
                var defaults = timeSystem.defaults()[0];

                var bounds = {
                    start: defaults.bounds.start,
                    end: defaults.bounds.end
                };

                this.conductor.timeSystem(timeSystem, bounds);
            }
            return this._selectedTimeSystem;
        };

        return FixedMode;
    }
);
