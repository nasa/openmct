/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/PolicyViewDecorator"],
    function (PolicyViewDecorator) {
        "use strict";

        describe("The policy view decorator", function () {
            var mockPolicyService,
                mockViewService,
                mockDomainObject,
                testViews,
                decorator;

            beforeEach(function () {
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                mockViewService = jasmine.createSpyObj(
                    'viewService',
                    ['getViews']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId']
                );

                // Content of actions should be irrelevant to this
                // decorator, so just give it some objects to pass
                // around.
                testViews = [
                    { someKey: "a" },
                    { someKey: "b" },
                    { someKey: "c" }
                ];

                mockDomainObject.getId.andReturn('xyz');
                mockViewService.getViews.andReturn(testViews);
                mockPolicyService.allow.andReturn(true);

                decorator = new PolicyViewDecorator(
                    mockPolicyService,
                    mockViewService
                );
            });

            it("delegates to its decorated view service", function () {
                decorator.getViews(mockDomainObject);
                expect(mockViewService.getViews)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("provides views from its decorated view service", function () {
                // Mock policy service allows everything by default,
                // so everything should be returned
                expect(decorator.getActions(mockDomainObject))
                    .toEqual(testViews);
            });

            it("consults the policy service for each candidate view", function () {
                decorator.getViews(mockDomainObject);
                testViews.forEach(function (testView) {
                    expect(mockPolicyService.allow).toHaveBeenCalledWith(
                        'view',
                        testView,
                        mockDomainObject
                    );
                });
            });

            it("filters out policy-disallowed views", function () {
                // Disallow the second action
                mockPolicyService.allow.andCallFake(function (cat, candidate, ctxt) {
                    return candidate.someKey !== 'b';
                });
                expect(decorator.getViews(mockDomainObject))
                    .toEqual([ testViews[0], testViews[2] ]);
            });

        });
    }
);