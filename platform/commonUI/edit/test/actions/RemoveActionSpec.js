/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define(
    ["../../src/actions/RemoveAction"],
    function (RemoveAction) {

        describe("The Remove action", function () {
            var action,
                actionContext,
                capabilities,
                mockContext,
                mockOverlayAPI,
                mockDomainObject,
                mockMutation,
                mockNavigationService,
                mockParent,
                mockType,
                model;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability", "getModel"]
                );

                mockMutation = jasmine.createSpyObj("mutation", ["invoke"]);
                mockType = jasmine.createSpyObj("type", ["hasFeature"]);
                mockType.hasFeature.and.returnValue(true);

                capabilities = {
                    mutation: mockMutation,
                    type: mockType
                };

                model = {
                    composition: ["a", "test", "b"]
                };

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

                mockOverlayAPI = jasmine.createSpyObj(
                    "overlayAPI",
                    ["dialog"]
                );

                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [
                        "getNavigation",
                        "setNavigation",
                        "addListener",
                        "removeListener"
                    ]
                );
                mockNavigationService.getNavigation.and.returnValue(mockDomainObject);

                mockContext = jasmine.createSpyObj("context", ["getParent"]);
                mockContext.getParent.and.returnValue(mockParent);

                mockDomainObject.getId.and.returnValue("test");
                mockDomainObject.getCapability.and.returnValue(mockContext);
                mockDomainObject.getModel.and.returnValue({name: 'test object'});

                mockContext.getParent.and.returnValue(mockParent);
                mockType.hasFeature.and.returnValue(true);

                actionContext = { domainObject: mockDomainObject };

                action = new RemoveAction({overlays: mockOverlayAPI}, mockNavigationService, actionContext);
            });

            it("only applies to objects with parents", function () {
                expect(RemoveAction.appliesTo(actionContext)).toBeTruthy();

                mockContext.getParent.and.returnValue(undefined);

                expect(RemoveAction.appliesTo(actionContext)).toBeFalsy();

                // Also verify that creatability was checked
                expect(mockType.hasFeature).toHaveBeenCalledWith('creation');
            });

            it("shows a blocking message dialog", function () {
                mockParent = jasmine.createSpyObj(
                    "parent",
                    ["getModel", "getCapability", "useCapability"]
                );

                action.perform();

                expect(mockOverlayAPI.dialog).toHaveBeenCalled();

                // Also check that no mutation happens at this point
                expect(mockParent.useCapability).not.toHaveBeenCalledWith("mutation", jasmine.any(Function));
            });

            it("does not show a blocking message dialog when true is passed to perform", function () {
                mockParent = jasmine.createSpyObj(
                    "parent",
                    ["getModel", "getCapability", "useCapability"]
                );

                action.perform(true);

                expect(mockDialogService.showBlockingMessage).not.toHaveBeenCalled();
            });

            describe("after the remove callback is triggered", function () {
                var mockChildContext,
                    mockChildObject,
                    mockDialogHandle,
                    mockGrandchildContext,
                    mockGrandchildObject,
                    mockRootContext,
                    mockRootObject;

                beforeEach(function () {
                    mockChildObject = jasmine.createSpyObj(
                        "domainObject",
                        ["getId", "getCapability"]
                    );

                    mockDialogHandle = jasmine.createSpyObj(
                        "dialogHandle",
                        ["dismiss"]
                    );

                    mockGrandchildObject = jasmine.createSpyObj(
                        "domainObject",
                        ["getId", "getCapability"]
                    );

                    mockRootObject = jasmine.createSpyObj(
                        "domainObject",
                        ["getId", "getCapability"]
                    );

                    mockChildContext = jasmine.createSpyObj("context", ["getParent"]);
                    mockGrandchildContext = jasmine.createSpyObj("context", ["getParent"]);
                    mockRootContext = jasmine.createSpyObj("context", ["getParent"]);

                    mockOverlayAPI.dialog.and.returnValue(mockDialogHandle);
                });

                it("mutates the parent when performed", function () {
                    action.perform();
                    mockOverlayAPI.dialog.calls.mostRecent().args[0]
                        .buttons[0].callback();

                    expect(mockMutation.invoke)
                        .toHaveBeenCalledWith(jasmine.any(Function));
                });

                it("changes composition from its mutation function", function () {
                    var mutator, result;

                    action.perform();
                    mockOverlayAPI.dialog.calls.mostRecent().args[0]
                        .buttons[0].callback();

                    mutator = mockMutation.invoke.calls.mostRecent().args[0];
                    result = mutator(model);

                    // Should not have cancelled the mutation
                    expect(result).not.toBe(false);

                    // Simulate mutate's behavior (remove can either return a
                    // new model or modify this one in-place)
                    result = result || model;

                    // Should have removed "test" - that was our
                    // mock domain object's id.
                    expect(result.composition).toEqual(["a", "b"]);
                });

                it("removes parent of object currently navigated to", function () {
                    // Navigates to child object
                    mockNavigationService.getNavigation.and.returnValue(mockChildObject);

                    // Test is id of object being removed
                    // Child object has different id
                    mockDomainObject.getId.and.returnValue("test");
                    mockChildObject.getId.and.returnValue("not test");

                    // Sets context for the child and domainObject
                    mockDomainObject.getCapability.and.returnValue(mockContext);
                    mockChildObject.getCapability.and.returnValue(mockChildContext);

                    // Parents of child and domainObject are set
                    mockContext.getParent.and.returnValue(mockParent);
                    mockChildContext.getParent.and.returnValue(mockDomainObject);

                    mockType.hasFeature.and.returnValue(true);

                    action.perform();
                    mockOverlayAPI.dialog.calls.mostRecent().args[0]
                        .buttons[0].callback();

                    // Expects navigation to parent of domainObject (removed object)
                    expect(mockNavigationService.setNavigation).toHaveBeenCalledWith(mockParent);
                });

                it("checks if removing object not in ascendent path (reaches ROOT)", function () {
                    // Navigates to grandchild of ROOT
                    mockNavigationService.getNavigation.and.returnValue(mockGrandchildObject);

                    // domainObject (grandparent) is set as ROOT, child and grandchild
                    // are set objects not being removed
                    mockDomainObject.getId.and.returnValue("test 1");
                    mockRootObject.getId.and.returnValue("ROOT");
                    mockChildObject.getId.and.returnValue("not test 2");
                    mockGrandchildObject.getId.and.returnValue("not test 3");

                    // Sets context for the grandchild, child, and domainObject
                    mockRootObject.getCapability.and.returnValue(mockRootContext);
                    mockChildObject.getCapability.and.returnValue(mockChildContext);
                    mockGrandchildObject.getCapability.and.returnValue(mockGrandchildContext);

                    // Parents of grandchild and child are set
                    mockChildContext.getParent.and.returnValue(mockRootObject);
                    mockGrandchildContext.getParent.and.returnValue(mockChildObject);

                    mockType.hasFeature.and.returnValue(true);

                    action.perform();
                    mockOverlayAPI.dialog.calls.mostRecent().args[0]
                        .buttons[0].callback();

                    // Expects no navigation to occur
                    expect(mockNavigationService.setNavigation).not.toHaveBeenCalled();
                });

            });
        });
    }
);
