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
    ["../../src/indicators/ClockIndicator"],
    function (ClockIndicator) {
        "use strict";

        // Wed, 03 Jun 2015 17:56:14 GMT
        var TEST_TIMESTAMP = 1433354174000,
            TEST_FORMAT = "YYYY-DDD HH:mm:ss";

        describe("The clock indicator", function () {
            var mockTicker,
                mockUnticker,
                indicator;

            beforeEach(function () {
                mockTicker = jasmine.createSpyObj('ticker', ['listen']);
                mockUnticker = jasmine.createSpy('unticker');

                mockTicker.listen.andReturn(mockUnticker);

                indicator = new ClockIndicator(mockTicker, TEST_FORMAT);
            });

            it("displays the current time", function () {
                mockTicker.listen.mostRecentCall.args[0](TEST_TIMESTAMP);
                expect(indicator.getText()).toEqual("2015-154 17:56:14 UTC");
            });

            it("implements the Indicator interface", function () {
                expect(indicator.getGlyph()).toEqual(jasmine.any(String));
                expect(indicator.getGlyphClass()).toEqual(jasmine.any(String));
                expect(indicator.getText()).toEqual(jasmine.any(String));
                expect(indicator.getDescription()).toEqual(jasmine.any(String));
            });

        });
    }
);
