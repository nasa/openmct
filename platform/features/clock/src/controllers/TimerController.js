/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define(
    ['./TimerFormatter'],
    function (TimerFormatter) {

        var FORMATTER = new TimerFormatter();

        /**
         * Controller for views of a Timer domain object.
         *
         * @constructor
         * @memberof platform/features/clock
         * @param {angular.Scope} $scope the Angular scope
         * @param $window Angular-provided window object
         * @param {Function} now a function which returns the current
         *        time (typically wrapping `Date.now`)
         */
        function TimerController($scope, $window, now) {
            var formatter,
                active = true,
                relativeTimestamp,
                lastTimestamp,
                relativeTimerState,
                self = this;

            function update() {
                var timeDelta = lastTimestamp - relativeTimestamp;

                if (formatter && !isNaN(timeDelta)) {
                    self.textValue = formatter(timeDelta);
                    self.signValue = timeDelta < 0 ? "-"
                        : timeDelta >= 1000 ? "+" : "";
                    self.signCssClass = timeDelta < 0 ? "icon-minus"
                        : timeDelta >= 1000 ? "icon-plus" : "";
                } else {
                    self.textValue = "";
                    self.signValue = "";
                    self.signCssClass = "";
                }
            }

            function updateFormat(key) {
                formatter = FORMATTER[key] || FORMATTER.long;
            }

            function updateTimestamp(timestamp) {
                relativeTimestamp = timestamp;
            }

            function updateTimerState(timerState) {
                self.timerState = relativeTimerState = timerState;
            }

            function updateActions(actionCapability, actionKey) {
                self.relevantAction = actionCapability
                    && actionCapability.getActions(actionKey)[0];

                self.stopAction = relativeTimerState !== 'stopped'
                    ? actionCapability && actionCapability.getActions('timer.stop')[0] : undefined;

            }

            function isPaused() {
                return relativeTimerState === 'paused';
            }

            function handleLegacyTimer(model) {
                if (model.timerState === undefined) {
                    model.timerState = model.timestamp === undefined
                        ? 'stopped' : 'started';
                }
            }

            function updateObject(domainObject) {
                var model = domainObject.getModel();
                handleLegacyTimer(model);

                var timestamp = model.timestamp,
                    formatKey = model.timerFormat,
                    timerState = model.timerState,
                    actionCapability = domainObject.getCapability('action'),
                    actionKey = (timerState !== 'started')
                        ? 'timer.start' : 'timer.pause';

                updateFormat(formatKey);
                updateTimestamp(timestamp);
                updateTimerState(timerState);
                updateActions(actionCapability, actionKey);

                //if paused on startup show last known position
                if (isPaused() && !lastTimestamp) {
                    lastTimestamp = model.pausedTime;
                }

                update();
            }

            function handleObjectChange(domainObject) {
                if (domainObject) {
                    updateObject(domainObject);
                }
            }

            function handleModification() {
                handleObjectChange($scope.domainObject);
            }

            function tick() {
                var lastSign = self.signValue,
                    lastText = self.textValue;

                if (!isPaused()) {
                    lastTimestamp = now();
                    update();
                }

                if (relativeTimerState === undefined) {
                    handleModification();
                }

                // We're running in an animation frame, not in a digest cycle.
                // We need to trigger a digest cycle if our displayable data
                // changes.
                if (lastSign !== self.signValue || lastText !== self.textValue) {
                    $scope.$apply();
                }

                if (active) {
                    $window.requestAnimationFrame(tick);
                }
            }

            $window.requestAnimationFrame(tick);

            // Pull in the timer format from the domain object model
            $scope.$watch('domainObject', handleObjectChange);
            $scope.$watch('model.modified', handleModification);

            // When the scope is destroyed, stop requesting anim. frames
            $scope.$on('$destroy', function () {
                active = false;
            });

            this.$scope = $scope;
            this.signValue = '';
            this.textValue = '';
            this.updateObject = updateObject;
        }

        /**
         * Get the CSS class to display the right icon
         * for the start/pause button.
         * @returns {string} cssclass to display
         */
        TimerController.prototype.buttonCssClass = function () {
            return this.relevantAction
                ? this.relevantAction.getMetadata().cssClass : "";
        };

        /**
         * Get the text to show for the start/pause button
         * (e.g. in a tooltip)
         * @returns {string} name of the action
         */
        TimerController.prototype.buttonText = function () {
            return this.relevantAction
                ? this.relevantAction.getMetadata().name : "";
        };

        /**
         * Perform the action associated with the start/pause button.
         */
        TimerController.prototype.clickButton = function () {
            if (this.relevantAction) {
                this.relevantAction.perform();
                this.updateObject(this.$scope.domainObject);
            }
        };

        /**
         * Perform the action associated with the stop button.
         */
        TimerController.prototype.clickStopButton = function () {
            if (this.stopAction) {
                this.stopAction.perform();
                this.updateObject(this.$scope.domainObject);
            }
        };

        /**
         * Get the sign (+ or -) of the current timer value, as
         * displayable text.
         * @returns {string} sign of the current timer value
         */
        TimerController.prototype.sign = function () {
            return this.signValue;
        };

        /**
         * Get the sign (+ or -) of the current timer value, as
         * a CSS class.
         * @returns {string} sign of the current timer value
         */
        TimerController.prototype.signClass = function () {
            return this.signCssClass;
        };

        /**
         * Get the text to display for the current timer value.
         * @returns {string} current timer value
         */
        TimerController.prototype.text = function () {
            return this.textValue;
        };

        return TimerController;
    }
);
