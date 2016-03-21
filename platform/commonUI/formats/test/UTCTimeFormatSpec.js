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
    ['../src/UTCTimeFormat', 'moment'],
    function (UTCTimeFormat, moment) {
        'use strict';

        describe("The UTCTimeFormat", function () {
            var format;

            beforeEach(function () {
                format = new UTCTimeFormat();
            });

            it("formats UTC timestamps", function () {
                var timestamp = 12345670000,
                    formatted = format.format(timestamp);
                expect(formatted).toEqual(jasmine.any(String));
                expect(moment.utc(formatted).valueOf()).toEqual(timestamp);
            });

            it("displays with millisecond precision", function () {
                var timestamp = 12345670789,
                    formatted = format.format(timestamp);
                expect(moment.utc(formatted).valueOf()).toEqual(timestamp);
            });

            it("validates time inputs", function () {
                expect(format.validate("1977-05-25 11:21:22")).toBe(true);
                expect(format.validate("garbage text")).toBe(false);
            });

            it("parses valid input", function () {
                var text = "1977-05-25 11:21:22",
                    parsed = format.parse(text);
                expect(parsed).toEqual(jasmine.any(Number));
                expect(parsed).toEqual(moment.utc(text).valueOf());
            });
        });
    }
);
