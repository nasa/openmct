/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/SelectorController"],
    function (SelectorController) {
        "use strict";

        describe("The controller for the 'selector' control", function () {
            var mockObjectService,
                mockScope,
                controller;

            function promiseOf(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return promiseOf(callback(v));
                    }
                };
            }

            beforeEach(function () {
                mockObjectService = jasmine.createSpyObj(
                    'objectService',
                    ['getObjects']
                );
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    ['$watch', '$watchCollection']
                );

                mockObjectService.getObjects.andReturn(promiseOf({}));

                controller = new SelectorController(
                    mockObjectService,
                    mockScope
                );
            });

            it("loads the root object", function () {
                expect(mockObjectService.getObjects)
                    .toHaveBeenCalledWith(["ROOT"]);
            });
        });
    }
);
