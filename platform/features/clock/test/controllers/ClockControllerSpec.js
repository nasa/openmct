/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2017, United States Government
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
    ["../../src/controllers/ClockController"],
    function (ClockController) {

        // Wed, 03 Jun 2015 17:56:14 GMT
        var TEST_TIMESTAMP = 1433354174000;

        describe("A clock view's controller", function () {
            var mockScope,
                mockTicker,
                mockUnticker,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$watch', '$on']);
                mockTicker = jasmine.createSpyObj('ticker', ['listen']);
                mockUnticker = jasmine.createSpy('unticker');

                mockTicker.listen.and.returnValue(mockUnticker);

                controller = new ClockController(mockScope, mockTicker);
            });

            it("watches for model (clockFormat and timezone) from the domain object model", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "model",
                    jasmine.any(Function)
                );
            });

            it("subscribes to clock ticks", function () {
                expect(mockTicker.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("unsubscribes to ticks when destroyed", function () {
                // Make sure $destroy is being listened for...
                expect(mockScope.$on.calls.mostRecent().args[0]).toEqual('$destroy');
                expect(mockUnticker).not.toHaveBeenCalled();

                // ...and makes sure that its listener unsubscribes from ticker
                mockScope.$on.calls.mostRecent().args[1]();
                expect(mockUnticker).toHaveBeenCalled();
            });

            it("formats using the format string from the model", function () {
                mockTicker.listen.calls.mostRecent().args[0](TEST_TIMESTAMP);
                mockScope.$watch.calls.mostRecent().args[1]({
                    "clockFormat": [
                        "YYYY-DDD hh:mm:ss",
                        "clock24"
                    ],
                    "timezone": "Canada/Eastern"
                });

                expect(controller.zone()).toEqual("EDT");
                expect(controller.text()).toEqual("2015-154 13:56:14");
                expect(controller.ampm()).toEqual("");
            });

            it("formats 12-hour time", function () {
                mockTicker.listen.calls.mostRecent().args[0](TEST_TIMESTAMP);
                mockScope.$watch.calls.mostRecent().args[1]({
                    "clockFormat": [
                        "YYYY-DDD hh:mm:ss",
                        "clock12"
                    ],
                    "timezone": ""
                });

                expect(controller.zone()).toEqual("UTC");
                expect(controller.text()).toEqual("2015-154 05:56:14");
                expect(controller.ampm()).toEqual("PM");
            });

            it("does not throw exceptions when model is undefined", function () {
                mockTicker.listen.calls.mostRecent().args[0](TEST_TIMESTAMP);
                expect(function () {
                    mockScope.$watch.calls.mostRecent().args[1](undefined);
                }).not.toThrow();
            });

        });
    }
);
