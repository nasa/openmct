/*global define*/

define(
    [],
    function () {
        "use strict";

        function MCTDrag($document) {
            var body = $document.find('body');

            function link(scope, element, attrs) {
                var initialPosition,
                    currentPosition,
                    delta;

                function fireListener(name) {
                    scope.$eval(attrs[name], { delta: delta });
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
                }

                function endDrag(event) {
                    body.off("mouseup", endDrag);
                    body.off("mousemove", continueDrag);

                    continueDrag(event);

                    fireListener("mctDragUp");
                }

                function startDrag(event) {
                    body.on("mouseup", endDrag);
                    body.on("mousemove", continueDrag);
                    updatePosition(event);
                    fireListener("mctDragDown");
                    fireListener("mctDrag");
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