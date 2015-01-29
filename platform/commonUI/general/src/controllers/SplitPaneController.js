/*global define*/

define(
    [],
    function () {
        "use strict";

        function SplitPaneController() {
            var minimum = 8,
                maximum = 600,
                current = 200,
                style;

            function updateStyle() {
                style = { left: current + 'px' };
            }

            updateStyle();

            return {
                style: function () {
                    return style;
                },
                move: function (delta) {
                    current = Math.min(
                        maximum,
                        Math.max(minimum, current + delta)
                    );
                    updateStyle();
                }
            };
        }

        return SplitPaneController;
    }
);