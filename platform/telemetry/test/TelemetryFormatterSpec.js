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
    ["../src/TelemetryFormatter"],
    function (TelemetryFormatter) {
        "use strict";

        describe("The telemetry formatter", function () {
            var mockFormatService,
                mockFormat,
                formatter;

            beforeEach(function () {
                mockFormatService =
                    jasmine.createSpyObj("formatService", ["getFormat"]);
                mockFormat = jasmine.createSpyObj("format", [
                    "validate",
                    "parse",
                    "format"
                ]);
                mockFormatService.getFormat.andReturn(mockFormat);
                formatter = new TelemetryFormatter(mockFormatService);
            });

            it("formats domains using the formatService", function () {
                var testValue = 12321, testResult = "some result";
                mockFormat.format.andReturn(testResult);

                expect(formatter.formatDomainValue(testValue))
                    .toEqual(testResult);
                expect(mockFormat.format).toHaveBeenCalledWith(testValue);
            });

            it("passes format keys to the formatService", function () {
                formatter.formatDomainValue(12321, "someKey");
                expect(mockFormatService.getFormat)
                    .toHaveBeenCalledWith("someKey");
            });

            it("formats ranges as values", function () {
                var value = 3.14159265352979323846264338, // not pi
                    formatted = formatter.formatRangeValue(value);
                // Make sure we don't lose information by formatting
                expect(parseFloat(formatted)).toEqual(value);
            });
        });
    }
);
