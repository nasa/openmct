/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * DomainObjectProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/objects/DomainObjectProvider"],
    function (DomainObjectProvider) {
        "use strict";

        describe("The domain object provider", function () {
            var mockModelService,
                mockCapabilityService,
                mockQ,
                provider;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    },
                    // Provide a synchronous way to get a value out
                    // of this phony promise.
                    testValue: value
                };
            }

            function mockAll(mockPromises) {
                return mockPromise(mockPromises.map(function (p) {
                    return mockPromise(p).testValue;
                }));
            }

            beforeEach(function () {
                mockModelService = jasmine.createSpyObj(
                    "modelService",
                    [ "getModels" ]
                );
                mockCapabilityService = jasmine.createSpyObj(
                    "capabilityService",
                    [ "getCapabilities" ]
                );
                mockQ = {
                    when: mockPromise,
                    all: mockAll
                };
                provider = new DomainObjectProvider(
                    mockModelService,
                    mockCapabilityService,
                    mockQ
                );
            });

            it("requests models from the model service", function () {
                var ids = [ "a", "b", "c" ];
                mockModelService.getModels.andReturn(mockPromise({}));
                provider.getObjects(ids);
                expect(mockModelService.getModels).toHaveBeenCalledWith(ids);
            });


            it("instantiates objects with provided models", function () {
                var ids = [ "a", "b", "c"],
                    model = { someKey: "some value"},
                    result;
                mockModelService.getModels.andReturn(mockPromise({ a: model }));
                result = provider.getObjects(ids).testValue;
                expect(result.a.getId()).toEqual("a");
                expect(result.a.getModel()).toEqual(model);
            });

        });
    }
);