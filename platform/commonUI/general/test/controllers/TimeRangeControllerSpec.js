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
    ["../../src/controllers/TimeRangeController", "moment"],
    function (TimeRangeController, moment) {
        "use strict";

        var SEC = 1000,
            MIN = 60 * SEC,
            HOUR = 60 * MIN,
            DAY = 24 * HOUR;

        describe("The TimeRangeController", function () {
            var mockScope,
                mockFormatService,
                testDefaultFormat,
                mockNow,
                mockFormat,
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
                mockFormatService = jasmine.createSpyObj(
                    "formatService",
                    [ "getFormat" ]
                );
                testDefaultFormat = 'utc';
                mockFormat = jasmine.createSpyObj(
                    "format",
                    [ "validate", "format", "parse" ]
                );

                mockFormatService.getFormat.andReturn(mockFormat);

                mockFormat.format.andCallFake(function (value) {
                    return moment.utc(value).format("YYYY-MM-DD HH:mm:ss");
                });

                mockNow = jasmine.createSpy('now');

                controller = new TimeRangeController(
                    mockScope,
                    mockFormatService,
                    testDefaultFormat,
                    mockNow
                );
            });

            it("watches the model that was passed in", function () {
                expect(mockScope.$watchCollection)
                    .toHaveBeenCalledWith("ngModel", jasmine.any(Function));
            });

            describe("when changes are made via form entry", function () {
                beforeEach(function () {
                    mockScope.ngModel = {
                        outer: { start: DAY * 2, end: DAY * 3 },
                        inner: { start: DAY * 2.25, end: DAY * 2.75 }
                    };
                    mockScope.formModel = {
                        start: DAY * 10000,
                        end: DAY * 11000
                    };
                    // These watches may not exist, but Angular would fire
                    // them if they did.
                    fireWatchCollection("formModel", mockScope.formModel);
                    fireWatch("formModel.start", mockScope.formModel.start);
                    fireWatch("formModel.end", mockScope.formModel.end);
                });

                it("does not immediately make changes to the model", function () {
                    expect(mockScope.ngModel.outer.start)
                        .not.toEqual(mockScope.formModel.start);
                    expect(mockScope.ngModel.outer.end)
                        .not.toEqual(mockScope.formModel.end);
                });

                it("updates model bounds on request", function () {
                    mockScope.updateBoundsFromForm();
                    expect(mockScope.ngModel.outer.start)
                        .toEqual(mockScope.formModel.start);
                    expect(mockScope.ngModel.outer.end)
                        .toEqual(mockScope.formModel.end);
                });
            });

            describe("when dragged", function () {
                beforeEach(function () {
                    mockScope.ngModel = {
                        outer: {
                            start: DAY * 1000,
                            end: DAY * 1001
                        },
                        inner: {
                            start: DAY * 1000 + HOUR * 3,
                            end: DAY * 1001 - HOUR * 3
                        }
                    };
                    mockScope.spanWidth = 1000;
                    fireWatch("spanWidth", mockScope.spanWidth);
                    fireWatchCollection("ngModel", mockScope.ngModel);
                });

                it("updates the start time for left drags", function () {
                    mockScope.startLeftDrag();
                    mockScope.leftDrag(250);
                    expect(mockScope.ngModel.inner.start)
                        .toEqual(DAY * 1000 + HOUR * 9);
                });

                it("updates the end time for right drags", function () {
                    mockScope.startRightDrag();
                    mockScope.rightDrag(-250);
                    expect(mockScope.ngModel.inner.end)
                        .toEqual(DAY * 1000 + HOUR * 15);
                });

                it("updates both start and end for middle drags", function () {
                    mockScope.startMiddleDrag();
                    mockScope.middleDrag(-125);
                    expect(mockScope.ngModel.inner).toEqual({
                        start: DAY * 1000,
                        end: DAY * 1000 + HOUR * 18
                    });
                    mockScope.middleDrag(250);
                    expect(mockScope.ngModel.inner).toEqual({
                        start: DAY * 1000 + HOUR * 6,
                        end: DAY * 1001
                    });
                });

                it("enforces a minimum inner span", function () {
                    mockScope.startRightDrag();
                    mockScope.rightDrag(-9999999);
                    expect(mockScope.ngModel.inner.end)
                        .toBeGreaterThan(mockScope.ngModel.inner.start);
                });
            });

            describe("when outer bounds are changed", function () {
                beforeEach(function () {
                    mockScope.ngModel = {
                        outer: {
                            start: DAY * 1000,
                            end: DAY * 1001
                        },
                        inner: {
                            start: DAY * 1000 + HOUR * 3,
                            end: DAY * 1001 - HOUR * 3
                        }
                    };
                    mockScope.spanWidth = 1000;
                    fireWatch("spanWidth", mockScope.spanWidth);
                    fireWatchCollection("ngModel", mockScope.ngModel);
                });

                it("enforces a minimum outer span", function () {
                    mockScope.ngModel.outer.end =
                        mockScope.ngModel.outer.start - DAY * 100;
                    fireWatch(
                        "ngModel.outer.end",
                        mockScope.ngModel.outer.end
                    );
                    expect(mockScope.ngModel.outer.end)
                        .toBeGreaterThan(mockScope.ngModel.outer.start);

                    mockScope.ngModel.outer.start =
                        mockScope.ngModel.outer.end + DAY * 100;
                    fireWatch(
                        "ngModel.outer.start",
                        mockScope.ngModel.outer.start
                    );
                    expect(mockScope.ngModel.outer.end)
                        .toBeGreaterThan(mockScope.ngModel.outer.start);
                });

                it("enforces a minimum inner span when outer span changes", function () {
                    mockScope.ngModel.outer.end =
                        mockScope.ngModel.outer.start - DAY * 100;
                    fireWatch(
                        "ngModel.outer.end",
                        mockScope.ngModel.outer.end
                    );
                    expect(mockScope.ngModel.inner.end)
                        .toBeGreaterThan(mockScope.ngModel.inner.start);
                });

            });

            it("watches for changes in format selection", function () {
                expect(mockFormatService.getFormat)
                    .not.toHaveBeenCalledWith('test-format');
                fireWatch("parameters.format", 'test-format');
                expect(mockFormatService.getFormat)
                    .toHaveBeenCalledWith('test-format');
            });

            it("throws an error for unknown formats", function () {
                mockFormatService.getFormat.andReturn(undefined);
                expect(function () {
                    fireWatch("parameters.format", "some-format");
                }).toThrow();
            });

        });
    }
);
