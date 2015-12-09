/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define*/

define(
    ['./TimerFormatter'],
    function (TimerFormatter) {
        "use strict";

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
            var timerObject,
                formatter,
                active = true,
                relativeTimestamp,
                lastTimestamp,
                self = this;

            function update() {
                var timeDelta = lastTimestamp - relativeTimestamp;

                if (formatter && !isNaN(timeDelta)) {
                    self.textValue = formatter(timeDelta);
                    self.signValue = timeDelta < 0 ? "-" :
                            timeDelta >= 1000 ? "+" : "";
                } else {
                    self.textValue = "";
                    self.signValue = "";
                }
            }

            function updateFormat(key) {
                formatter = FORMATTER[key] || FORMATTER.long;
            }

            function updateTimestamp(timestamp) {
                relativeTimestamp = timestamp;
            }

            function updateObject(domainObject) {
                var model = domainObject.getModel(),
                    timestamp = model.timestamp,
                    formatKey = model.timerFormat,
                    actionCapability = domainObject.getCapability('action'),
                    actionKey = (timestamp === undefined) ?
                            'timer.start' : 'timer.restart';

                updateFormat(formatKey);
                updateTimestamp(timestamp);

                self.relevantAction = actionCapability &&
                    actionCapability.getActions(actionKey)[0];

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
                lastTimestamp = now();
                update();
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
         * Get the glyph to display for the start/restart button.
         * @returns {string} glyph to display
         */
        TimerController.prototype.buttonGlyph = function () {
            return this.relevantAction ?
                    this.relevantAction.getMetadata().glyph : "";
        };

        /**
         * Get the text to show for the start/restart button
         * (e.g. in a tooltip)
         * @returns {string} name of the action
         */
        TimerController.prototype.buttonText = function () {
            return this.relevantAction ?
                    this.relevantAction.getMetadata().name : "";
        };


        /**
         * Perform the action associated with the start/restart button.
         */
        TimerController.prototype.clickButton = function () {
            if (this.relevantAction) {
                this.relevantAction.perform();
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
         * Get the text to display for the current timer value.
         * @returns {string} current timer value
         */
        TimerController.prototype.text = function () {
            return this.textValue;
        };

        return TimerController;
    }
);
