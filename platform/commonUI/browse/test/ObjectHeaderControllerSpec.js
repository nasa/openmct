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
    ["../src/ObjectHeaderController"],
    function (ObjectHeaderController) {

        describe("The object header controller", function () {
            var mockScope,
                mockDomainObject,
                mockCapabilities,
                mockMutationCapability,
                mockTypeCapability,
                mockEvent,
                mockCurrentTarget,
                model,
                controller;

            beforeEach(function () {
                mockMutationCapability = jasmine.createSpyObj("mutation", ["mutate"]);
                mockTypeCapability = jasmine.createSpyObj("type", ["typeDef", "hasFeature"]);
                mockTypeCapability.typeDef = { name: ""};
                mockTypeCapability.hasFeature.and.callFake(function (feature) {
                    return feature === 'creation';
                });

                mockCapabilities = {
                    mutation: mockMutationCapability,
                    type: mockTypeCapability
                };

                model = {
                    name: "Test name"
                };
                mockDomainObject = jasmine.createSpyObj("domainObject", ["getCapability", "getModel"]);
                mockDomainObject.getModel.and.returnValue(model);
                mockDomainObject.getCapability.and.callFake(function (key) {
                    return mockCapabilities[key];
                });

                mockScope = {
                    domainObject: mockDomainObject
                };

                mockCurrentTarget = jasmine.createSpyObj("currentTarget", ["blur", "textContent"]);
                mockCurrentTarget.blur.and.returnValue(mockCurrentTarget);

                mockEvent = {
                    which: {},
                    type: {},
                    currentTarget: mockCurrentTarget
                };

                controller = new ObjectHeaderController(mockScope);
            });

            it("updates the model with new name on blur", function () {
                mockEvent.type = "blur";
                mockCurrentTarget.textContent = "New name";
                controller.updateName(mockEvent);

                expect(mockMutationCapability.mutate).toHaveBeenCalled();
            });

            it("updates the model with a default for blank names", function () {
                mockEvent.type = "blur";
                mockCurrentTarget.textContent = "";
                controller.updateName(mockEvent);

                expect(mockCurrentTarget.textContent.length).not.toEqual(0);
                expect(mockMutationCapability.mutate).toHaveBeenCalled();
            });

            it("does not update the model if the same name", function () {
                mockEvent.type = "blur";
                mockCurrentTarget.textContent = mockDomainObject.getModel().name;
                controller.updateName(mockEvent);

                expect(mockMutationCapability.mutate).not.toHaveBeenCalled();
            });

            it("updates the model on enter keypress event only", function () {
                mockCurrentTarget.textContent = "New name";
                controller.updateName(mockEvent);

                expect(mockMutationCapability.mutate).not.toHaveBeenCalled();

                mockEvent.which = 13;
                controller.updateName(mockEvent);

                expect(mockMutationCapability.mutate).toHaveBeenCalledWith(jasmine.any(Function));

                mockMutationCapability.mutate.calls.mostRecent().args[0](model);

                expect(mockDomainObject.getModel().name).toBe("New name");
            });

            it("blurs the field on enter key press", function () {
                mockCurrentTarget.textContent = "New name";
                mockEvent.which = 13;
                controller.updateName(mockEvent);

                expect(mockEvent.currentTarget.blur).toHaveBeenCalled();
            });

            it("allows editting name when object is creatable", function () {
                expect(controller.allowEdit()).toBe(true);
            });

            it("disallows editting name when object is non-creatable", function () {
                mockTypeCapability.hasFeature.and.returnValue(false);

                expect(controller.allowEdit()).toBe(false);

            });
        });
    }
);
