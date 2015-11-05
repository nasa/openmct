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
    ['../../src/controllers/TimelineTickController', '../../src/TimelineFormatter'],
    function (TimelineTickController, TimelineFormatter) {
        'use strict';

        var BILLION = 1000000000,
            FORMATTER = new TimelineFormatter();

        describe("The timeline tick controller", function () {
            var mockToMillis,
                controller;

            function expectedTick(pixelValue) {
                return {
                    left: pixelValue,
                    text: FORMATTER.format(pixelValue * 2 + BILLION)
                };
            }

            beforeEach(function () {
                mockToMillis = jasmine.createSpy('toMillis');
                mockToMillis.andCallFake(function (v) {
                    return v * 2 + BILLION;
                });
                controller = new TimelineTickController();
            });

            it("exposes tick marks within a requested pixel span", function () {
                // Simple case
                expect(controller.labels(8000, 300, 100, mockToMillis))
                    .toEqual([8000, 8100, 8200, 8300].map(expectedTick));

                // Slightly more complicated case
                expect(controller.labels(7480, 4500, 1000, mockToMillis))
                    .toEqual([7000, 8000, 9000, 10000, 11000, 12000].map(expectedTick));
            });

            it("does not rebuild arrays for same inputs", function () {
                var firstValue = controller.labels(800, 300, 100, mockToMillis);

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .toEqual(firstValue);

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .toBe(firstValue);
            });

            it("does rebuild arrays when zoom changes", function () {
                var firstValue = controller.labels(800, 300, 100, mockToMillis);

                mockToMillis.andCallFake(function (v) {
                    return BILLION * 2 + v;
                });

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .not.toEqual(firstValue);

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .not.toBe(firstValue);
            });

        });

    }
);