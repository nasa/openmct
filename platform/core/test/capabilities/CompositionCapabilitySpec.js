/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * CompositionCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/CompositionCapability"],
    function (CompositionCapability) {
        "use strict";

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("The composition capability", function () {
            var mockDomainObject,
                mockInjector,
                mockObjectService,
                composition;

            // Composition Capability makes use of promise chaining,
            // so support that, but don't introduce complication of
            // native promises.
            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    DOMAIN_OBJECT_METHODS
                );

                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );

                mockInjector = {
                    get: function (name) {
                        return (name === "objectService") && mockObjectService;
                    }
                };

                mockObjectService.getObjects.andReturn(mockPromise([]));

                composition = new CompositionCapability(
                    mockInjector,
                    mockDomainObject
                );
            });

            it("applies only to models with a composition field", function () {
                expect(CompositionCapability.appliesTo({ composition: [] }))
                    .toBeTruthy();
                expect(CompositionCapability.appliesTo({}))
                    .toBeFalsy();
            });

            it("requests ids found in model's composition from the object service", function () {
                var ids = [ "a", "b", "c", "xyz" ];

                mockDomainObject.getModel.andReturn({ composition: ids });

                composition.invoke();

                expect(mockObjectService.getObjects).toHaveBeenCalledWith(ids);
            });

            it("adds a context capability to returned domain objects", function () {
                var result,
                    mockChild = jasmine.createSpyObj("child", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn({ composition: ["x"] });
                mockObjectService.getObjects.andReturn(mockPromise({x: mockChild}));
                mockChild.getCapability.andReturn(undefined);

                composition.invoke().then(function (c) { result = c; });

                // Should have been added by a wrapper
                expect(result[0].getCapability('context')).toBeDefined();

            });

        });
    }
);