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
    (TimerFormatter) => {

        let FORMATTER = new TimerFormatter();


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
        class TimerController {
          constructor($scope, $window, now) {
            let formatter,
                active = true,
                relativeTimestamp,
                lastTimestamp

            const update = () => {
                let timeDelta = lastTimestamp - relativeTimestamp;

                if (formatter && !isNaN(timeDelta)) {
                    this.textValue = formatter(timeDelta);
                    this.signValue = timeDelta < 0 ? "-" :
                        timeDelta >= 1000 ? "+" : "";
                    this.signCssClass = timeDelta < 0 ? "icon-minus" :
                        timeDelta >= 1000 ? "icon-plus" : "";
                } else {
                    this.textValue = "";
                    this.signValue = "";
                    this.signCssClass = "";
                }
            }

            const updateFormat = (key) => {
                formatter = FORMATTER[key] || FORMATTER.long;
            }

            const updateTimestamp = (timestamp) => {
                relativeTimestamp = timestamp;
            }

            const updateObject = (domainObject) => {
                let model = domainObject.getModel(),
                    timestamp = model.timestamp,
                    formatKey = model.timerFormat,
                    actionCapability = domainObject.getCapability('action'),
                    actionKey = (timestamp === undefined) ?
                            'timer.start' : 'timer.restart';

                updateFormat(formatKey);
                updateTimestamp(timestamp);

                this.relevantAction = actionCapability &&
                    actionCapability.getActions(actionKey)[0];

                update();
            }

            const handleObjectChange = (domainObject) => {
                if (domainObject) {
                    updateObject(domainObject);
                }
            }

            const handleModification = () => {
                handleObjectChange($scope.domainObject);
            }

            const tick = () => {
                let lastSign = this.signValue,
                    lastText = this.textValue;
                lastTimestamp = now();
                update();
                // We're running in an animation frame, not in a digest cycle.
                // We need to trigger a digest cycle if our displayable data
                // changes.
                if (lastSign !== this.signValue || lastText !== this.textValue) {
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
            $scope.$on('$destroy', () => {
                active = false;
            });

            this.$scope = $scope;
            this.signValue = '';
            this.textValue = '';
            this.updateObject = updateObject;
        }

        /**
         * Get the CSS class to display the right icon
         * for the start/restart button.
         * @returns {string} cssclass to display
         */
        buttonCssClass() {
            return this.relevantAction ?
                    this.relevantAction.getMetadata().cssclass : "";
        };

        /**
         * Get the text to show for the start/restart button
         * (e.g. in a tooltip)
         * @returns {string} name of the action
         */
        buttonText() {
            return this.relevantAction ?
                    this.relevantAction.getMetadata().name : "";
        };


        /**
         * Perform the action associated with the start/restart button.
         */
        clickButton() {
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
        sign() {
            return this.signValue;
        };

        /**
         * Get the sign (+ or -) of the current timer value, as
         * a CSS class.
         * @returns {string} sign of the current timer value
         */
        signClass() {
            return this.signCssClass;
        };

        /**
         * Get the text to display for the current timer value.
         * @returns {string} current timer value
         */
        text() {
            return this.textValue;
        };
      }
        return TimerController;
    }
);
