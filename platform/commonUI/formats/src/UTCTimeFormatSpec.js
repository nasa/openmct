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

define([
    "./UTCTimeFormat",
    "moment"
], function (
    UTCTimeFormat,
    moment
) {
    describe("The UTCTimeFormat class", function () {
        var format;
        var scale;

        beforeEach(function () {
            format = new UTCTimeFormat();
            scale = {min: 0, max: 0};
        });

        it("Provides an appropriately scaled time format based on the input" +
            " time", function () {
            var TWO_HUNDRED_MS = 200;
            var THREE_SECONDS = 3000;
            var FIVE_MINUTES = 5 * 60 * 1000;
            var ONE_HOUR_TWENTY_MINS = (1 * 60 * 60 * 1000) + (20 * 60 * 1000);
            var TEN_HOURS = (10 * 60 * 60 * 1000);

            var JUNE_THIRD = moment.utc("2016-06-03", "YYYY-MM-DD");
            var APRIL = moment.utc("2016-04", "YYYY-MM");
            var TWENTY_SIXTEEN = moment.utc("2016", "YYYY");

            expect(format.format(TWO_HUNDRED_MS, scale)).toBe(".200");
            expect(format.format(THREE_SECONDS, scale)).toBe(":03");
            expect(format.format(FIVE_MINUTES, scale)).toBe("00:05");
            expect(format.format(ONE_HOUR_TWENTY_MINS, scale)).toBe("01:20");
            expect(format.format(TEN_HOURS, scale)).toBe("10");

            expect(format.format(JUNE_THIRD, scale)).toBe("Fri 03");
            expect(format.format(APRIL, scale)).toBe("April");
            expect(format.format(TWENTY_SIXTEEN, scale)).toBe("2016");
        });
    });
});
