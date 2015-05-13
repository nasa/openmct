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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/SplitPaneController"],
    function (SplitPaneController) {
        "use strict";

        describe("The split pane controller", function () {
            var controller;

            beforeEach(function () {
                controller = new SplitPaneController();
            });

            it("has an initial position", function () {
                expect(controller.state() > 0).toBeTruthy();
            });

            it("can be moved", function () {
                var initialState = controller.state();
                controller.startMove();
                controller.move(50);
                expect(controller.state()).toEqual(initialState + 50);
            });

            it("clamps its position", function () {
                var initialState = controller.state();
                controller.startMove();
                // Move some really extreme number
                controller.move(-100000);
                // Shouldn't have moved below 0...
                expect(controller.state() > 0).toBeTruthy();
                // ...but should have moved left somewhere
                expect(controller.state() < initialState).toBeTruthy();

                // Then do the same to the right
                controller.move(100000);
                // Shouldn't have moved below 0...
                expect(controller.state() < 100000).toBeTruthy();
                // ...but should have moved left somewhere
                expect(controller.state() > initialState).toBeTruthy();
            });

            it("accepts a default state", function () {
                // Should use default state the first time...
                expect(controller.state(12321)).toEqual(12321);
                // ...but not after it's been initialized
                expect(controller.state(42)).toEqual(12321);
            });

        });
    }
);