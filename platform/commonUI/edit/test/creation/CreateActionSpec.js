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
    ["../../src/creation/CreateAction"],
    (CreateAction) => {

        describe("The create action", () => {
            let mockType,
                mockParent,
                mockContext,
                mockDomainObject,
                capabilities = {},
                mockEditAction,
                mockSaveAction,
                action;

            const mockPromise = (value) => {
                return {
                    then: (callback) => {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach( () => {
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getGlyph",
                        "getCssClass",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel"
                    ]
                );
                mockParent = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "getCapability",
                        "useCapability"
                    ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "getCapability",
                        "hasCapability",
                        "useCapability"
                    ]
                );
                mockDomainObject.hasCapability.andCallFake( (name) => {
                    return !!capabilities[name];
                });
                mockDomainObject.getCapability.andCallFake( (name) => {
                    return capabilities[name];
                });
                mockSaveAction = jasmine.createSpyObj(
                    "saveAction",
                    [
                        "perform"
                    ]
                );

                capabilities.action = jasmine.createSpyObj(
                    "actionCapability",
                    [
                        "getActions",
                        "perform"
                    ]
                );

                capabilities.editor = jasmine.createSpyObj(
                    "editorCapability",
                    [
                        "edit",
                        "save",
                        "finish"
                    ]
                );

                mockEditAction = jasmine.createSpyObj(
                    "editAction",
                    [
                        "perform"
                    ]
                );

                mockContext = {
                    domainObject: mockParent
                };
                mockParent.useCapability.andReturn(mockDomainObject);

                mockType.getKey.andReturn("test");
                mockType.getCssClass.andReturn("icon-telemetry");
                mockType.getDescription.andReturn("a test type");
                mockType.getName.andReturn("Test");
                mockType.getProperties.andReturn([]);
                mockType.getInitialModel.andReturn({});

                action = new CreateAction(
                    mockType,
                    mockParent,
                    mockContext
                );
            });

            it("exposes type-appropriate metadata", () => {
                let metadata = action.getMetadata();

                expect(metadata.name).toEqual("Test");
                expect(metadata.description).toEqual("a test type");
                expect(metadata.cssclass).toEqual("icon-telemetry");
            });

            describe("the perform function", () => {
                let promise = jasmine.createSpyObj("promise", ["then"]);
                beforeEach( () => {
                    capabilities.action.getActions.andReturn([mockEditAction]);
                });

                it("uses the instantiation capability when performed", () => {
                    action.perform();
                    expect(mockParent.useCapability).toHaveBeenCalledWith("instantiation", jasmine.any(Object));
                });

                it("uses the edit action if available", () => {
                    action.perform();
                    expect(mockEditAction.perform).toHaveBeenCalled();
                });

                it("uses the save-as action if object does not have an edit action" +
                    " available", () => {
                    capabilities.action.getActions.andReturn([]);
                    capabilities.action.perform.andReturn(mockPromise(undefined));
                    capabilities.editor.save.andReturn(promise);
                    action.perform();
                    expect(capabilities.action.perform).toHaveBeenCalledWith("save-as");
                });

                describe("uses to editor capability", () => {
                    beforeEach( () => {
                        capabilities.action.getActions.andReturn([]);
                        capabilities.action.perform.andReturn(promise);
                        capabilities.editor.save.andReturn(promise);
                    });

                    it("to save the edit if user saves dialog", () => {
                        action.perform();
                        expect(promise.then).toHaveBeenCalled();
                        promise.then.mostRecentCall.args[0]();
                        expect(capabilities.editor.save).toHaveBeenCalled();
                    });

                    it("to finish the edit if user cancels dialog", () => {
                        action.perform();
                        promise.then.mostRecentCall.args[1]();
                        expect(capabilities.editor.finish).toHaveBeenCalled();
                    });
                });
            });

        });
    }
);
