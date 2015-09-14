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
         */
        function TimerController($scope, $window, now) {
            var timerObject,
                relevantAction,
                sign = '',
                text = '',
                formatter,
                active = true,
                relativeTimestamp,
                lastTimestamp;

            function update() {
                var timeDelta = lastTimestamp - relativeTimestamp;

                if (formatter && !isNaN(timeDelta)) {
                    text = formatter(timeDelta);
                    sign = timeDelta < 0 ? "-" : timeDelta >= 1000 ? "+" : "";
                } else {
                    text = "";
                    sign = "";
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

                relevantAction = actionCapability &&
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
                var lastSign = sign, lastText = text;
                lastTimestamp = now();
                update();
                // We're running in an animation frame, not in a digest cycle.
                // We need to trigger a digest cycle if our displayable data
                // changes.
                if (lastSign !== sign || lastText !== text) {
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

            return {
                /**
                 * Get the glyph to display for the start/restart button.
                 * @returns {string} glyph to display
                 */
                buttonGlyph: function () {
                    return relevantAction ?
                            relevantAction.getMetadata().glyph : "";
                },
                /**
                 * Get the text to show for the start/restart button
                 * (e.g. in a tooltip)
                 * @returns {string} name of the action
                 */
                buttonText: function () {
                    return relevantAction ?
                            relevantAction.getMetadata().name : "";
                },
                /**
                 * Perform the action associated with the start/restart button.
                 */
                clickButton: function () {
                    if (relevantAction) {
                        relevantAction.perform();
                        updateObject($scope.domainObject);
                    }
                },
                /**
                 * Get the sign (+ or -) of the current timer value, as
                 * displayable text.
                 * @returns {string} sign of the current timer value
                 */
                sign: function () {
                    return sign;
                },
                /**
                 * Get the text to display for the current timer value.
                 * @returns {string} current timer value
                 */
                text: function () {
                    return text;
                }
            };
        }

        return TimerController;
    }
);
