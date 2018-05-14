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
/*global describe,it,expect,beforeEach,jasmine,runs,waitsFor,spyOn*/

define(
    ["../../src/actions/SaveAsAction"],
    function (SaveAsAction) {

        describe("The Save As action", function () {
            var mockDomainObject,
                mockClonedObject,
                mockEditorCapability,
                mockActionCapability,
                mockObjectService,
                mockDialogService,
                mockCopyService,
                mockNotificationService,
                mockParent,
                actionContext,
                capabilities = {},
                action;

            function noop() {}

            function mockPromise(value) {
                return (value || {}).then ? value :
                    {
                        then: function (callback) {
                            return mockPromise(callback(value));
                        },
                        catch: function (callback) {
                            return mockPromise(callback(value));
                        }
                    }   ;
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getCapability",
                        "hasCapability",
                        "getModel",
                        "getId"
                    ]
                );
                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andCallFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.getModel.andReturn({location: 'a', persisted: undefined});
                mockDomainObject.getId.andReturn(0);

                mockClonedObject = jasmine.createSpyObj(
                    "clonedObject",
                    [
                        "getId"
                    ]
                );
                mockClonedObject.getId.andReturn(1);

                mockParent = jasmine.createSpyObj(
                    "parentObject",
                    [
                        "getCapability",
                        "hasCapability",
                        "getModel"
                    ]
                );

                mockEditorCapability = jasmine.createSpyObj(
                    "editor",
                    ["save", "finish", "isEditContextRoot"]
                );
                mockEditorCapability.save.andReturn(mockPromise(true));
                mockEditorCapability.finish.andReturn(mockPromise(true));
                mockEditorCapability.isEditContextRoot.andReturn(true);
                capabilities.editor = mockEditorCapability;

                mockActionCapability = jasmine.createSpyObj(
                    "action",
                    ["perform"]
                );
                capabilities.action = mockActionCapability;

                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    ["getObjects"]
                );
                mockObjectService.getObjects.andReturn(mockPromise({'a': mockParent}));

                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    [
                        "getUserInput",
                        "showBlockingMessage"
                    ]
                );
                mockDialogService.getUserInput.andReturn(mockPromise(undefined));

                mockCopyService = jasmine.createSpyObj(
                    "copyService",
                    [
                        "perform"
                    ]
                );
                mockCopyService.perform.andReturn(mockPromise(mockClonedObject));

                mockNotificationService = jasmine.createSpyObj(
                    "notificationService",
                    [
                        "info",
                        "error"
                    ]
                );

                actionContext = {
                    domainObject: mockDomainObject
                };

                action = new SaveAsAction(
                    undefined,
                    undefined,
                    mockDialogService,
                    mockCopyService,
                    mockNotificationService,
                    actionContext);

                spyOn(action, "getObjectService");
                action.getObjectService.andReturn(mockObjectService);

                spyOn(action, "createWizard");
                action.createWizard.andReturn({
                    getFormStructure: noop,
                    getInitialFormValue: noop,
                    populateObjectFromInput: function () {
                        return mockDomainObject;
                    }
                });

            });

            it("only applies to domain object with an editor capability", function () {
                expect(SaveAsAction.appliesTo(actionContext)).toBe(true);
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.hasCapability.andReturn(false);
                mockDomainObject.getCapability.andReturn(undefined);
                expect(SaveAsAction.appliesTo(actionContext)).toBe(false);
            });

            it("only applies to domain object that has not already been" +
                " persisted", function () {
                expect(SaveAsAction.appliesTo(actionContext)).toBe(true);
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.getModel.andReturn({persisted: 0});
                expect(SaveAsAction.appliesTo(actionContext)).toBe(false);
            });

            it("uses the editor capability to save the object", function () {
                mockEditorCapability.save.andReturn(new Promise(function () {}));
                runs(function () {
                    action.perform();
                });
                waitsFor(function () {
                    return mockEditorCapability.save.calls.length > 0;
                }, "perform() should call EditorCapability.save");
                runs(function () {
                    expect(mockEditorCapability.finish).not.toHaveBeenCalled();
                });
            });

            it("uses the editor capability to finish editing the object", function () {
                runs(function () {
                    action.perform();
                });
                waitsFor(function () {
                    return mockEditorCapability.finish.calls.length > 0;
                }, "perform() should call EditorCapability.finish");
            });

            it("returns to browse after save", function () {
                spyOn(action, "save");
                action.save.andReturn(mockPromise(mockDomainObject));
                action.perform();
                expect(mockActionCapability.perform).toHaveBeenCalledWith(
                    "navigate"
                );
            });

            it("prompts the user for object details", function () {
                action.perform();
                expect(mockDialogService.getUserInput).toHaveBeenCalled();
            });

            describe("in order to keep the user in the loop", function () {
                var mockDialogHandle;

                beforeEach(function () {
                    mockDialogHandle = jasmine.createSpyObj("dialogHandle", ["dismiss"]);
                    mockDialogService.showBlockingMessage.andReturn(mockDialogHandle);
                });

                it("shows a blocking dialog indicating that saving is in progress", function () {
                    mockEditorCapability.save.andReturn(new Promise(function () {}));
                    action.perform();
                    expect(mockDialogService.showBlockingMessage).toHaveBeenCalled();
                    expect(mockDialogHandle.dismiss).not.toHaveBeenCalled();
                });

                it("hides the blocking dialog after saving finishes", function () {
                    var mockCallback = jasmine.createSpy();
                    action.perform().then(mockCallback);
                    expect(mockDialogService.showBlockingMessage).toHaveBeenCalled();
                    waitsFor(function () {
                        return mockCallback.calls.length > 0;
                    });
                    runs(function () {
                        expect(mockDialogHandle.dismiss).toHaveBeenCalled();
                    });
                });

                it("notifies if saving succeeded", function () {
                    var mockCallback = jasmine.createSpy();
                    action.perform().then(mockCallback);
                    waitsFor(function () {
                        return mockCallback.calls.length > 0;
                    });
                    runs(function () {
                        expect(mockNotificationService.info).toHaveBeenCalled();
                        expect(mockNotificationService.error).not.toHaveBeenCalled();
                    });
                });

                it("notifies if saving failed", function () {
                    mockCopyService.perform.andReturn(Promise.reject("some failure reason"));
                    var mockCallback = jasmine.createSpy();
                    action.perform().then(mockCallback);
                    waitsFor(function () {
                        return mockCallback.calls.length > 0;
                    });
                    runs(function () {
                        expect(mockNotificationService.error).toHaveBeenCalled();
                        expect(mockNotificationService.info).not.toHaveBeenCalled();
                    });
                });
            });
        });
    }
);
