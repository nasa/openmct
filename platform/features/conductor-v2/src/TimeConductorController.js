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

        var SIX_HOURS = 6 * 60 * 60 * 1000;

        function TimeConductorController($scope, $timeout, conductor) {
            var self = this;

            this.$scope = $scope;
            this.$timeout = $timeout;
            this.conductor = conductor;

            $scope.formModel = {};
            $scope.modeSelector = {
                value: 'fixed'
            };

            conductor.on('bounds', function (bounds) {
                $scope.formModel = {
                    start: bounds.start,
                    end: bounds.end
                };
            });

            conductor.on('follow', function (follow){
                $scope.followMode = follow;
            });

            Object.keys(TimeConductorController.prototype).filter(function (key) {
                return typeof TimeConductorController.prototype[key] === 'function';
            }).forEach(function (key) {
                self[key] = self[key].bind(self);
            });

            //Temporary workaround for resizing issue
            $timeout(self.initialize, 1000);

            $scope.$watch('modeModel.selected', this.switchMode);

            $scope.modeModel = {
                selected: 'fixed',
                options: [
                    {
                        key: 'fixed',
                        glyph: '\ue604',
                        label: 'Fixed Timespan',
                        name: 'Fixed Timespan Mode',
                        description: 'Query and explore data that falls between two fixed datetimes.'
                    },
                    {
                        key: 'realtime',
                        glyph: '\u0043',
                        label: 'Real-time',
                        name: 'Real-time Mode',
                        description: 'Monitor real-time streaming data as it comes in. The Time Conductor and displays will automatically advance themselves based on a UTC clock.'
                    },
                    {
                        key: 'latest',
                        glyph: '\u0044',
                        label: 'LAD',
                        name: 'LAD Mode',
                        description: 'Latest Available Data mode monitors real-time streaming data as it comes in. The Time Conductor and displays will only advance when data becomes available.'
                    }
                ]
            }
        }

        TimeConductorController.prototype.initialize = function () {
            var now = Math.ceil(Date.now() / 1000) * 1000;
            //Set the time conductor to some default
            this.conductor.bounds({start: now - SIX_HOURS, end: now});
        };

        TimeConductorController.prototype.validateStart = function (start) {
            var bounds = this.conductor.bounds();
            return this.conductor.validateBounds({start: start, end: bounds.end}) === true;
        };

        TimeConductorController.prototype.validateEnd = function (end) {
            var bounds = this.conductor.bounds();
            return this.conductor.validateBounds({start: bounds.start, end: end}) === true;
        };

        TimeConductorController.prototype.updateBoundsFromForm = function (formModel) {
            var newBounds = {start: formModel.start, end: formModel.end};

            if (this.conductor.validateBounds(newBounds) === true) {
                this.conductor.bounds(newBounds);
            }
        };

        TimeConductorController.prototype.switchMode = function (newMode) {
            if (this.mode) {
                this.mode();
            }
            this.mode = TimeConductorController.modes[newMode].call(this, this.conductor);
        };

        TimeConductorController.modes = {
            'fixed': function (conductor) {
                conductor.follow(false);
            },
            'realtime': function (conductor) {
                var tickInterval = 1000;
                var $timeout = this.$timeout;
                var timeoutPromise = $timeout(tick, tickInterval);

                conductor.follow(true);

                function tick() {
                    var bounds = conductor.bounds();
                    var interval = bounds.end - bounds.start;
                    var now = Math.ceil(Date.now() / 1000) * 1000;
                    conductor.bounds({start: now - interval, end: now});

                    timeoutPromise = $timeout(tick, tickInterval)
                }

                return function destroy() {
                    $timeout.cancel(timeoutPromise);
                }
            },
            'latest': function (conductor) {
                //Don't know what to do here yet...
                conductor.follow(true);
            }
        };

        return TimeConductorController;
    }
);
