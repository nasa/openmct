/*global define*/

define(
    [],
    function () {
        "use strict";

        // Default resize interval
        var DEFAULT_INTERVAL = 100;

        /**
         * The mct-resize directive allows the size of a displayed
         * HTML element to be tracked. This is done by polling,
         * since the DOM API does not currently provide suitable
         * events to watch this reliably.
         *
         * Attributes related to this directive are interpreted as
         * follows:
         *
         * * `mct-resize`: An Angular expression to evaluate when
         *   the size changes; the variable `bounds` will be provided
         *   with two fields, `width` and `height`, both in pixels.
         * * `mct-resize-interval`: Optional; the interval, in milliseconds,
         *   at which to watch for updates. In some cases checking for
         *   resize can carry a cost (it forces recalculation of
         *   positions within the document) so it may be preferable to watch
         *   infrequently. If omitted, a default of 100ms will be used.
         *   This is an Angular expression, and it will be re-evaluated after
         *   each interval.
         *
         * @constructor
         *
         */
        function MCTResize($timeout) {

            // Link; start listening for changes to an element's size
            function link(scope, element, attrs) {
                var lastBounds;

                // Determine how long to wait before the next update
                function currentInterval() {
                    return attrs.mctResizeInterval ?
                            scope.$eval(attrs.mctResizeInterval) :
                            DEFAULT_INTERVAL;
                }

                // Evaluate mct-resize with the current bounds
                function fireEval(bounds) {
                    // Only update when bounds actually change
                    if (!lastBounds ||
                            lastBounds.width !== bounds.width ||
                            lastBounds.height !== bounds.height) {
                        scope.$eval(attrs.mctResize, { bounds: bounds });
                        lastBounds = bounds;
                    }
                }

                // Callback to fire after each timeout;
                // update bounds and schedule another timeout
                function onInterval() {
                    fireEval({
                        width: element[0].offsetWidth,
                        height: element[0].offsetHeight
                    });
                    $timeout(onInterval, currentInterval());
                }

                // Handle the initial callback
                onInterval();
            }

            return {
                // mct-resize only makes sense as an attribute
                restrict: "A",
                // Link function, to begin watching for changes
                link: link
            };
        }

        return MCTResize;
    }
);