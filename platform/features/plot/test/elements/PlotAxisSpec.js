/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotAxis"],
    function (PlotAxis) {
        "use strict";

        describe("A plot axis", function () {
            var testMetadatas = [
                    {
                        tests: [
                            { key: "t0", name: "T0" },
                            { key: "t1", name: "T1" }
                        ],
                        someKey: "some value"
                    },
                    {
                        tests: [
                            { key: "t0", name: "T0" },
                            { key: "t2", name: "T2" }
                        ]
                    },
                    {
                        tests: [
                            { key: "t3", name: "T3" },
                            { key: "t4", name: "T4" },
                            { key: "t5", name: "T5" },
                            { key: "t6", name: "T6" }
                        ]
                    }
                ],
                testDefault = { key: "test", name: "Test" },
                controller = new PlotAxis("tests", testMetadatas, testDefault);

            it("pulls out a list of domain or range options", function () {
                // Should have filtered out duplicates, etc
                expect(controller.options).toEqual([
                    { key: "t0", name: "T0" },
                    { key: "t1", name: "T1" },
                    { key: "t2", name: "T2" },
                    { key: "t3", name: "T3" },
                    { key: "t4", name: "T4" },
                    { key: "t5", name: "T5" },
                    { key: "t6", name: "T6" }
                ]);
            });

            it("chooses the first option as a default", function () {
                expect(controller.active).toEqual({ key: "t0", name: "T0" });
            });

            it("falls back to a provided default if no options are present", function () {
                expect(new PlotAxis("tests", [{}], testDefault).active)
                    .toEqual(testDefault);
            });

        });
    }
);