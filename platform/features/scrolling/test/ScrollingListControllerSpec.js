/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/ScrollingListController"],
    function (ScrollingListController) {
        "use strict";

        describe("The scrolling list controller", function () {
            var mockScope,
                mockTelemetry,
                testMetadata,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockTelemetry = jasmine.createSpyObj(
                    "telemetryController",
                    [ "getResponse", "getMetadata", "getTelemetryObjects" ]
                );
                testMetadata = [
                    {
                        domains: [
                            { key: "d0", name: "D0" },
                            { key: "d1", name: "D1" }
                        ],
                        ranges: [
                            { key: "r0", name: "R0" },
                            { key: "r1", name: "R1" }
                        ]
                    },
                    {
                        domains: [
                            { key: "d0", name: "D0" },
                            { key: "d2", name: "D2" }
                        ],
                        ranges: [
                            { key: "r0", name: "R0" }
                        ]
                    }
                ];
                mockTelemetry.getMetadata.andReturn(testMetadata);
                mockTelemetry.getResponse.andReturn([]);
                mockTelemetry.getTelemetryObjects.andReturn([]);
                mockScope.telemetry = mockTelemetry;
                controller = new ScrollingListController(mockScope);
            });

            it("listens for telemetry data updates", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "telemetryUpdate",
                    jasmine.any(Function)
                );
            });

            it("watches for telemetry controller changes", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "telemetry",
                    jasmine.any(Function)
                );
            });

            it("provides a column for each name and each unique domain, range", function () {
                // Should have six columns based on metadata above,
                // (name, d0, d1, d2, r0, r1)
                mockScope.$watch.mostRecentCall.args[1](mockTelemetry);
                expect(mockScope.headers).toEqual(["Name", "D0", "D1", "D2", "R0", "R1"]);
            });

            it("does not throw if telemetry controller is undefined", function () {
                // Just a general robustness check
                mockScope.telemetry = undefined;
                expect(mockScope.$watch.mostRecentCall.args[1])
                    .not.toThrow();
            });

            it("provides default columns if domain/range metadata is unavailable", function () {
                mockTelemetry.getMetadata.andReturn([]);
                mockScope.$watch.mostRecentCall.args[1](mockTelemetry);
                expect(mockScope.headers).toEqual(["Name", "Time", "Value"]);
            });
        });
    }
);