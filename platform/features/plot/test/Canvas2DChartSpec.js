/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/Canvas2DChart"],
    function (Canvas2DChart) {
        "use strict";

        describe("A canvas 2d chart", function () {
            var mockCanvas,
                mock2d,
                chart;

            beforeEach(function () {
                mockCanvas = jasmine.createSpyObj("canvas", [ "getContext" ]);
                mock2d = jasmine.createSpyObj(
                    "2d",
                    [
                        "clearRect",
                        "beginPath",
                        "moveTo",
                        "lineTo",
                        "stroke",
                        "fillRect"
                    ]
                );
                mockCanvas.getContext.andReturn(mock2d);

                chart = new Canvas2DChart(mockCanvas);
            });

            it("allows the canvas to be cleared", function () {
                chart.clear();
                expect(mock2d.clearRect).toHaveBeenCalled();
            });

            it("doees not construct if 2D is unavailable", function () {
                mockCanvas.getContext.andReturn(undefined);
                expect(function () {
                    return new Canvas2DChart(mockCanvas);
                }).toThrow();
            });

            it("allows dimensions to be set", function () {
                // No return value, just verify API is present
                chart.setDimensions([120, 120], [0, 10]);
            });

            it("allows lines to be drawn", function () {
                var testBuffer = [ 0, 1, 3, 8 ],
                    testColor = [ 0.25, 0.33, 0.66, 1.0 ],
                    testPoints = 2;
                chart.drawLine(testBuffer, testColor, testPoints);
                expect(mock2d.beginPath).toHaveBeenCalled();
                expect(mock2d.lineTo.calls.length).toEqual(1);
                expect(mock2d.stroke).toHaveBeenCalled();
            });

            it("allows squares to be drawn", function () {
                var testMin = [0, 1],
                    testMax = [10, 10],
                    testColor = [ 0.25, 0.33, 0.66, 1.0 ];

                chart.drawSquare(testMin, testMax, testColor);
                expect(mock2d.fillRect).toHaveBeenCalled();
            });

        });
    }
);