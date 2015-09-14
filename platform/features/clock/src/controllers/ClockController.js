/*global define*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        /**
         * Controller for views of a Clock domain object.
         *
         * @constructor
         */
        function ClockController($scope, tickerService) {
            var text,
                ampm,
                use24,
                lastTimestamp,
                unlisten,
                timeFormat;

            function update() {
                var m = moment.utc(lastTimestamp);
                text = timeFormat && m.format(timeFormat);
                ampm = m.format("A"); // Just the AM or PM part
            }

            function tick(timestamp) {
                lastTimestamp = timestamp;
                update();
            }

            function updateFormat(clockFormat) {
                var baseFormat;

                if (clockFormat !== undefined) {
                    baseFormat = clockFormat[0];

                    use24 = clockFormat[1] === 'clock24';
                    timeFormat = use24 ?
                            baseFormat.replace('hh', "HH") : baseFormat;

                    update();
                }
            }
            // Pull in the clock format from the domain object model
            $scope.$watch('model.clockFormat', updateFormat);

            // Listen for clock ticks ... and stop listening on destroy
            unlisten = tickerService.listen(tick);
            $scope.$on('$destroy', unlisten);

            return {
                /**
                 * Get the clock's time zone, as displayable text.
                 * @returns {string}
                 */
                zone: function () {
                    return "UTC";
                },
                /**
                 * Get the current time, as displayable text.
                 * @returns {string}
                 */
                text: function () {
                    return text;
                },
                /**
                 * Get the text to display to qualify a time as AM or PM.
                 * @returns {string}
                 */
                ampm: function () {
                    return use24 ? '' : ampm;
                }
            };
        }

        return ClockController;
    }
);
