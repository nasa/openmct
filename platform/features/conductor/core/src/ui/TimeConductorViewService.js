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
    [
        'EventEmitter'
    ],
    function (EventEmitter) {

        /**
         * The TimeConductorViewService acts as an event bus between different
         * elements of the Time Conductor UI. Zooming and panning occur via this
         * service, as they are specific behaviour of the UI, and not general
         * functions of the time API.
         *
         * Synchronization of conductor state between the Time API and the URL
         * also occurs from the conductor view service, whose lifecycle persists
         * between view changes.
         *
         * @memberof platform.features.conductor
         * @param conductor
         * @constructor
         */
        function TimeConductorViewService(openmct) {

            EventEmitter.call(this);

            this.timeAPI = openmct.time;
        }

        TimeConductorViewService.prototype = Object.create(EventEmitter.prototype);

        /**
         * An event to indicate that zooming is taking place
         * @event platform.features.conductor.TimeConductorViewService~zoom
         * @property {ZoomLevel} zoom the new zoom level.
         */
        /**
         * Zoom to given time span. Will fire a zoom event with new zoom
         * bounds. Zoom bounds emitted in this way are considered ephemeral
         * and should be overridden by any time conductor bounds events. Does
         * not set bounds globally.
         * @param {number} zoom A time duration in ms
         * @fires platform.features.conductor.TimeConductorViewService~zoom
         * @see module:openmct.TimeConductor#bounds
         */
        TimeConductorViewService.prototype.zoom = function (timeSpan) {
            var zoom = {};

            // If a tick source is defined, then the concept of 'now' is
            // important. Calculate zoom based on 'now'.
            if (this.timeAPI.clock() !== undefined) {
                zoom.offsets = {
                    start: -timeSpan,
                    end: this.timeAPI.clockOffsets().end
                };

                var currentVal = this.timeAPI.clock().currentValue();

                zoom.bounds = {
                    start: currentVal + zoom.offsets.start,
                    end: currentVal + zoom.offsets.end
                };
            } else {
                var bounds = this.timeAPI.bounds();
                var center = bounds.start + ((bounds.end - bounds.start)) / 2;
                bounds.start = center - timeSpan / 2;
                bounds.end = center + timeSpan / 2;
                zoom.bounds = bounds;
            }

            this.emit("zoom", zoom);
            return zoom;
        };

        return TimeConductorViewService;
    }
);
