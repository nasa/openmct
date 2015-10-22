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
    ["../../src/services/UTCDateProvider", "moment"],
    function (UTCDateProvider, moment) {
        'use strict';

        describe("UTCDateProvider", function () {
            var testDate, testTimestamp, dateProvider;

            beforeEach(function () {
                testDate = "1977-05-25 17:30:00";
                testTimestamp = moment.utc(testDate).valueOf();
                dateProvider = new UTCDateProvider();
            });

            it("distinguishes valid dates from invalid dates", function () {
                expect(dateProvider.validate(testDate))
                    .toBeTruthy();
                expect(dateProvider.validate("2015-garbage :00:00"))
                    .toBeFalsy();
            });

            it("parses dates to their numeric representations", function () {
                expect(dateProvider.parse(testDate)).toEqual(testTimestamp);
            });

            it("formats to text representing UTC date/times", function () {
                var formatted = dateProvider.format(testTimestamp);
                expect(formatted).toEqual(jasmine.any(String));
                // Use moment to verify that formatted value is equal
                // to the original date/time
                expect(moment.utc(formatted).valueOf()).toEqual(testTimestamp);
            });

            it("does not handle defined keys", function () {
                expect(dateProvider.validate(testDate, 'someKey'))
                    .toBeFalsy();
                expect(dateProvider.format(testTimestamp, 'someKey'))
                    .toBeUndefined();
            });

        });
    }
);
