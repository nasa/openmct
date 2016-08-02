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
/*global describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/actions/SaveAsAction"],
    function (SaveAsAction) {

        describe("The Save As action", function () {
            var mockDomainObject,
                mockEditorCapability,
                mockActionCapability,
                mockObjectService,
                mockDialogService,
                mockCopyService,
                mockParent,
                mockUrlService,
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
                        "getModel"
                    ]
                );
                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andCallFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.getModel.andReturn({location: 'a', persisted: undefined});

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
                    ["save", "cancel", "isEditContextRoot"]
                );
                mockEditorCapability.cancel.andReturn(mockPromise(undefined));
                mockEditorCapability.save.andReturn(mockPromise(true));
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

                mockUrlService = jasmine.createSpyObj(
                    "urlService",
                    ["urlForLocation"]
                );

                actionContext = {
                    domainObject: mockDomainObject
                };

                action = new SaveAsAction(undefined, undefined, mockDialogService, undefined, mockCopyService, actionContext);

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

            describe("a blocking dialog", function () {
                var mockDialogHandle;

                beforeEach(function () {
                    mockDialogHandle = jasmine.createSpyObj("dialogHandle", ["dismiss"]);
                    mockDialogService.showBlockingMessage.andReturn(mockDialogHandle);
                });

                it("indicates that a save is taking place", function () {
                    mockEditorCapability.save.andReturn(new Promise(function () {}));
                    action.perform();
                    expect(mockDialogService.showBlockingMessage).toHaveBeenCalled();
                    expect(mockDialogHandle.dismiss).not.toHaveBeenCalled();
                });

                it("is hidden after saving", function () {
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
            });
        });
    }
);
