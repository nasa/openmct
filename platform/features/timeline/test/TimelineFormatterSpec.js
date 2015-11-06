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
    ['../src/TimelineFormatter'],
    function (TimelineFormatter) {
        'use strict';

        var SECOND = 1000,
            MINUTE = SECOND * 60,
            HOUR = MINUTE * 60,
            DAY = HOUR * 24;

        describe("The timeline formatter", function () {
            var formatter;

            beforeEach(function () {
                formatter = new TimelineFormatter();
            });

            it("formats durations with seconds", function () {
                expect(formatter.format(SECOND)).toEqual("000 00:00:01.000");
            });

            it("formats durations with milliseconds", function () {
                expect(formatter.format(SECOND + 42)).toEqual("000 00:00:01.042");
            });

            it("formats durations with days", function () {
                expect(formatter.format(3 * DAY + SECOND)).toEqual("003 00:00:01.000");
            });

            it("formats durations with hours", function () {
                expect(formatter.format(DAY + HOUR * 11 + SECOND)).toEqual("001 11:00:01.000");
            });

            it("formats durations with minutes", function () {
                expect(formatter.format(HOUR + MINUTE * 21)).toEqual("000 01:21:00.000");
            });
        });
    }
);