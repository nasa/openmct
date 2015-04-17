/*global define,describe,it,expect,beforeEach,jasmine,spyOn*/

define(
    ["../../src/actions/LinkAction"],
    function (LinkAction) {
        "use strict";

        describe("The Link action", function () {
            var mockQ,
                mockDomainObject,
                mockParent,
                mockContext,
                mockMutation,
                mockPersistence,
                mockType,
                actionContext,
                model,
                capabilities,
                action;

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
                    [ "getId", "getCapability" ]
                );
                mockQ = { when: mockPromise };
                mockParent = {
                    getModel: function () {
                        return model;
                    },
                    getCapability: function (k) {
                        return capabilities[k];
                    },
                    useCapability: function (k, v) {
                        return capabilities[k].invoke(v);
                    }
                };
                mockContext = jasmine.createSpyObj("context", [ "getParent" ]);
                mockMutation = jasmine.createSpyObj("mutation", [ "invoke" ]);
                mockPersistence = jasmine.createSpyObj("persistence", [ "persist" ]);
                mockType = jasmine.createSpyObj("type", [ "hasFeature" ]);

                mockDomainObject.getId.andReturn("test");
                mockDomainObject.getCapability.andReturn(mockContext);
                mockContext.getParent.andReturn(mockParent);
                mockType.hasFeature.andReturn(true);
                mockMutation.invoke.andReturn(mockPromise(true));


                capabilities = {
                    mutation: mockMutation,
                    persistence: mockPersistence,
                    type: mockType
                };
                model = {
                    composition: [ "a", "b", "c" ]
                };

                actionContext = {
                    domainObject: mockParent,
                    selectedObject: mockDomainObject
                };

                action = new LinkAction(actionContext);
            });


            it("mutates the parent when performed", function () {
                action.perform();
                expect(mockMutation.invoke)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("changes composition from its mutation function", function () {
                var mutator, result;
                action.perform();
                mutator = mockMutation.invoke.mostRecentCall.args[0];
                result = mutator(model);

                // Should not have cancelled the mutation
                expect(result).not.toBe(false);

                // Simulate mutate's behavior (remove can either return a
                // new model or modify this one in-place)
                result = result || model;

                // Should have removed "test" - that was our
                // mock domain object's id.
                expect(result.composition).toEqual(["a", "b", "c", "test"]);

                // Finally, should have persisted
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

        });
    }
);