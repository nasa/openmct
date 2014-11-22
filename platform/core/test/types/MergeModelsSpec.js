/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/types/MergeModels"],
    function (mergeModels) {
        "use strict";

        describe("Model merger", function () {
            it("merges models", function () {
                expect(mergeModels(
                    {
                        "a": "property a",
                        "b": [ 1, 2, 3 ],
                        "c": {
                            x: 42,
                            z: [ 0 ]
                        },
                        "d": "should be ignored"
                    },
                    {
                        "b": [ 4 ],
                        "c": {
                            y: "property y",
                            z: [ "h" ]
                        },
                        "d": "property d"
                    }
                )).toEqual({
                    "a": "property a",
                    "b": [ 1, 2, 3, 4 ],
                    "c": {
                        x: 42,
                        y: "property y",
                        z: [ 0, "h" ]
                    },
                    "d": "property d"
                });
            });
        });
    }
);