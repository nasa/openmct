/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../src/LayoutController"],
    function (LayoutController) {
        "use strict";

        describe("The Layout controller", function () {
            var mockScope,
                testModel,
                testConfiguration,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch" ]
                );

                testModel = {
                    composition: [ "a", "b", "c" ]
                };

                testConfiguration = {
                    panels: {
                        a: {
                            position: [20, 10],
                            dimensions: [5, 5]
                        }
                    }
                };

                mockScope.model = testModel;
                mockScope.configuration = testConfiguration;

                controller = new LayoutController(mockScope);
            });

            // Model changes will indicate that panel positions
            // may have changed, for instance.
            it("watches for changes to model", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "model",
                    jasmine.any(Function)
                );
            });

            it("provides styles for frames, from configuration", function () {
                mockScope.$watch.mostRecentCall.args[1](testModel);
                expect(controller.getFrameStyle("a")).toEqual({
                    top: "320px",
                    left: "640px",
                    width: "160px",
                    height: "160px"
                });
            });

            it("provides default styles for frames", function () {
                var styleB, styleC;

                // b and c do not have configured positions
                mockScope.$watch.mostRecentCall.args[1](testModel);

                styleB = controller.getFrameStyle("b");
                styleC = controller.getFrameStyle("c");

                // Should have a position, but we don't care what
                expect(styleB.left).toBeDefined();
                expect(styleB.top).toBeDefined();
                expect(styleC.left).toBeDefined();
                expect(styleC.top).toBeDefined();

                // Should have ensured some difference in position
                expect(styleB).not.toEqual(styleC);
            });

            it("allows panels to be dragged", function () {
                // Populate scope
                mockScope.$watch.mostRecentCall.args[1](testModel);

                // Verify precondtion
                expect(testConfiguration.panels.b).not.toBeDefined();

                // Do a drag
                controller.startDrag("b", [1, 1], [0, 0]);
                controller.continueDrag([100, 100]);
                controller.endDrag();

                // We do not look closely at the details here;
                // that is tested in LayoutDragSpec. Just make sure
                // that a configuration for b has been defined.
                expect(testConfiguration.panels.b).toBeDefined();
            });
        });
    }
);