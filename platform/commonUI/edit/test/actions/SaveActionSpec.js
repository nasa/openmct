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

define(
    ["../../src/actions/SaveAction"],
    function (SaveAction) {

        describe("The Save action", function () {
            var mockDomainObject,
                mockEditorCapability,
                actionContext,
                dialogService,
                mockActionCapability,
                capabilities = {},
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    },
                    catch: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getCapability",
                        "hasCapability",
                        "getModel",
                        "getOriginalObject"
                    ]
                );
                mockEditorCapability = jasmine.createSpyObj(
                    "editor",
                    ["save", "cancel", "isEditContextRoot"]
                );
                mockActionCapability = jasmine.createSpyObj(
                    "actionCapability",
                    ["perform"]
                );
                capabilities.editor = mockEditorCapability;
                capabilities.action = mockActionCapability;

                actionContext = {
                    domainObject: mockDomainObject
                };
                dialogService = jasmine.createSpyObj(
                    "dialogService",
                    ["showBlockingMessage"]
                );

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andCallFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.getModel.andReturn({persisted: 0});
                mockEditorCapability.save.andReturn(mockPromise(true));
                mockEditorCapability.isEditContextRoot.andReturn(true);

                action = new SaveAction(dialogService, actionContext);
            });

            it("only applies to domain object with an editor capability", function () {
                expect(SaveAction.appliesTo(actionContext)).toBe(true);
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.hasCapability.andReturn(false);
                mockDomainObject.getCapability.andReturn(undefined);
                expect(SaveAction.appliesTo(actionContext)).toBe(false);
            });

            it("only applies to domain object that has already been persisted",
                function () {
                    mockDomainObject.getModel.andReturn({persisted: undefined});
                    expect(SaveAction.appliesTo(actionContext)).toBe(false);
                });

            it("uses the editor capability to save the object",
                function () {
                    action.perform();
                    expect(mockEditorCapability.save).toHaveBeenCalled();
                });

            describe("a blocking dialog", function () {
                var mockDialogHandle;

                beforeEach(function () {
                    mockDialogHandle = jasmine.createSpyObj("dialogHandle", ["dismiss"]);
                    dialogService.showBlockingMessage.andReturn(mockDialogHandle);
                });


                it("shows a dialog while saving", function () {
                    mockEditorCapability.save.andReturn(new Promise(function () {
                    }));
                    action.perform();
                    expect(dialogService.showBlockingMessage).toHaveBeenCalled();
                    expect(mockDialogHandle.dismiss).not.toHaveBeenCalled();
                });

                it("hides a dialog when saving is complete", function () {
                    action.perform();
                    expect(dialogService.showBlockingMessage).toHaveBeenCalled();
                    expect(mockDialogHandle.dismiss).toHaveBeenCalled();
                });
            });

        });
    }
);
