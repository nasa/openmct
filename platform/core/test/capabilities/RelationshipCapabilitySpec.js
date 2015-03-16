/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * CompositionCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/RelationshipCapability"],
    function (RelationshipCapability) {
        "use strict";

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("The relationship capability", function () {
            var mockDomainObject,
                mockInjector,
                mockObjectService,
                relationship;

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

                relationship = new RelationshipCapability(
                    mockInjector,
                    mockDomainObject
                );
            });

            it("applies only to models with a 'relationships' field", function () {
                expect(RelationshipCapability.appliesTo({ relationships: {} }))
                    .toBeTruthy();
                expect(RelationshipCapability.appliesTo({}))
                    .toBeFalsy();
            });

            it("requests ids found in model's composition from the object service", function () {
                var ids = [ "a", "b", "c", "xyz" ];

                mockDomainObject.getModel.andReturn({ relationships: { xyz: ids } });

                relationship.getRelatedObjects('xyz');

                expect(mockObjectService.getObjects).toHaveBeenCalledWith(ids);
            });

            it("provides a list of relationship types", function () {
                mockDomainObject.getModel.andReturn({ relationships: {
                    abc: [ 'a', 'b' ],
                    def: "not an array, should be ignored",
                    xyz: []
                } });
                expect(relationship.listRelationships()).toEqual(['abc', 'xyz']);
            });

            it("avoids redundant requests", function () {
                    // Lookups can be expensive, so this capability
                // should have some self-caching
                var response;

                mockDomainObject.getModel
                    .andReturn({ relationships: { xyz: ['a'] } });

                // Call twice; response should be the same object instance
                expect(relationship.getRelatedObjects('xyz'))
                    .toBe(relationship.getRelatedObjects('xyz'));

                // Should have only made one call
                expect(mockObjectService.getObjects.calls.length)
                    .toEqual(1);
            });

            it("makes new requests on modification", function () {
                // Lookups can be expensive, so this capability
                // should have some self-caching
                var response, testModel;

                testModel = { relationships: { xyz: ['a'] } };

                mockDomainObject.getModel.andReturn(testModel);

                // Call twice, but as if modification had occurred in between
                relationship.getRelatedObjects('xyz');
                testModel.modified = 123;
                relationship.getRelatedObjects('xyz');

                // Should have only made one call
                expect(mockObjectService.getObjects.calls.length)
                    .toEqual(2);
            });

        });
    }
);