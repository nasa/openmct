/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ['../src/LicenseController'],
    function (LicenseController) {
        "use strict";

        describe("The License controller", function () {
            var testLicenses,
                controller;

            beforeEach(function () {
                testLicenses = [
                    { name: "A" },
                    { name: "B" },
                    { name: "C" }
                ];
                controller = new LicenseController(testLicenses);
            });

            it("exposes license information", function () {
                // LicenseController is just there to pass licenses[]
                // extensions down to the template.
                expect(controller.licenses()).toEqual(testLicenses);
            });

        });

    }
);