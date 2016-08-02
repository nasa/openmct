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
    ["../../src/actions/EditAndComposeAction"],
    function (EditAndComposeAction) {

        describe("The Link action", function () {
            var mockQ,
                mockDomainObject,
                mockParent,
                mockContext,
                mockComposition,
                mockPersistence,
                mockActionCapability,
                mockEditAction,
                mockType,
                actionContext,
                model,
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


                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability"]
                );
                mockQ = { when: mockPromise };
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
                mockContext = jasmine.createSpyObj("context", ["getParent"]);
                mockComposition = jasmine.createSpyObj("composition", ["invoke", "add"]);
                mockPersistence = jasmine.createSpyObj("persistence", ["persist"]);
                mockType = jasmine.createSpyObj("type", ["hasFeature", "getKey"]);
                mockActionCapability = jasmine.createSpyObj("actionCapability", ["getActions"]);
                mockEditAction = jasmine.createSpyObj("editAction", ["perform"]);

                mockDomainObject.getId.andReturn("test");
                mockDomainObject.getCapability.andReturn(mockContext);
                mockContext.getParent.andReturn(mockParent);
                mockType.hasFeature.andReturn(true);
                mockType.getKey.andReturn("layout");
                mockComposition.invoke.andReturn(mockPromise(true));
                mockComposition.add.andReturn(mockPromise(true));
                mockActionCapability.getActions.andReturn([]);

                capabilities = {
                    composition: mockComposition,
                    persistence: mockPersistence,
                    action: mockActionCapability,
                    type: mockType
                };
                model = {
                    composition: ["a", "b", "c"]
                };

                actionContext = {
                    domainObject: mockParent,
                    selectedObject: mockDomainObject
                };

                action = new EditAndComposeAction(actionContext);
            });


            it("adds to the parent's composition when performed", function () {
                action.perform();
                expect(mockComposition.add)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("persists changes afterward", function () {
                action.perform();
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("enables edit mode for objects that have an edit action", function () {
                mockActionCapability.getActions.andReturn([mockEditAction]);
                action.perform();
                expect(mockEditAction.perform).toHaveBeenCalled();
            });

            it("Does not enable edit mode for objects that do not have an" +
                " edit action", function () {
                mockActionCapability.getActions.andReturn([]);
                action.perform();
                expect(mockEditAction.perform).not.toHaveBeenCalled();
                expect(mockComposition.add)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

        });
    }
);
