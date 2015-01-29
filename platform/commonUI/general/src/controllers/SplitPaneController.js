/*global define*/

define(
    [],
    function () {
        "use strict";

        function SplitPaneController() {
            var minimum = 120,
                maximum = 600,
                current = 200,
                start = 200,
                style;

            function updateStyle() {
                style = { left: current + 'px' };
            }

            updateStyle();

            return {
                style: function () {
                    return style;
                },
                state: function () {
                    return current;
                },
                startMove: function () {
                    start = current;
                },
                move: function (delta) {
                    current = Math.min(
                        maximum,
                        Math.max(minimum, start + delta)
                    );
                    updateStyle();
                }
            };
        }

        return SplitPaneController;
    }
);