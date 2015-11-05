/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/directives/MCTSwimlaneDrag', '../../src/directives/SwimlaneDragConstants'],
    function (MCTSwimlaneDrag, SwimlaneDragConstants) {
        "use strict";

        describe("The mct-swimlane-drag directive", function () {
            var mockDndService,
                mockScope,
                mockElement,
                testAttrs,
                handlers,
                directive;

            beforeEach(function () {
                var scopeExprs = {
                    someTestExpr: "some swimlane"
                };

                handlers = {};

                mockDndService = jasmine.createSpyObj(
                    'dndService',
                    ['setData', 'getData', 'removeData']
                );
                mockScope = jasmine.createSpyObj('$scope', ['$eval']);
                mockElement = jasmine.createSpyObj('element', ['on']);
                testAttrs = { mctSwimlaneDrag: "someTestExpr" };

                // Simulate evaluation of expressions in scope
                mockScope.$eval.andCallFake(function (expr) {
                    return scopeExprs[expr];
                });

                directive = new MCTSwimlaneDrag(mockDndService);

                // Run the link function, then capture the event handlers
                // for testing.
                directive.link(mockScope, mockElement, testAttrs);

                mockElement.on.calls.forEach(function (call) {
                    handlers[call.args[0]] = call.args[1];
                });

            });

            it("is available as an attribute", function () {
                expect(directive.restrict).toEqual("A");
            });

            it("exposes the swimlane when dragging starts", function () {
                // Verify precondition
                expect(mockDndService.setData).not.toHaveBeenCalled();
                // Start a drag
                handlers.dragstart();
                // Should have exposed the swimlane
                expect(mockDndService.setData).toHaveBeenCalledWith(
                    SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE,
                    "some swimlane"
                );
            });

            it("clears the swimlane when dragging ends", function () {
                // Verify precondition
                expect(mockDndService.removeData).not.toHaveBeenCalled();
                // Start a drag
                handlers.dragend();
                // Should have exposed the swimlane
                expect(mockDndService.removeData).toHaveBeenCalledWith(
                    SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE
                );
            });
        });
    }
);
