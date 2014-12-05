/*global define*/

define(
    [],
    function () {
        "use strict";

        function MCTDrag($document) {

            function link(scope, element, attrs) {
                var body = $document.find('body'),
                    initialPosition,
                    currentPosition,
                    delta;

                function fireListener(name) {
                    scope.$eval(attrs[name], { delta: delta });

                    // Trigger prompt digestion
                    scope.$apply();
                }

                function updatePosition(event) {
                    currentPosition = [ event.pageX, event.pageY ];
                    initialPosition = initialPosition || currentPosition;
                    delta = currentPosition.map(function (v, i) {
                        return v - initialPosition[i];
                    });
                }

                function continueDrag(event) {
                    updatePosition(event);
                    fireListener("mctDrag");

                    // Don't show selection highlights, etc
                    event.preventDefault();
                    return false;
                }

                function endDrag(event) {
                    body.off("mouseup", endDrag);
                    body.off("mousemove", continueDrag);

                    continueDrag(event);

                    fireListener("mctDragUp");

                    // Clear out start-of-drag position
                    initialPosition = undefined;

                    // Don't show selection highlights, etc
                    event.preventDefault();
                    return false;
                }

                function startDrag(event) {
                    body.on("mouseup", endDrag);
                    body.on("mousemove", continueDrag);

                    updatePosition(event);

                    fireListener("mctDragDown");
                    fireListener("mctDrag");

                    // Don't show selection highlights, etc
                    event.preventDefault();
                    return false;
                }

                element.on("mousedown", startDrag);
            }

            return {
                restrict: "A",
                link: link
            };
        }

        return MCTDrag;
    }
);