/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ['../src/AboutController'],
    function (AboutController) {
        "use strict";

        describe("The About controller", function () {
            var testVersions,
                mockWindow,
                controller;

            beforeEach(function () {
                testVersions = [
                    { name: "Some name", value: "1.2.3" },
                    { name: "Some other name", value: "3.2.1" }
                ];
                mockWindow = jasmine.createSpyObj("$window", ["open"]);
                controller = new AboutController(testVersions, mockWindow);
            });

            it("exposes version information", function () {
                // This will be injected, so it should just give back
                // what it got in.
                expect(controller.versions()).toEqual(testVersions);
            });

            it("opens license information in a window", function () {
                //Verify precondition
                expect(mockWindow.open).not.toHaveBeenCalled();
                controller.openLicenses();
                expect(mockWindow.open).toHaveBeenCalledWith("#/licenses");
            });


        });

    }
);