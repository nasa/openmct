/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/models/CachingModelDecorator"],
    function (CachingModelDecorator) {
        "use strict";

        describe("The caching model decorator", function () {
            var mockModelService,
                mockCallback,
                testModels,
                decorator;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockCallback = jasmine.createSpy();
                mockModelService = jasmine.createSpyObj('modelService', ['getModels']);
                testModels = {
                    a: { someKey: "some value" },
                    b: { someOtherKey: "some other value" }
                };
                mockModelService.getModels.andReturn(asPromise(testModels));
                decorator = new CachingModelDecorator(mockModelService);
            });

            it("loads models from its wrapped model service", function () {
                decorator.getModels(['a', 'b']).then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith(testModels);
            });

            it("does not try to reload cached models", function () {
                mockModelService.getModels.andReturn(asPromise({ a: testModels.a }));
                decorator.getModels(['a']);
                mockModelService.getModels.andReturn(asPromise(testModels));
                decorator.getModels(['a', 'b']);
                expect(mockModelService.getModels).not.toHaveBeenCalledWith(['a', 'b']);
                expect(mockModelService.getModels.mostRecentCall.args[0]).toEqual(['b']);
            });

            it("does not call its wrapped model service if not needed", function () {
                decorator.getModels(['a', 'b']);
                expect(mockModelService.getModels.calls.length).toEqual(1);
                decorator.getModels(['a', 'b']).then(mockCallback);
                expect(mockModelService.getModels.calls.length).toEqual(1);
                // Verify that we still got back our models, even though
                // no new call to the wrapped service was made
                expect(mockCallback).toHaveBeenCalledWith(testModels);
            });


        });
    }
);