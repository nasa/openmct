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
/*global describe,beforeEach,jasmine,it,expect*/

define([
    '../../src/ui/TreeView',
    'zepto'
], function (TreeView, $) {

    describe("TreeView", function () {
        var mockGestureService,
            mockGestureHandle,
            mockDomainObject,
            mockMutation,
            mockUnlisten,
            testCapabilities,
            treeView;

        function makeMockDomainObject(id, model, capabilities) {
            var mockDomainObj = jasmine.createSpyObj(
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
            mockDomainObj.hasCapability.andCallFake(function (c) {
                return !!(capabilities[c]);
            });
            mockDomainObj.getCapability.andCallFake(function (c) {
                return capabilities[c];
            });
            mockDomainObj.useCapability.andCallFake(function (c) {
                return capabilities[c] && capabilities[c].invoke();
            });
            return mockDomainObj;
        }

        beforeEach(function () {
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

        describe("elements", function () {
            var elements;

            beforeEach(function () {
                elements = treeView.elements();
            });

            it("is an unordered list", function () {
                expect(elements[0].tagName.toLowerCase())
                    .toEqual('ul');
            });
        });

        describe("model", function () {
            var mockComposition;

            function makeGenericCapabilities() {
                var mockStatus =
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

            function waitForCompositionCallback() {
                var calledBack = false;
                testCapabilities.composition.invoke().then(function () {
                    calledBack = true;
                });
                waitsFor(function () {
                    return calledBack;
                });
            }

            beforeEach(function () {
                mockComposition = ['a', 'b', 'c'].map(function (id) {
                    var testCaps = makeGenericCapabilities(),
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

            it("adds one node per composition element", function () {
                expect(treeView.elements()[0].childElementCount)
                    .toEqual(mockComposition.length);
            });

            it("listens for mutation", function () {
                expect(testCapabilities.mutation.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            describe("when mutation occurs", function () {
                beforeEach(function () {
                    mockComposition.pop();
                    testCapabilities.mutation.listen
                        .mostRecentCall.args[0](mockDomainObject.getModel());
                    waitForCompositionCallback();
                });

                it("continues to show one node per composition element", function () {
                    expect(treeView.elements()[0].childElementCount)
                        .toEqual(mockComposition.length);
                });
            });

            describe("when replaced with a non-compositional domain object", function () {
                beforeEach(function () {
                    delete testCapabilities.composition;
                    treeView.model(mockDomainObject);
                });

                it("stops listening for mutation", function () {
                    expect(mockUnlisten).toHaveBeenCalled();
                });

                it("removes all tree nodes", function () {
                    expect(treeView.elements()[0].childElementCount)
                        .toEqual(0);
                });
            });

            describe("when selection state changes", function () {
                var selectionIndex = 1;

                beforeEach(function () {
                    treeView.value(mockComposition[selectionIndex]);
                });

                it("communicates selection state to an appropriate node", function () {
                    var selected = $(treeView.elements()[0]).find('.selected');
                    expect(selected.length).toEqual(1);
                });
            });

            describe("when a context-less object is selected", function () {
                beforeEach(function () {
                    var testCaps = makeGenericCapabilities(),
                        mockDomainObj =
                            makeMockDomainObject('xyz', {}, testCaps);
                    delete testCaps.context;
                    treeView.value(mockDomainObj);
                });

                it("clears all selection state", function () {
                    var selected = $(treeView.elements()[0]).find('.selected');
                    expect(selected.length).toEqual(0);
                });
            });

            describe("when children contain children", function () {
                beforeEach(function () {
                    var newCapabilities = makeGenericCapabilities(),
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
                    runs(function () {
                        // Select the innermost object to force expansion,
                        // such that we can verify the subtree is present.
                        treeView.value(mockGrandchild);
                        newCapabilities.composition.invoke().then(function () {
                            calledBackInner = true;
                        });
                    });
                    waitsFor(function () {
                        return calledBackInner;
                    });
                });

                it("creates inner trees", function () {
                    expect($(treeView.elements()[0]).find('ul').length)
                        .toEqual(1);
                });
            });

            describe("when status changes", function () {
                var testStatuses;

                beforeEach(function () {
                    var mockStatus = mockComposition[1].getCapability('status');

                    testStatuses = ['foo'];

                    mockStatus.list.andReturn(testStatuses);
                    mockStatus.listen.mostRecentCall.args[0](testStatuses);
                });

                it("reflects the status change in the tree", function () {
                    expect($(treeView.elements()).find('.s-status-foo').length)
                        .toEqual(1);
                });
            });
        });

        describe("observe", function () {
            var mockCallback,
                unobserve;

            beforeEach(function () {
                mockCallback = jasmine.createSpy('callback');
                unobserve = treeView.observe(mockCallback);
            });

            it("notifies listeners when value is changed", function () {
                treeView.value(mockDomainObject, {some: event});
                expect(mockCallback)
                    .toHaveBeenCalledWith(mockDomainObject, {some: event});
            });

            it("does not notify listeners when deactivated", function () {
                unobserve();
                treeView.value(mockDomainObject);
                expect(mockCallback).not.toHaveBeenCalled();
            });
        });
    });

});
