/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTIncudeSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/OverlayService"],
    function (OverlayService) {
        "use strict";

        describe("The overlay service", function () {
            var mockDocument,
                mockCompile,
                mockRootScope,
                mockBody,
                mockTemplate,
                mockElement,
                mockScope,
                overlayService;

            beforeEach(function () {
                mockDocument = jasmine.createSpyObj("$document", [ "find" ]);
                mockCompile = jasmine.createSpy("$compile");
                mockRootScope = jasmine.createSpyObj("$rootScope", [ "$new" ]);
                mockBody = jasmine.createSpyObj("body", [ "prepend" ]);
                mockTemplate = jasmine.createSpy("template");
                mockElement = jasmine.createSpyObj("element", [ "remove" ]);
                mockScope = jasmine.createSpyObj("scope", [ "$destroy" ]);

                mockDocument.find.andReturn(mockBody);
                mockCompile.andReturn(mockTemplate);
                mockRootScope.$new.andReturn(mockScope);
                mockTemplate.andReturn(mockElement);

                overlayService = new OverlayService(
                    mockDocument,
                    mockCompile,
                    mockRootScope
                );
            });

            it("prepends an mct-include to create overlays", function () {
                overlayService.createOverlay("test", {});
                expect(mockCompile).toHaveBeenCalled();
                expect(mockCompile.mostRecentCall.args[0].indexOf("mct-include"))
                    .not.toEqual(-1);
            });

            it("adds the templated element to the body", function () {
                overlayService.createOverlay("test", {});
                expect(mockBody.prepend).toHaveBeenCalledWith(mockElement);
            });

            it("places the provided model/key in its template's scope", function () {
                overlayService.createOverlay("test", { someKey: 42 });
                expect(mockScope.overlay).toEqual({ someKey: 42 });
                expect(mockScope.key).toEqual("test");

                // Make sure this is actually what was rendered, too
                expect(mockTemplate).toHaveBeenCalledWith(mockScope);
            });

            it("removes the prepended element on request", function () {
                var overlay = overlayService.createOverlay("test", {});

                // Verify precondition
                expect(mockElement.remove).not.toHaveBeenCalled();
                expect(mockScope.$destroy).not.toHaveBeenCalled();

                // Dismiss the overlay
                overlay.dismiss();

                // Now it should have been removed, and the scope destroyed
                expect(mockElement.remove).toHaveBeenCalled();
                expect(mockScope.$destroy).toHaveBeenCalled();
            });

        });
    }
);