/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/representers/EditRepresenter"],
    function (EditRepresenter) {
        "use strict";

        describe("The Edit mode representer", function () {
            var mockQ,
                mockLog,
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
                mockLog = jasmine.createSpyObj("$log", ["info", "debug"]);
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

                mockDomainObject.getModel.andReturn({});
                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.useCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockPersistence);

                representer = new EditRepresenter(mockQ, mockLog, mockScope);
                representer.represent(testRepresentation, mockDomainObject);
            });

            it("provides a commit method in scope", function () {
                expect(mockScope.commit).toEqual(jasmine.any(Function));
            });

            it("mutates and persists upon observed changes", function () {
                mockScope.model = { someKey: "some value" };
                mockScope.configuration = { someConfiguration: "something" };

                mockScope.commit("Some message");

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