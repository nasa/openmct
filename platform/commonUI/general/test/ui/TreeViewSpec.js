/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,beforeEach,jasmine,it,expect*/

define([
    '../../src/ui/TreeView'
], function (TreeView) {
    'use strict';

    describe("TreeView", function () {
        var mockGestureService,
            mockGestureHandle,
            mockDomainObject,
            mockMutation,
            mockUnlisten,
            testCapabilities,
            treeView;

        beforeEach(function () {
            mockGestureService = jasmine.createSpyObj(
                'gestureService',
                [ 'attachGestures' ]
            );

            mockGestureHandle = jasmine.createSpyObj('gestures', ['destroy']);

            mockGestureService.attachGestures.andReturn(mockGestureHandle);

            mockDomainObject = jasmine.createSpyObj(
                'domainObject',
                [
                    'getId',
                    'getModel',
                    'getCapability',
                    'hasCapability',
                    'useCapability'
                ]
            );

            mockMutation = jasmine.createSpyObj('mutation', ['listen']);
            mockUnlisten = jasmine.createSpy('unlisten');
            mockMutation.listen.andReturn(mockUnlisten);

            testCapabilities = { mutation: mockMutation };

            mockDomainObject.hasCapability.andCallFake(function (c) {
                return !!(testCapabilities[c]);
            });
            mockDomainObject.getCapability.andCallFake(function (c) {
                return testCapabilities[c];
            });
            mockDomainObject.useCapability.andCallFake(function (c) {
                return testCapabilities[c] && testCapabilities[c].invoke();
            });

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
                    var mockDomainObject = jasmine.createSpyObj(
                        'domainObject-' + id,
                        [
                            'getId',
                            'getModel',
                            'getCapability',
                            'hasCapability',
                            'useCapability'
                        ]
                    );
                    mockDomainObject.getId.andReturn(id);
                    mockDomainObject.getModel.andReturn({});
                    return mockDomainObject;
                });

                testCapabilities.composition = jasmine.createSpyObj(
                    'composition',
                    ['invoke']
                );
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
                        .mostRecentCall.args[0](mockDomainObject);
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
        });

        describe("observe", function () {
            var mockCallback,
                unobserve;

            beforeEach(function () {
                mockCallback = jasmine.createSpy('callback');
                unobserve = treeView.observe(mockCallback);
            });

            it("notifies listeners when value is changed", function () {
                treeView.value(mockDomainObject);
                expect(mockCallback).toHaveBeenCalledWith(mockDomainObject);
            });

            it("does not notify listeners when deactivated", function () {
                unobserve();
                treeView.value(mockDomainObject);
                expect(mockCallback).not.toHaveBeenCalled();
            });
        });
    });

});
