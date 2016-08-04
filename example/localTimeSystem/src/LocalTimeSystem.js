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
    '../../../platform/features/conductor-v2/conductor/src/timeSystems/TimeSystem',
    '../../../platform/features/conductor-v2/conductor/src/timeSystems/LocalClock'
], function (TimeSystem, LocalClock) {
    var FIFTEEN_MINUTES = 15 * 60 * 1000,
        DEFAULT_PERIOD = 1000;

    /**
     * This time system supports UTC dates and provides a ticking clock source.
     * @implements TimeSystem
     * @constructor
     */
    function LocalTimeSystem ($timeout) {
        TimeSystem.call(this);

        /**
         * Some metadata, which will be used to identify the time system in
         * the UI
         * @type {{key: string, name: string, glyph: string}}
         */
        this.metadata = {
            'key': 'local',
            'name': 'Local',
            'glyph': '\u0043'
        };

        this._formats = ['local-format'];
        this._tickSources = [new LocalClock($timeout, DEFAULT_PERIOD)];
    }

    LocalTimeSystem.prototype = Object.create(TimeSystem.prototype);

    LocalTimeSystem.prototype.formats = function () {
        return this._formats;
    };

    LocalTimeSystem.prototype.deltaFormat = function () {
        return 'duration';
    };

    LocalTimeSystem.prototype.tickSources = function () {
        return this._tickSources;
    };

    LocalTimeSystem.prototype.defaults = function () {
        var now = Math.ceil(Date.now() / 1000) * 1000;
        return [
            {
                key: 'local-default',
                name: 'Local 12 hour time system defaults',
                deltas: {start: FIFTEEN_MINUTES, end: 0},
                bounds: {start: now - FIFTEEN_MINUTES, end: now}
            }
        ];
    };

    return LocalTimeSystem;
});
