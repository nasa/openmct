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
    [
        '../../src/controllers/TimelineTableController',
        '../../src/TimelineFormatter'
    ],
    function (TimelineTableController, TimelineFormatter) {
        "use strict";

        describe("The timeline table controller", function () {
            var formatter, controller;

            beforeEach(function () {
                controller = new TimelineTableController();
                formatter = new TimelineFormatter();
            });

            // This controller's job is just to expose the formatter
            // in scope, so simply verify that the two agree.
            it("formats durations", function () {
                [ 0, 100, 4123, 93600, 748801230012].forEach(function (n) {
                    expect(controller.niceTime(n))
                        .toEqual(formatter.format(n));
                });
            });


        });
    }
);
