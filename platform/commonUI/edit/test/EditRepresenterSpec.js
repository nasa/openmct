/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../src/EditRepresenter"],
    function (EditRepresenter) {
        "use strict";

        describe("The Edit mode representer", function () {
            var mockQ,
                mockScope,
                testRepresentation,
                mockDomainObject,
                mockPersistence,
                representer;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockQ = { when: mockPromise };
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                testRepresentation = { key: "test" };
                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "getId",
                    "getModel",
                    "getCapability",
                    "useCapability",
                    "hasCapability"
                ]);
                mockPersistence =
                    jasmine.createSpyObj("persistence", ["persist"]);

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.useCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockPersistence);

                representer = new EditRepresenter(mockQ, mockScope);
                representer.represent(testRepresentation, mockDomainObject);
            });

            it("watches for changes in view configuration", function () {
                // Should watch the configuration field,
                // provided by mct-representation
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "configuration",
                    jasmine.any(Function),
                    true // should be a deep watch
                );
            });

            it("watches for changes in domain object model", function () {
                // Should watch the model field,
                // provided by mct-representation
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "model",
                    jasmine.any(Function),
                    true // should be a deep watch
                );
            });

            it("mutates and persists upon observed changes", function () {
                mockScope.model = { someKey: "some value" };
                mockScope.configuration = { someConfiguration: "something" };

                mockScope.$watch.mostRecentCall.args[1].call();

                // Should have mutated the object...
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith(
                    "mutation",
                    jasmine.any(Function)
                );

                // ... and should have persisted the mutation
                expect(mockPersistence.persist).toHaveBeenCalled();

                // Finally, check that the provided mutation function
                // includes both model and configuratioon
                expect(
                    mockDomainObject.useCapability.mostRecentCall.args[1]()
                ).toEqual({
                    someKey: "some value",
                    configuration: {
                        test: { someConfiguration: "something" }
                    }
                });
            });


        });
    }
);