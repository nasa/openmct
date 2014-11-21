/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ActionCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/ActionCapability"],
    function (ActionCapability) {
        "use strict";

        describe("The action capability", function () {
            var mockQ,
                mockAction,
                mockActionService,
                mockDomainObject,
                capability;

            beforeEach(function () {
                mockAction = jasmine.createSpyObj(
                    "action",
                    [ "perform", "getMetadata" ]
                );
                mockActionService = jasmine.createSpyObj(
                    "actionService",
                    [ "getActions" ]
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    [ "when" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability", "hasCapability", "useCapability" ]
                );

                mockActionService.getActions.andReturn([mockAction, {}]);

                capability = new ActionCapability(
                    mockQ,
                    mockActionService,
                    mockDomainObject
                );
            });

            it("retrieves action for domain objects from the action service", function () {
                // Verify precondition
                expect(mockActionService.getActions).not.toHaveBeenCalled();

                // Call getActions
                expect(capability.getActions("some key")).toEqual([mockAction, {}]);

                // Verify interaction
                expect(mockActionService.getActions).toHaveBeenCalledWith({
                    key: "some key",
                    domainObject: mockDomainObject
                });
            });

            it("promises the result of performed actions", function () {
                var mockPromise = jasmine.createSpyObj("promise", [ "then" ]);
                mockQ.when.andReturn(mockPromise);
                mockAction.perform.andReturn("the action's result");

                // Verify precondition
                expect(mockAction.perform).not.toHaveBeenCalled();

                // Perform via capability
                expect(capability.perform()).toEqual(mockPromise);

                // Verify that the action's result is what was wrapped
                expect(mockQ.when).toHaveBeenCalledWith("the action's result");

            });



        });
    }
);