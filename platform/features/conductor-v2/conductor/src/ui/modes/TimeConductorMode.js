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
    [],
    function () {

        /**
         * Supports mode-specific time conductor behavior. This class
         * defines a parent with default behavior that specific modes are
         * expected to override.
         *
         * @interface
         * @constructor
         * @param {TimeConductorMetadata} metadata
         */
        function TimeConductorMode(conductor, timeSystem, key) {
            this.conductor = conductor;
            this._timeSystem = timeSystem;
            this._key = key;
        }

        /**
         * Function is called when mode becomes active (ie. is selected)
         */
        TimeConductorMode.prototype.initialize = function () {
            this.timeSystem(this._timeSystem);
        };

        /**
         * Get or set the currently selected time system
         * @param timeSystem
         * @returns {TimeSystem} the currently selected time system
         */
        TimeConductorMode.prototype.timeSystem = function (timeSystem) {
            if (arguments.length > 0) {
                this._timeSystem = timeSystem;
            }
            return this._timeSystem;
        };

        TimeConductorMode.prototype.key = function () {
            return this._key;
        };

        TimeConductorMode.prototype.defaults = function () {
            var timeSystem = this.timeSystem(),
                key = this.key();

            if (timeSystem) {
                return timeSystem.defaults(key);
            }
        };

        TimeConductorMode.prototype.destroy = function () {
        };

        return TimeConductorMode;
    }
);
