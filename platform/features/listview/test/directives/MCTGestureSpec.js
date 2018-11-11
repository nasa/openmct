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
    ["../../src/directives/MCTGesture"],
    function (MCTGesture) {
        describe("The Gesture Listener for the ListView items", function () {
            var mctGesture,
                gestureService,
                scope,
                element,
                attrs,
                attachedGesture;
            beforeEach(function () {
                attachedGesture = jasmine.createSpyObj(
                    "attachedGesture",
                    ['destroy']
                );
                gestureService = jasmine.createSpyObj(
                    "gestureService",
                    ["attachGestures"]
                );
                gestureService.attachGestures.and.returnValue(
                    attachedGesture
                );
                mctGesture = MCTGesture(gestureService);
            });
            it("creates a directive Object", function () {
                expect(mctGesture).toBeDefined();
            });
            it("has link function that attaches gesture to gestureService",
                function () {
                    attrs = {
                        mctGesture: "menu,info"
                    };
                    element = jasmine.createSpy("element");
                    scope = jasmine.createSpyObj(
                        "$scope",
                        ["$on", "$eval"]
                    );
                    scope.domainObject = "fake domainObject";
                    mctGesture.link(scope, element, attrs);
                    expect(gestureService.attachGestures).toHaveBeenCalled();
                }
            );
            it("release gesture service on $destroy", function () {
                attrs = {
                    mctGesture: "menu,info"
                };
                element = jasmine.createSpy("element");
                scope = jasmine.createSpyObj(
                    "$scope",
                    ["$on", "$eval"]
                );
                scope.domainObject = "fake domainObject";
                mctGesture.link(scope, element, attrs);
                expect(scope.$on).toHaveBeenCalledWith(
                    '$destroy',
                     jasmine.any(Function)
                );
                scope.$on.calls.mostRecent().args[1]();
                expect(attachedGesture.destroy).toHaveBeenCalled();
            });

        });
    }
);
