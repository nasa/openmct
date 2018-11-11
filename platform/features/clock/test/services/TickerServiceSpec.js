/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ["../../src/services/TickerService"],
    function (TickerService) {

        var TEST_TIMESTAMP = 1433354174000;

        describe("The ticker service", function () {
            var mockTimeout,
                mockNow,
                mockCallback,
                tickerService;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy('$timeout');
                mockNow = jasmine.createSpy('now');
                mockCallback = jasmine.createSpy('callback');

                mockNow.and.returnValue(TEST_TIMESTAMP);

                tickerService = new TickerService(mockTimeout, mockNow);
            });

            it("notifies listeners of clock ticks", function () {
                tickerService.listen(mockCallback);
                mockNow.and.returnValue(TEST_TIMESTAMP + 12321);
                mockTimeout.calls.mostRecent().args[0]();
                expect(mockCallback)
                    .toHaveBeenCalledWith(TEST_TIMESTAMP + 12321);
            });

            it("allows listeners to unregister", function () {
                tickerService.listen(mockCallback)(); // Unregister immediately
                mockNow.and.returnValue(TEST_TIMESTAMP + 12321);
                mockTimeout.calls.mostRecent().args[0]();
                expect(mockCallback).not
                    .toHaveBeenCalledWith(TEST_TIMESTAMP + 12321);
            });
        });
    }
);
