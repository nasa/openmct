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
/*global describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/controllers/ElementsController"],
    function (ElementsController) {

        describe("The Elements Pane controller", function () {
            var mockScope,
                mockOpenMCT,
                mockSelection,
                mockDomainObject,
                mockMutationCapability,
                mockCompositionCapability,
                mockCompositionObjects,
                mockComposition,
                mockUnlisten,
                selectable = [],
                controller;

            function mockPromise(value) {
                return {
                    then: function (thenFunc) {
                        return mockPromise(thenFunc(value));
                    }
                };
            }

            function createDomainObject() {
                return {
                    useCapability: function () {
                        return mockCompositionCapability;
                    }
                };
            }

            beforeEach(function () {
                mockComposition = ["a", "b"];
                mockCompositionObjects = mockComposition.map(createDomainObject);
                mockCompositionCapability = mockPromise(mockCompositionObjects);

                mockUnlisten = jasmine.createSpy('unlisten');
                mockMutationCapability = jasmine.createSpyObj("mutationCapability", [
                    "listen"
                ]);
                mockMutationCapability.listen.and.returnValue(mockUnlisten);
                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "getCapability",
                    "useCapability"
                ]);
                mockDomainObject.useCapability.and.returnValue(mockCompositionCapability);
                mockDomainObject.getCapability.and.returnValue(mockMutationCapability);

                mockScope = jasmine.createSpyObj("$scope", ['$on']);
                mockSelection = jasmine.createSpyObj("selection", [
                    'on',
                    'off',
                    'get'
                ]);
                mockSelection.get.and.returnValue([]);
                mockOpenMCT = {
                    selection: mockSelection
                };

                selectable[0] = {
                    context: {
                        oldItem: mockDomainObject
                    }
                };

                spyOn(ElementsController.prototype, 'refreshComposition').and.callThrough();

                controller = new ElementsController(mockScope, mockOpenMCT);
            });

            function getModel(model) {
                return function () {
                    return model;
                };
            }

            it("filters objects in elements pool based on input text and" +
                " object name", function () {
                var objects = [
                    {
                        getModel: getModel({name: "first element"})
                    },
                    {
                        getModel: getModel({name: "second element"})
                    },
                    {
                        getModel: getModel({name: "third element"})
                    },
                    {
                        getModel: getModel({name: "THIRD Element 1"})
                    }
                ];

                mockScope.filterBy("third element");
                expect(objects.filter(mockScope.searchElements).length).toBe(2);
                mockScope.filterBy("element");
                expect(objects.filter(mockScope.searchElements).length).toBe(4);
            });

            it("refreshes composition on selection", function () {
                mockOpenMCT.selection.on.calls.mostRecent().args[1](selectable);

                expect(ElementsController.prototype.refreshComposition).toHaveBeenCalledWith(mockDomainObject);
            });

            it("listens on mutation and refreshes composition", function () {
                mockOpenMCT.selection.on.calls.mostRecent().args[1](selectable);

                expect(mockDomainObject.getCapability).toHaveBeenCalledWith('mutation');
                expect(mockMutationCapability.listen).toHaveBeenCalled();
                expect(ElementsController.prototype.refreshComposition.calls.count()).toBe(1);

                mockMutationCapability.listen.calls.mostRecent().args[0](mockDomainObject);

                expect(ElementsController.prototype.refreshComposition.calls.count()).toBe(2);
            });

            it("cleans up mutation listener when selection changes", function () {
                mockOpenMCT.selection.on.calls.mostRecent().args[1](selectable);

                expect(mockMutationCapability.listen).toHaveBeenCalled();

                mockOpenMCT.selection.on.calls.mostRecent().args[1](selectable);

                expect(mockUnlisten).toHaveBeenCalled();
            });

            it("does not listen on mutation for element proxy selectable", function () {
                selectable[0] = {
                    context: {
                        elementProxy: {}
                    }
                };
                mockOpenMCT.selection.on.calls.mostRecent().args[1](selectable);

                expect(mockDomainObject.getCapability).not.toHaveBeenCalledWith('mutation');
            });

            it("checks concurrent changes to composition", function () {
                var secondMockComposition = ["a", "b", "c"],
                    secondMockCompositionObjects = secondMockComposition.map(createDomainObject),
                    firstCompositionCallback,
                    secondCompositionCallback;

                spyOn(mockCompositionCapability, "then").and.callThrough();

                controller.refreshComposition(mockDomainObject);
                controller.refreshComposition(mockDomainObject);

                firstCompositionCallback = mockCompositionCapability.then.calls.all()[0].args[0];
                secondCompositionCallback = mockCompositionCapability.then.calls.all()[1].args[0];
                secondCompositionCallback(secondMockCompositionObjects);
                firstCompositionCallback(mockCompositionObjects);

                expect(mockScope.composition).toBe(secondMockCompositionObjects);
            });
        });
    }
);
