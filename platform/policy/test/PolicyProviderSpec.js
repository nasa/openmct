/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/PolicyProvider"],
    function (PolicyProvider) {
        "use strict";

        describe("The policy provider", function () {
            var testPolicies,
                mockPolicies,
                mockPolicyConstructors,
                testCandidate,
                testContext,
                provider;

            beforeEach(function () {
                testPolicies = [
                    { category: "a", message: "some message", result: true },
                    { category: "a", result: true },
                    { category: "a", result: true },
                    { category: "b", message: "some message", result: true },
                    { category: "b", result: true },
                    { category: "b", result: true }
                ];
                mockPolicies = testPolicies.map(function (p) {
                    var mockPolicy = jasmine.createSpyObj("policy", ['allow']);
                    mockPolicy.allow.andCallFake(function () { return p.result; });
                    return mockPolicy;
                });
                mockPolicyConstructors = testPolicies.map(function (p, i) {
                    var mockPolicyConstructor = jasmine.createSpy();
                    mockPolicyConstructor.andReturn(mockPolicies[i]);
                    mockPolicyConstructor.message = p.message;
                    mockPolicyConstructor.category = p.category;
                    return mockPolicyConstructor;
                });

                testCandidate = { someKey: "some value" };
                testContext = { someOtherKey: "some other value" };

                provider = new PolicyProvider(mockPolicyConstructors);
            });

            it("has an allow method", function () {
                expect(provider.allow).toEqual(jasmine.any(Function));
            });

            it("consults all relevant policies", function () {
                provider.allow("a", testCandidate, testContext);
                expect(mockPolicies[0].allow)
                    .toHaveBeenCalledWith(testCandidate, testContext);
                expect(mockPolicies[1].allow)
                    .toHaveBeenCalledWith(testCandidate, testContext);
                expect(mockPolicies[2].allow)
                    .toHaveBeenCalledWith(testCandidate, testContext);
                expect(mockPolicies[3].allow)
                    .not.toHaveBeenCalled();
                expect(mockPolicies[4].allow)
                    .not.toHaveBeenCalled();
                expect(mockPolicies[5].allow)
                    .not.toHaveBeenCalled();
            });

            it("allows what all policies allow", function () {
                expect(provider.allow("a", testCandidate, testContext))
                    .toBeTruthy();
            });

            it("disallows what any one policy disallows", function () {
                testPolicies[1].result = false;
                expect(provider.allow("a", testCandidate, testContext))
                    .toBeFalsy();
            });

            it("provides a message for policy failure, when available", function () {
                var mockCallback = jasmine.createSpy();
                testPolicies[0].result = false;
                expect(provider.allow("a", testCandidate, testContext, mockCallback))
                    .toBeFalsy();
                expect(mockCallback).toHaveBeenCalledWith(testPolicies[1].message);
            });

        });
    }
);