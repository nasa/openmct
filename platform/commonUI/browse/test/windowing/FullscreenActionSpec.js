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

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/windowing/FullscreenAction", "screenfull"],
    function (FullscreenAction, screenfull) {

        describe("The fullscreen action", function () {
            var action,
                oldToggle;

            beforeEach(function () {
                // Screenfull is not shimmed or injected, so
                // we need to spy on it in the global scope.
                oldToggle = screenfull.toggle;

                screenfull.toggle = jasmine.createSpy("toggle");

                action = new FullscreenAction({});
            });

            afterEach(function () {
                screenfull.toggle = oldToggle;
            });

            it("toggles fullscreen mode when performed", function () {
                action.perform();
                expect(window.screenfull.toggle).toHaveBeenCalled();
            });

            it("provides displayable metadata", function () {
                expect(action.getMetadata().cssClass).toBeDefined();
            });

        });
    }
);
