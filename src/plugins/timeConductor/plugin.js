/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define([], function () {

    return function (config) {

        function validateConfiguration() {
            if (config === undefined || config.menuOptions === undefined || config.menuOptions.length === 0) {
                return "Please provide some configuration for the time conductor. https://github.com/nasa/openmct/blob/master/API.md#time-conductor";
            }
            return undefined;
        }

        return function (openmct) {

            function getTimeSystem(key) {
                return openmct.time.getAllTimeSystems().filter(function (timeSystem) {
                    return timeSystem.key === key;
                })[0];
            }

            var validationError = validateConfiguration();
            if (validationError) {
                throw validationError;
            }

            openmct.legacyExtension('constants', {
                key: 'CONDUCTOR_CONFIG',
                value: config,
                priority: 'mandatory'
            });

            openmct.legacyRegistry.enable('platform/features/conductor/core');
            openmct.legacyRegistry.enable('platform/features/conductor/compatibility');

            openmct.on('start', function () {
                /*
                 On app startup, default the conductor
                 */
                var timeSystem = openmct.time.timeSystem();
                var clock = openmct.time.clock();

                if (timeSystem === undefined) {
                    timeSystem = getTimeSystem(config.menuOptions[0].timeSystem);
                    if (timeSystem === undefined) {
                        throw 'Please install and configure at least one time system';
                    }
                }

                var configForTimeSystem = config.menuOptions.filter(function (menuOption) {
                    return menuOption.timeSystem === timeSystem.key && menuOption.clock === (clock && clock.key);
                })[0];

                if (configForTimeSystem !== undefined) {
                    var bounds;
                    if (clock === undefined) {
                        bounds = configForTimeSystem.bounds;
                    } else {
                        var clockOffsets = configForTimeSystem.clockOffsets;

                        bounds = {
                            start: clock.currentValue() + clockOffsets.start,
                            end: clock.currentValue() + clockOffsets.end
                        }
                    }
                    openmct.time.timeSystem(timeSystem, bounds);
                } else {
                    throw 'Invalid time conductor configuration. Please define defaults for time system "' + timeSystem.key + '"';
                }
            });
        }
    }
});
