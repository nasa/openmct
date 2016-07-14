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

        var FIFTEEN_MINUTES = 15 * 60 * 1000;

        function TimeConductorController($scope, $timeout, conductor) {
            var self = this;

            this.$scope = $scope;
            this.$timeout = $timeout;
            this.conductor = conductor;
            this.startDelta = FIFTEEN_MINUTES;
            this.endDelta = 0;

            this.changing = {
                'start': false,
                'end': false
            };

            $scope.formModel = {
                startDelta: this.startDelta,
                endDelta: this.endDelta
            };

            conductor.on('bounds', function (bounds) {
                if (!self.changing['start']) {
                    $scope.formModel.start = bounds.start;
                }
                if (!self.changing['end']) {
                    $scope.formModel.end = bounds.end;
                }
            });

            conductor.on('follow', function (follow){
                $scope.followMode = follow;
            });

            Object.keys(TimeConductorController.prototype).filter(function (key) {
                return typeof TimeConductorController.prototype[key] === 'function';
            }).forEach(function (key) {
                self[key] = self[key].bind(self);
            });

            $scope.$watch('modeModel.selected', this.switchMode);

            $scope.modeModel = {
                selected: 'fixed',
                options: {
                    'fixed': {
                        glyph: '\ue604',
                        label: 'Fixed',
                        name: 'Fixed Timespan Mode',
                        description: 'Query and explore data that falls between two fixed datetimes.'
                    },
                    'realtime': {
                        glyph: '\u0043',
                        label: 'Real-time',
                        name: 'Real-time Mode',
                        description: 'Monitor real-time streaming data as it comes in. The Time Conductor and displays will automatically advance themselves based on a UTC clock.'
                    },
                    'latest': {
                        glyph: '\u0044',
                        label: 'LAD',
                        name: 'LAD Mode',
                        description: 'Latest Available Data mode monitors real-time streaming data as it comes in. The Time Conductor and displays will only advance when data becomes available.'
                    }
                }
            }

            $scope.$on('$destroy', function() {
                if (self.mode) {
                    self.mode();
                }
            });

            self.initialize();
        }

        TimeConductorController.prototype.initialize = function () {
            var now = Math.ceil(Date.now() / 1000) * 1000;
            //Set the time conductor to some default
            this.conductor.bounds({start: now - FIFTEEN_MINUTES, end: now});

            this.$scope.modeModel.selected = 'fixed';
            this.conductor.follow(false);
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

        TimeConductorController.prototype.validateStartDelta = function (startDelta) {
            return startDelta > 0;
        };

        TimeConductorController.prototype.validateEndDelta = function (endDelta) {
            return endDelta >= 0;
        };

        TimeConductorController.prototype.validateDeltas = function (formModel) {
            // Validate that start Delta is some non-zero value, and that end
            // delta is zero or positive (ie. 'now' or some time in the future).
            return this.validateStartDelta(formModel.startDelta) && this.validateEndDelta(formModel.endDelta);
        };

        TimeConductorController.prototype.updateDeltasFromForm = function (formModel) {

            if (this.validateDeltas(formModel)) {
                //Calculate the previous 'true' end value (without delta)
                var oldEnd = this.conductor.bounds().end - this.endDelta || 0;

                this.startDelta = formModel.startDelta;
                this.endDelta = formModel.endDelta;

                var newBounds = {
                    start: oldEnd - this.startDelta,
                    end: oldEnd + this.endDelta
                };

                this.conductor.bounds(newBounds);
            }
        };

        TimeConductorController.prototype.switchMode = function (newMode) {
            if (this.mode) {
                this.mode();
            }
            this.mode = TimeConductorController.modes[newMode].call(this);
        };

        TimeConductorController.modes = {
            'fixed': function () {
                this.conductor.follow(false);
            },
            'realtime': function () {
                var tickInterval = 1000;
                var conductor = this.conductor;
                var $timeout = this.$timeout;
                var self = this;

                conductor.follow(true);
                setBoundsToNow(self.startDelta, self.endDelta);

                var timeoutPromise = $timeout(tick, tickInterval);

                function setBoundsToNow(startDelta, endDelta) {
                    var now = Math.ceil(Date.now() / 1000) * 1000;
                    conductor.bounds({start: now - startDelta, end: now + endDelta});
                }

                function tick() {
                    setBoundsToNow(self.startDelta, self.endDelta);
                    timeoutPromise = $timeout(tick, tickInterval)
                }

                return function destroy() {
                    $timeout.cancel(timeoutPromise);
                }
            },
            'latest': function () {
                //Don't know what to do here yet...
                this.conductor.follow(true);
            }
        };

        return TimeConductorController;
    }
);
