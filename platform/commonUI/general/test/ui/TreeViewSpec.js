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
/*global describe,beforeEach,jasmine,it,expect*/

define([
    '../../src/ui/TreeView',
    'zepto'
], (TreeView, $) => {

    describe("TreeView", () => {
        let mockGestureService,
            mockGestureHandle,
            mockDomainObject,
            mockMutation,
            mockUnlisten,
            testCapabilities,
            treeView;

        const makeMockDomainObject = (id, model, capabilities) => {
            let mockDomainObj = jasmine.createSpyObj(
                'domainObject-' + id,
                [
                    'getId',
                    'getModel',
                    'getCapability',
                    'hasCapability',
                    'useCapability'
                ]
            );
            mockDomainObj.getId.andReturn(id);
            mockDomainObj.getModel.andReturn(model);
            mockDomainObj.hasCapability.andCallFake( (c) => {
                return !!(capabilities[c]);
            });
            mockDomainObj.getCapability.andCallFake( (c) => {
                return capabilities[c];
            });
            mockDomainObj.useCapability.andCallFake( (c) => {
                return capabilities[c] && capabilities[c].invoke();
            });
            return mockDomainObj;
        }

        beforeEach( () => {
            mockGestureService = jasmine.createSpyObj(
                'gestureService',
                ['attachGestures']
            );

            mockGestureHandle = jasmine.createSpyObj('gestures', ['destroy']);

            mockGestureService.attachGestures.andReturn(mockGestureHandle);

            mockMutation = jasmine.createSpyObj('mutation', ['listen']);
            mockUnlisten = jasmine.createSpy('unlisten');
            mockMutation.listen.andReturn(mockUnlisten);

            testCapabilities = { mutation: mockMutation };

            mockDomainObject =
                makeMockDomainObject('parent', {}, testCapabilities);

            treeView = new TreeView(mockGestureService);
        });

        describe("elements", () => {
            let elements;

            beforeEach( () => {
                elements = treeView.elements();
            });

            it("is an unordered list", () => {
                expect(elements[0].tagName.toLowerCase())
                    .toEqual('ul');
            });
        });

        describe("model", () => {
            let mockComposition;

            const makeGenericCapabilities = () => {
                let mockStatus =
                        jasmine.createSpyObj('status', ['listen', 'list']);

                mockStatus.list.andReturn([]);

                return {
                    context: jasmine.createSpyObj('context', ['getPath']),
                    type: jasmine.createSpyObj('type', ['getCssClass']),
                    location: jasmine.createSpyObj('location', ['isLink']),
                    mutation: jasmine.createSpyObj('mutation', ['listen']),
                    status: mockStatus
                };
            }

            const waitForCompositionCallback = () => {
                let calledBack = false;
                testCapabilities.composition.invoke().then( () => {
                    calledBack = true;
                });
                waitsFor( () => {
                    return calledBack;
                });
            }

            beforeEach( () => {
                mockComposition = ['a', 'b', 'c'].map( (id) => {
                    let testCaps = makeGenericCapabilities(),
                        mockChild =
                            makeMockDomainObject(id, {}, testCaps);

                    testCaps.context.getPath
                        .andReturn([mockDomainObject, mockChild]);

                    return mockChild;
                });

                testCapabilities.composition =
                    jasmine.createSpyObj('composition', ['invoke']);
                testCapabilities.composition.invoke
                    .andReturn(Promise.resolve(mockComposition));

                treeView.model(mockDomainObject);
                waitForCompositionCallback();
            });

            it("adds one node per composition element", () => {
                expect(treeView.elements()[0].childElementCount)
                    .toEqual(mockComposition.length);
            });

            it("listens for mutation", () => {
                expect(testCapabilities.mutation.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            describe("when mutation occurs", () => {
                beforeEach( () => {
                    mockComposition.pop();
                    testCapabilities.mutation.listen
                        .mostRecentCall.args[0](mockDomainObject.getModel());
                    waitForCompositionCallback();
                });

                it("continues to show one node per composition element", () => {
                    expect(treeView.elements()[0].childElementCount)
                        .toEqual(mockComposition.length);
                });
            });

            describe("when replaced with a non-compositional domain object", () => {
                beforeEach( () => {
                    delete testCapabilities.composition;
                    treeView.model(mockDomainObject);
                });

                it("stops listening for mutation", () => {
                    expect(mockUnlisten).toHaveBeenCalled();
                });

                it("removes all tree nodes", () => {
                    expect(treeView.elements()[0].childElementCount)
                        .toEqual(0);
                });
            });

            describe("when selection state changes", () => {
                let selectionIndex = 1;

                beforeEach( () => {
                    treeView.value(mockComposition[selectionIndex]);
                });

                it("communicates selection state to an appropriate node", () => {
                    let selected = $(treeView.elements()[0]).find('.selected');
                    expect(selected.length).toEqual(1);
                });
            });

            describe("when a context-less object is selected", () => {
                beforeEach( () => {
                    let testCaps = makeGenericCapabilities(),
                        mockDomainObj =
                            makeMockDomainObject('xyz', {}, testCaps);
                    delete testCaps.context;
                    treeView.value(mockDomainObj);
                });

                it("clears all selection state", () => {
                    let selected = $(treeView.elements()[0]).find('.selected');
                    expect(selected.length).toEqual(0);
                });
            });

            describe("when children contain children", () => {
                beforeEach( () => {
                    let newCapabilities = makeGenericCapabilities(),
                        gcCapabilities = makeGenericCapabilities(),
                        mockNewChild =
                            makeMockDomainObject('d', {}, newCapabilities),
                        mockGrandchild =
                            makeMockDomainObject('gc', {}, gcCapabilities),
                        calledBackInner = false;

                    newCapabilities.composition =
                        jasmine.createSpyObj('composition', ['invoke']);
                    newCapabilities.composition.invoke
                        .andReturn(Promise.resolve([mockGrandchild]));
                    mockComposition.push(mockNewChild);

                    newCapabilities.context.getPath.andReturn([
                        mockDomainObject,
                        mockNewChild
                    ]);
                    gcCapabilities.context.getPath.andReturn([
                        mockDomainObject,
                        mockNewChild,
                        mockGrandchild
                    ]);

                    testCapabilities.mutation.listen
                        .mostRecentCall.args[0](mockDomainObject);
                    waitForCompositionCallback();
                    runs( () => {
                        // Select the innermost object to force expansion,
                        // such that we can verify the subtree is present.
                        treeView.value(mockGrandchild);
                        newCapabilities.composition.invoke().then( () => {
                            calledBackInner = true;
                        });
                    });
                    waitsFor( () => {
                        return calledBackInner;
                    });
                });

                it("creates inner trees", () => {
                    expect($(treeView.elements()[0]).find('ul').length)
                        .toEqual(1);
                });
            });

            describe("when status changes", () => {
                let testStatuses;

                beforeEach( () => {
                    let mockStatus = mockComposition[1].getCapability('status');

                    testStatuses = ['foo'];

                    mockStatus.list.andReturn(testStatuses);
                    mockStatus.listen.mostRecentCall.args[0](testStatuses);
                });

                it("reflects the status change in the tree", () => {
                    expect($(treeView.elements()).find('.s-status-foo').length)
                        .toEqual(1);
                });
            });
        });

        describe("observe", () => {
            let mockCallback,
                unobserve;

            beforeEach( () => {
                mockCallback = jasmine.createSpy('callback');
                unobserve = treeView.observe(mockCallback);
            });

            it("notifies listeners when value is changed", () => {
                treeView.value(mockDomainObject, {some: event});
                expect(mockCallback)
                    .toHaveBeenCalledWith(mockDomainObject, {some: event});
            });

            it("does not notify listeners when deactivated", () => {
                unobserve();
                treeView.value(mockDomainObject);
                expect(mockCallback).not.toHaveBeenCalled();
            });
        });
    });

});
