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

define(['./MctConductorAxis'], function (MctConductorAxis) {
    describe("The MctConductorAxis directive", function () {
        var directive,
            mockConductor,
            mockFormatService,
            mockScope,
            mockElement,
            mockTarget,
            mockBounds,
            d3;

        beforeEach(function () {
            mockScope = {};

            //Add some HTML elements
            mockTarget = {
                offsetWidth: 0,
                offsetHeight: 0
            };
            mockElement = {
                firstChild: mockTarget
            };
            mockBounds = {
                start: 100,
                end: 200
            };
            mockConductor = jasmine.createSpyObj("conductor", [
                "timeSystem",
                "bounds",
                "on"
            ]);
            mockConductor.bounds.andReturn(mockBounds);

            mockFormatService = jasmine.createSpyObj("formatService", [
                "getFormat"
            ]);

            var d3Functions = [
                "scale",
                "scaleUtc",
                "scaleLinear",
                "select",
                "append",
                "attr",
                "axisTop",
                "call",
                "tickFormat",
                "domain",
                "range"
            ];
            d3 = jasmine.createSpyObj("d3", d3Functions);
            d3Functions.forEach(function (func) {
                d3[func].andReturn(d3);
            });

            directive = new MctConductorAxis(mockConductor, mockFormatService);
            directive.d3 = d3;
            directive.link(mockScope, [mockElement]);
        });

        it("listens for changes to time system and bounds", function () {
            expect(mockConductor.on).toHaveBeenCalledWith("timeSystem", directive.changeTimeSystem);
            expect(mockConductor.on).toHaveBeenCalledWith("bounds", directive.setScale);
        });

        describe("when the time system changes", function () {
            var mockTimeSystem;
            var mockFormat;

            beforeEach(function () {
                mockTimeSystem = jasmine.createSpyObj("timeSystem", [
                    "formats",
                    "isUTCBased"
                ]);
                mockFormat = jasmine.createSpyObj("format", [
                    "format"
                ]);

                mockTimeSystem.formats.andReturn(["mockFormat"]);
                mockFormatService.getFormat.andReturn(mockFormat);
            });

            it("uses a UTC scale for UTC time systems", function () {
                mockTimeSystem.isUTCBased.andReturn(true);
                directive.changeTimeSystem(mockTimeSystem);
                expect(d3.scaleUtc).toHaveBeenCalled();
                expect(d3.scaleLinear).not.toHaveBeenCalled();
            });

            it("uses a linear scale for non-UTC time systems", function () {
                mockTimeSystem.isUTCBased.andReturn(false);
                directive.changeTimeSystem(mockTimeSystem);
                expect(d3.scaleLinear).toHaveBeenCalled();
                expect(d3.scaleUtc).not.toHaveBeenCalled();
            });

            it("sets axis domain to time conductor bounds", function () {
                mockTimeSystem.isUTCBased.andReturn(false);
                mockConductor.timeSystem.andReturn(mockTimeSystem);

                directive.setScale();
                expect(d3.domain).toHaveBeenCalledWith([mockBounds.start, mockBounds.end]);
            });

            it("uses the format specified by the time system to format tick" +
                " labels", function () {
                directive.changeTimeSystem(mockTimeSystem);
                expect(d3.tickFormat).toHaveBeenCalled();
                d3.tickFormat.mostRecentCall.args[0]();
                expect(mockFormat.format).toHaveBeenCalled();
            });
        });
    });
});
