/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ViewProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/views/ViewProvider"],
    function (ViewProvider) {
        "use strict";

        describe("The view provider", function () {
            var viewA = {
                    key: "a"
                },
                viewB = {
                    key: "b",
                    needs: [ "someCapability" ]
                },
                viewC = {
                    key: "c",
                    needs: [ "someCapability" ],
                    delegation: true
                },
                capabilities = {},
                delegates = {},
                delegation,
                mockDomainObject = {},
                provider;

            beforeEach(function () {
                // Simulate the expected API
                mockDomainObject.hasCapability = function (c) {
                    return capabilities[c] !== undefined;
                };
                mockDomainObject.getCapability = function (c) {
                    return capabilities[c];
                };
                mockDomainObject.useCapability = function (c, v) {
                    return capabilities[c] && capabilities[c].invoke(v);
                };

                capabilities = {};
                delegates = {};

                delegation = {
                    doesDelegateCapability: function (c) {
                        return delegates[c] !== undefined;
                    }
                };

                provider = new ViewProvider([viewA, viewB, viewC]);
            });

            it("reports views provided as extensions", function () {
                capabilities.someCapability = true;
                expect(provider.getViews(mockDomainObject))
                    .toEqual([viewA, viewB, viewC]);
            });

            it("filters views by needed capabilities", function () {
                //capabilities.someCapability = true;
                expect(provider.getViews(mockDomainObject))
                    .toEqual([viewA]);
            });

            it("allows delegation of needed capabilities when specified", function () {
                //capabilities.someCapability = true;
                capabilities.delegation = delegation;
                delegates.someCapability = true;
                expect(provider.getViews(mockDomainObject))
                    .toEqual([viewA, viewC]);
            });

        });
    }
);