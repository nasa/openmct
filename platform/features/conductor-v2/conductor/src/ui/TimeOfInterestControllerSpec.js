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

define(['./TimeOfInterestController'], function (TimeOfInterestController) {

    describe("The time of interest controller", function () {
        var controller;
        var mockScope;
        var mockConductor;
        var mockFormatService;
        var mockTimeSystem;
        var mockFormat;

        beforeEach(function () {
            mockConductor = jasmine.createSpyObj("conductor", [
                "on",
                "timeSystem"
            ]);
            mockScope = jasmine.createSpyObj("scope", [
                "$on"
            ]);

            mockFormat = jasmine.createSpyObj("format", [
                "format"
            ]);

            mockFormatService = jasmine.createSpyObj("formatService", [
                "getFormat"
            ]);

            mockFormatService.getFormat.andReturn(mockFormat);

            mockTimeSystem = {
                formats: function () {
                    return ["mockFormat"];
                }
            };

            controller = new TimeOfInterestController(mockScope, {conductor: mockConductor}, mockFormatService);
        });

        function getCallback(target, event) {
            return target.calls.filter(function (call) {
                return call.args[0] === event;
            })[0].args[1];
        }

        it("Listens for changes to TOI", function () {
            expect(mockConductor.on).toHaveBeenCalledWith("timeOfInterest", controller.changeTimeOfInterest);
        });

        it("updates format when time system changes", function () {
            expect(mockConductor.on).toHaveBeenCalledWith("timeSystem", controller.changeTimeSystem);
            getCallback(mockConductor.on, "timeSystem")(mockTimeSystem);
            expect(controller.format).toBe(mockFormat);
        });

        describe("When TOI changes", function () {
            var toi;
            var toiCallback;
            var formattedTOI;

            beforeEach(function () {
                var timeSystemCallback = getCallback(mockConductor.on, "timeSystem");
                toi = 1;
                mockConductor.timeSystem.andReturn(mockTimeSystem);

                //Set time system
                timeSystemCallback(mockTimeSystem);

                toiCallback = getCallback(mockConductor.on, "timeOfInterest");
                formattedTOI = "formatted TOI";

                mockFormatService.getFormat.andReturn("mockFormat");
                mockFormat.format.andReturn(formattedTOI);
            });
            it("Uses the time system formatter to produce TOI text", function () {
                toiCallback = getCallback(mockConductor.on, "timeOfInterest");
                //Set TOI
                toiCallback(toi);
                expect(mockFormat.format).toHaveBeenCalled();
            });
            it("Sets the time of interest text", function () {
                //Set TOI
                toiCallback(toi);
                expect(controller.toiText).toBe(formattedTOI);
            });
            it("Pins the time of interest", function () {
                //Set TOI
                toiCallback(toi);
                expect(mockScope.pinned).toBe(true);
            });
        });

    });
});
