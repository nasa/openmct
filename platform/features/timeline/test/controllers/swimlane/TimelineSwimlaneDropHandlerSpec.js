/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ['../../../src/controllers/swimlane/TimelineSwimlaneDropHandler'],
    function (TimelineSwimlaneDropHandler) {

        describe("A timeline's swimlane drop handler", function () {
            var mockSwimlane,
                mockOtherObject,
                mockActionCapability,
                mockEditorCapability,
                mockContext,
                mockAction,
                handler;

            beforeEach(function () {
                var mockPromise = jasmine.createSpyObj('promise', ['then']);

                mockEditorCapability = jasmine.createSpyObj('editorCapability', ['inEditContext']);

                mockSwimlane = jasmine.createSpyObj(
                    "swimlane",
                    ["highlight", "highlightBottom"]
                );
                // domainObject, idPath, children, expanded
                mockSwimlane.domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability", "useCapability", "hasCapability"]
                );
                mockSwimlane.idPath = ['a', 'b'];
                mockSwimlane.children = [{}];
                mockSwimlane.expanded = true;

                mockSwimlane.parent = {};
                mockSwimlane.parent.idPath = ['a'];
                mockSwimlane.parent.domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability", "useCapability", "hasCapability"]
                );
                mockSwimlane.parent.children = [mockSwimlane];

                mockSwimlane.children[0].domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability", "useCapability", "hasCapability"]
                );

                mockAction = jasmine.createSpyObj('action', ['perform']);
                mockAction.perform.and.returnValue(mockPromise);
                mockPromise.then.and.callFake(function (callback) {
                    callback();
                });

                mockOtherObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability", "useCapability", "hasCapability"]
                );
                mockActionCapability = jasmine.createSpyObj("action", ["perform", "getActions"]);
                mockContext = jasmine.createSpyObj('context', ['getParent']);

                mockActionCapability.getActions.and.returnValue([mockAction]);
                mockSwimlane.parent.domainObject.getId.and.returnValue('a');
                mockSwimlane.domainObject.getId.and.returnValue('b');
                mockSwimlane.children[0].domainObject.getId.and.returnValue('c');
                mockOtherObject.getId.and.returnValue('d');


                mockSwimlane.domainObject.getCapability.and.callFake(function (c) {
                    return {
                        action: mockActionCapability,
                        editor: mockEditorCapability
                    }[c];
                });
                mockSwimlane.parent.domainObject.getCapability.and.callFake(function (c) {
                    return {
                        action: mockActionCapability,
                        editor: mockEditorCapability
                    }[c];
                });
                mockOtherObject.getCapability.and.callFake(function (c) {
                    return {
                        action: mockActionCapability,
                        context: mockContext,
                        editor: mockEditorCapability
                    }[c];
                });
                mockContext.getParent.and.returnValue(mockOtherObject);

                mockSwimlane.domainObject.hasCapability.and.returnValue(true);

                handler = new TimelineSwimlaneDropHandler(mockSwimlane);
            });

            it("disallows drop outside of edit mode", function () {
                mockEditorCapability.inEditContext.and.returnValue(true);
                // Verify precondition
                expect(handler.allowDropIn('d', mockSwimlane.domainObject))
                    .toBeTruthy();
                expect(handler.allowDropAfter('d', mockSwimlane.domainObject))
                    .toBeTruthy();
                // Act as if we're not in edit mode
                mockEditorCapability.inEditContext.and.returnValue(false);
                // Now, they should be disallowed
                expect(handler.allowDropIn('d', mockSwimlane.domainObject))
                    .toBeFalsy();
                expect(handler.allowDropAfter('d', mockSwimlane.domainObject))
                    .toBeFalsy();

                // Verify that editor capability was really checked for
                expect(mockSwimlane.domainObject.hasCapability)
                    .toHaveBeenCalledWith('editor');
            });

            it("disallows dropping of parents", function () {
                var mockParent = mockSwimlane.parent.domainObject;
                expect(handler.allowDropIn('a', mockParent)).toBeFalsy();
                expect(handler.allowDropAfter('a', mockParent)).toBeFalsy();
            });

            it("does not drop when no highlight state is present", function () {
                // If there's no hover highlight, there's no drop allowed
                handler.drop('d', mockOtherObject);
                expect(mockOtherObject.getCapability)
                    .not.toHaveBeenCalled();
                expect(mockSwimlane.domainObject.useCapability)
                    .not.toHaveBeenCalled();
                expect(mockSwimlane.parent.domainObject.useCapability)
                    .not.toHaveBeenCalled();
            });

            it("inserts into when highlighted", function () {
                var testModel = { composition: ['c'] };
                mockSwimlane.highlight.and.returnValue(true);
                handler.drop('d', mockOtherObject);
                // Should have mutated
                expect(mockSwimlane.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.domainObject.useCapability.calls.mostRecent()
                    .args[1](testModel);
                expect(testModel.composition).toEqual(['c', 'd']);
            });

            it("inserts after as a peer when highlighted at the bottom", function () {
                var testModel = { composition: ['x', 'b', 'y'] };
                mockSwimlane.highlightBottom.and.returnValue(true);
                mockSwimlane.expanded = false;
                handler.drop('d', mockOtherObject);
                // Should have mutated
                expect(mockSwimlane.parent.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.parent.domainObject.useCapability.calls.mostRecent()
                    .args[1](testModel);
                expect(testModel.composition).toEqual(['x', 'b', 'd', 'y']);
            });

            it("inserts into when highlighted at the bottom and expanded", function () {
                var testModel = { composition: ['c'] };
                mockSwimlane.highlightBottom.and.returnValue(true);
                mockSwimlane.expanded = true;
                handler.drop('d', mockOtherObject);
                // Should have mutated
                expect(mockSwimlane.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.domainObject.useCapability.calls.mostRecent()
                    .args[1](testModel);
                expect(testModel.composition).toEqual(['d', 'c']);
            });

            it("inserts after as a peer when highlighted at the bottom and childless", function () {
                var testModel = { composition: ['x', 'b', 'y'] };
                mockSwimlane.highlightBottom.and.returnValue(true);
                mockSwimlane.expanded = true;
                mockSwimlane.children = [];
                handler.drop('d', mockOtherObject);
                // Should have mutated
                expect(mockSwimlane.parent.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.parent.domainObject.useCapability.calls.mostRecent()
                    .args[1](testModel);
                expect(testModel.composition).toEqual(['x', 'b', 'd', 'y']);
            });

            it("allows reordering within a parent", function () {
                var testModel = { composition: ['x', 'b', 'y', 'd'] };

                mockSwimlane.highlightBottom.and.returnValue(true);
                mockSwimlane.expanded = true;
                mockSwimlane.children = [];
                mockContext.getParent.and.returnValue(mockSwimlane.parent.domainObject);

                return new Promise(function (resolve, reject) {
                    mockSwimlane.parent.domainObject.useCapability.and.callFake(function (name, callback) {
                        resolve(callback);
                    });
                    handler.drop('d', mockOtherObject);
                }).then(function (callback) {
                    callback(testModel);
                    expect(testModel.composition).toEqual(['x', 'b', 'd', 'y']);
                });
            });

            it("does not invoke an action when reordering", function () {
                mockSwimlane.highlightBottom.and.returnValue(true);
                mockSwimlane.expanded = true;
                mockSwimlane.children = [];
                mockContext.getParent
                    .and.returnValue(mockSwimlane.parent.domainObject);
                handler.drop('d', mockOtherObject);
                expect(mockAction.perform).not.toHaveBeenCalled();
            });

        });
    }
);
