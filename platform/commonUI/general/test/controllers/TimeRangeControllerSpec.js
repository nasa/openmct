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
    ["../../src/controllers/TimeRangeController"],
    function (TimeRangeController) {
        "use strict";

        describe("The TimeRangeController", function () {
            var mockScope,
                mockNow,
                controller;

            function fireWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            function fireWatchCollection(expr, value) {
                mockScope.$watchCollection.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$apply", "$watch", "$watchCollection" ]
                );
                mockNow = jasmine.createSpy('now');
                controller = new TimeRangeController(mockScope, mockNow);
            });

            it("watches the model that was passed in", function () {
                expect(mockScope.$watchCollection)
                    .toHaveBeenCalledWith("ngModel", jasmine.any(Function));
            });


        });
    }
);
