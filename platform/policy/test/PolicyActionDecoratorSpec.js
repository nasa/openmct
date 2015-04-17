/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/PolicyActionDecorator"],
    function (PolicyActionDecorator) {
        "use strict";

        describe("The policy action decorator", function () {
            var mockPolicyService,
                mockActionService,
                testContext,
                testActions,
                decorator;

            beforeEach(function () {
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                mockActionService = jasmine.createSpyObj(
                    'actionService',
                    ['getActions']
                );

                // Content of actions should be irrelevant to this
                // decorator, so just give it some objects to pass
                // around.
                testActions = [
                    { someKey: "a" },
                    { someKey: "b" },
                    { someKey: "c" }
                ];
                testContext = { someKey: "some value" };

                mockActionService.getActions.andReturn(testActions);
                mockPolicyService.allow.andReturn(true);

                decorator = new PolicyActionDecorator(
                    mockPolicyService,
                    mockActionService
                );
            });

            it("delegates to its decorated action service", function () {
                decorator.getActions(testContext);
                expect(mockActionService.getActions)
                    .toHaveBeenCalledWith(testContext);
            });

            it("provides actions from its decorated action service", function () {
                // Mock policy service allows everything by default,
                // so everything should be returned
                expect(decorator.getActions(testContext))
                    .toEqual(testActions);
            });

            it("consults the policy service for each candidate action", function () {
                decorator.getActions(testContext);
                testActions.forEach(function (testAction) {
                    expect(mockPolicyService.allow).toHaveBeenCalledWith(
                        'action',
                        testAction,
                        testContext
                    );
                });
            });

            it("filters out policy-disallowed actions", function () {
                // Disallow the second action
                mockPolicyService.allow.andCallFake(function (cat, candidate, ctxt) {
                    return candidate.someKey !== 'b';
                });
                expect(decorator.getActions(testContext))
                    .toEqual([ testActions[0], testActions[2] ]);
            });

        });
    }
);