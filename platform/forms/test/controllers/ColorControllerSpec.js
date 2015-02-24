/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/ColorController"],
    function (ColorController) {
        "use strict";

        var COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

        describe("The color picker's controller", function () {
            var controller;

            beforeEach(function () {
                controller = new ColorController();
            });

            it("exposes groups of colors", function () {
                var groups = controller.groups();

                // Make sure that the groups array is non-empty
                expect(Array.isArray(groups)).toBeTruthy();
                expect(groups.length).not.toEqual(0);

                groups.forEach(function (group) {
                    // Make sure each group is a non-empty array
                    expect(Array.isArray(group)).toBeTruthy();
                    expect(group.length).not.toEqual(0);
                    // Make sure they're valid web colors
                    group.forEach(function (color) {
                        expect(COLOR_REGEX.test(color)).toBeTruthy();
                    });
                });
            });

            it("exposes unique colors", function () {
                var count = 0, set = {};

                // Count each color, and add them to the set
                controller.groups().forEach(function (group) {
                    group.forEach(function (color) {
                        count += 1;
                        set[color] = true;
                    });
                })

                // Size of set should be number of colors if all were unique
                expect(Object.keys(set).length).toEqual(count);
            });
        });
    }
);