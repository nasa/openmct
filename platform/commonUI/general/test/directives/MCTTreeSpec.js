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
    '../../src/directives/MCTTree'
], function (MCTTree) {
    describe("The mct-tree directive", function () {
        var mockParse,
            mockGestureService,
            mockExpr,
            mctTree;

        beforeEach(function () {
            mockGestureService = jasmine.createSpyObj(
                'gestureService',
                [ 'attachGestures' ]
            );
            mockParse = jasmine.createSpy('$parse');
            mockExpr = jasmine.createSpy('expr');
            mockExpr.assign = jasmine.createSpy('assign');
            mockParse.andReturn(mockExpr);

            mctTree = new MCTTree(mockParse, mockGestureService);
        });

        it("is applicable as an element", function () {
            expect(mctTree.restrict).toEqual("E");
        });

        it("two-way binds to mctObject", function () {
            expect(mctTree.scope).toEqual({ mctObject: "=" });
        });

        describe("link", function () {
            var mockScope,
                mockElement,
                testAttrs;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$watch', '$on']);
                mockElement = jasmine.createSpyObj('element', ['append']);
                testAttrs = { mctModel: "some-expression" };
                mockScope.$parent =
                    jasmine.createSpyObj('$scope', ['$watch', '$on']);
                mctTree.link(mockScope, mockElement, testAttrs);
            });

            it("populates the mct-tree element", function () {
                expect(mockElement.append).toHaveBeenCalled();
            });

            it("watches for mct-model's expression in the parent", function () {
                expect(mockScope.$parent.$watch).toHaveBeenCalledWith(
                    testAttrs.mctModel,
                    jasmine.any(Function)
                );
            });

            it("watches for changes to mct-object", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "mctObject",
                    jasmine.any(Function)
                );
            });

            it("listens for the $destroy event", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
            });
        });
    });

});
