/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotPalette"],
    function (PlotPalette) {
        "use strict";

        describe("The plot palette", function () {
            it("can be used as a constructor", function () {
                // PlotPalette has all static methods, so make
                // sure it returns itself if used as a constructor.
                expect(new PlotPalette()).toBe(PlotPalette);
            });

            it("has 30 unique colors in an integer format", function () {
                // Integer format may be useful internal to the application.
                // RGB 0-255
                var i, j;

                // Used to verify one of R, G, B in loop below
                function verifyChannel(c) {
                    expect(typeof c).toEqual("number");
                    expect(c <= 255).toBeTruthy();
                    expect(c >= 0).toBeTruthy();
                }

                for (i = 0; i < 30; i += 1) {
                    // Verify that we got an array of numbers
                    expect(Array.isArray(PlotPalette.getIntegerColor(i)))
                        .toBeTruthy();
                    expect(PlotPalette.getIntegerColor(i).length).toEqual(3);

                    // Verify all three channels for type and range
                    PlotPalette.getIntegerColor(i).forEach(verifyChannel);

                    // Verify uniqueness
                    for (j = i + 1; j < 30; j += 1) {
                        expect(PlotPalette.getIntegerColor(i)).not.toEqual(
                            PlotPalette.getIntegerColor(j)
                        );
                    }
                }
            });


            it("has 30 unique colors in a floating-point format", function () {
                // Float format is useful to WebGL.
                // RGB 0.0-1.1
                var i, j;

                // Used to verify one of R, G, B in loop below
                function verifyChannel(c) {
                    expect(typeof c).toEqual("number");
                    expect(c <= 1.0).toBeTruthy();
                    expect(c >= 0.0).toBeTruthy();
                }

                for (i = 0; i < 30; i += 1) {
                    // Verify that we got an array of numbers
                    expect(Array.isArray(PlotPalette.getFloatColor(i)))
                        .toBeTruthy();
                    expect(PlotPalette.getFloatColor(i).length).toEqual(4);

                    // Verify all three channels for type and range
                    PlotPalette.getFloatColor(i).forEach(verifyChannel);

                    // Verify uniqueness
                    for (j = i + 1; j < 30; j += 1) {
                        expect(PlotPalette.getFloatColor(i)).not.toEqual(
                            PlotPalette.getFloatColor(j)
                        );
                    }
                }
            });


            it("has 30 unique colors in a string format", function () {
                // String format is useful in stylesheets
                // #RRGGBB in hex
                var i, j, c;


                for (i = 0; i < 30; i += 1) {
                    c = PlotPalette.getStringColor(i);

                    // Verify that we #-style color strings
                    expect(typeof c).toEqual('string');
                    expect(c.length).toEqual(7);
                    expect(/^#[0-9a-fA-F]+$/.test(c)).toBeTruthy();

                    // Verify uniqueness
                    for (j = i + 1; j < 30; j += 1) {
                        expect(PlotPalette.getStringColor(i)).not.toEqual(
                            PlotPalette.getStringColor(j)
                        );
                    }
                }
            });
        });
    }
);