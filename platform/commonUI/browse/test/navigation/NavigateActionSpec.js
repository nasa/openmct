/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/navigation/NavigateAction"],
    function (NavigateAction) {

        describe("The navigate action", function () {
            var mockNavigationService,
                mockQ,
                mockDomainObject,
                mockPolicyService,
                mockNavigatedObject,
                mockWindow,
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
                capabilities = {};

                mockQ = { when: mockPromise };
                mockNavigatedObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "hasCapability",
                        "getCapability"
                    ]
                );

                capabilities.editor = jasmine.createSpyObj("editorCapability", [
                    "isEditContextRoot",
                    "cancel"
                ]);

                mockNavigatedObject.getCapability.andCallFake(function (capability) {
                    return capabilities[capability];
                });
                mockNavigatedObject.hasCapability.andReturn(false);

                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [
                        "setNavigation",
                        "getNavigation"
                    ]
                );
                mockNavigationService.getNavigation.andReturn(mockNavigatedObject);

                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel"
                    ]
                );

                mockPolicyService = jasmine.createSpyObj("policyService",
                    [
                        "allow"
                    ]);
                mockWindow = jasmine.createSpyObj("$window",
                    [
                        "confirm"
                    ]);

                action = new NavigateAction(
                    mockNavigationService,
                    mockQ,
                    mockPolicyService,
                    mockWindow,
                    { domainObject: mockDomainObject }
                );
            });

            it("invokes the policy service to determine if navigation" +
                " allowed", function () {
                action.perform();
                expect(mockPolicyService.allow)
                    .toHaveBeenCalledWith("navigation", jasmine.any(Object), jasmine.any(Object), jasmine.any(Function));
            });

            it("prompts user if policy rejection", function () {
                action.perform();
                expect(mockPolicyService.allow).toHaveBeenCalled();
                mockPolicyService.allow.mostRecentCall.args[3]();
                expect(mockWindow.confirm).toHaveBeenCalled();
            });

            describe("shows a prompt", function () {
                beforeEach(function () {
                    // Ensure the allow callback is called synchronously
                    mockPolicyService.allow.andCallFake(function () {
                        return arguments[3]();
                    });
                });
                it("does not navigate on prompt rejection", function () {
                    mockWindow.confirm.andReturn(false);
                    action.perform();
                    expect(mockNavigationService.setNavigation)
                        .not.toHaveBeenCalled();
                });

                it("does navigate on prompt acceptance", function () {
                    mockWindow.confirm.andReturn(true);
                    action.perform();
                    expect(mockNavigationService.setNavigation)
                        .toHaveBeenCalled();
                });
            });

            describe("in edit mode", function () {
                beforeEach(function () {
                    mockNavigatedObject.hasCapability.andCallFake(function (capability) {
                        return capability === "editor";
                    });
                    capabilities.editor.isEditContextRoot.andReturn(true);
                });

                it("cancels editing if in edit mode", function () {
                    action.perform();
                    expect(capabilities.editor.cancel)
                        .toHaveBeenCalled();
                });
            });

            it("is only applicable when a domain object is in context", function () {
                expect(NavigateAction.appliesTo({})).toBeFalsy();
                expect(NavigateAction.appliesTo({
                    domainObject: mockDomainObject
                })).toBeTruthy();
            });

        });
    }
);
