/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/EmbeddedPageController"],
    function (EmbeddedPageController) {
        "use strict";

        describe("The controller for embedded pages", function () {
            var mockSCE,
                controller;

            beforeEach(function () {
                mockSCE = jasmine.createSpyObj(
                    '$sce',
                    ["trustAsResourceUrl"]
                );

                mockSCE.trustAsResourceUrl.andCallFake(function (v) {
                    return v;
                });

                controller = new EmbeddedPageController(mockSCE);
            });

            it("allows URLs to be marked as trusted", function () {
                var testURL = "http://www.nasa.gov";

                expect(controller.trust(testURL))
                    .toEqual(testURL);

                expect(mockSCE.trustAsResourceUrl)
                    .toHaveBeenCalledWith(testURL);
            });

        });
    }
);
