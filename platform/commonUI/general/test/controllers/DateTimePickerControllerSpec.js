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
    ["../../src/controllers/DateTimePickerController", "moment"],
    function (DateTimePickerController, moment) {
        "use strict";

        describe("The DateTimePickerController", function () {
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
                mockScope.ngModel = {};
                mockScope.field = "testField";
                mockNow = jasmine.createSpy('now');
                controller = new DateTimePickerController(mockScope, mockNow);
            });

            it("watches the model that was passed in", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "ngModel[field]",
                    jasmine.any(Function)
                );
            });

            it("updates date/time state in scope when model changes", function () {
                fireWatch(
                    "ngModel[field]",
                    moment.utc("1998-01-06 12:34:56").valueOf()
                );
                expect(mockScope.date.year).toEqual(1998);
                expect(mockScope.date.month).toEqual(0); // Months are zero-indexed
                expect(mockScope.date.day).toEqual(6);
                expect(mockScope.time.hours).toEqual(12);
                expect(mockScope.time.minutes).toEqual(34);
                expect(mockScope.time.seconds).toEqual(56);
            });

            it("updates value in model when values in scope change", function () {
                mockScope.date = {
                    year: 1998,
                    month: 0,
                    day: 6
                };
                mockScope.time = {
                    hours: 12,
                    minutes: 34,
                    seconds: 56
                };
                fireWatchCollection("date", mockScope.date);
                expect(mockScope.ngModel[mockScope.field])
                    .toEqual(moment.utc("1998-01-06 12:34:56").valueOf());
            });

        });
    }
);
