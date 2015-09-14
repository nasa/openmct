/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/controllers/ActivityModeValuesController'],
    function (ActivityModeValuesController) {
        'use strict';

        describe("An Activity Mode's Values view controller", function () {
            var testResources,
                controller;

            beforeEach(function () {
                testResources = [
                    { key: 'abc', name: "Some name" },
                    { key: 'def', name: "Test type", units: "Test units" },
                    { key: 'xyz', name: "Something else" }
                ];
                controller = new ActivityModeValuesController(testResources);
            });

            it("exposes resource metadata by key", function () {
                expect(controller.metadata('abc')).toEqual(testResources[0]);
                expect(controller.metadata('def')).toEqual(testResources[1]);
                expect(controller.metadata('xyz')).toEqual(testResources[2]);
            });

            it("exposes no metadata for unknown keys", function () {
                expect(controller.metadata('???')).toBeUndefined();
            });
        });
    }
);