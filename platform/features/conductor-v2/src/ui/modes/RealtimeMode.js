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
    ['./FollowMode'],
    function (FollowMode) {

        /**
         * Class representing the 'realtime' mode of the time conductor.
         * This is a special case of FollowMode that only supports 'clock'
         * type tick sources.
         * @param conductor
         * @param timeSystems
         * @constructor
         */
        function RealtimeMode(conductor, timeSystems) {
            var metadata = {
                key: 'realtime',
                glyph: '\u0043',
                label: 'Real-time',
                name: 'Real-time Mode',
                description: 'Monitor real-time streaming data as it comes in. The Time Conductor and displays will automatically advance themselves based on a UTC clock.'
            };
            var filteredTimeSystems = timeSystems.filter(function (timeSystem){
                return timeSystem.tickSources().some(function (tickSource){
                    return tickSource.type() === 'clock';
                });
            });
            FollowMode.call(this, metadata, conductor, filteredTimeSystems);
        }

        RealtimeMode.prototype = Object.create(FollowMode.prototype);

        return RealtimeMode;
    }
);
