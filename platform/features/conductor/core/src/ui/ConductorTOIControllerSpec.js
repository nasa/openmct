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
    './ConductorTOIController'
], function (
    ConductorTOIController
) {
    var mockConductor;
    var mockConductorViewService;
    var mockScope;
    var mockAPI;
    var conductorTOIController;

    function getNamedCallback(thing, name) {
        return thing.calls.all().filter(function (call) {
            return call.args[0] === name;
        }).map(function (call) {
            return call.args;
        })[0][1];
    }

    describe("The ConductorTOIController", function () {
        beforeEach(function () {
            mockConductor = jasmine.createSpyObj("conductor", [
                "bounds",
                "timeOfInterest",
                "on",
                "off"
            ]);
            mockAPI = {time: mockConductor};

            mockConductorViewService = jasmine.createSpyObj("conductorViewService", [
                "on",
                "off"
            ]);

            mockScope = jasmine.createSpyObj("openMCT", [
                "$on"
            ]);
            ConductorTOIController.prototype.viewService = mockConductorViewService;
            conductorTOIController = new ConductorTOIController(mockScope, mockAPI);
        });

        it("listens to changes in the time of interest on the conductor", function () {
            expect(mockConductor.on).toHaveBeenCalledWith("timeOfInterest", jasmine.any(Function));
        });

        describe("when responding to changes in the time of interest", function () {
            var toiCallback;
            beforeEach(function () {
                var bounds = {
                    start: 0,
                    end: 200
                };
                mockConductor.bounds.and.returnValue(bounds);
                toiCallback = getNamedCallback(mockConductor.on, "timeOfInterest");
            });

            it("calculates the correct horizontal offset based on bounds and current TOI", function () {
                //Expect time of interest position to be 50% of element width
                mockConductor.timeOfInterest.and.returnValue(100);
                toiCallback();
                expect(conductorTOIController.left).toBe(50);

                //Expect time of interest position to be 25% of element width
                mockConductor.timeOfInterest.and.returnValue(50);
                toiCallback();
                expect(conductorTOIController.left).toBe(25);

                //Expect time of interest position to be 0% of element width
                mockConductor.timeOfInterest.and.returnValue(0);
                toiCallback();
                expect(conductorTOIController.left).toBe(0);

                //Expect time of interest position to be 100% of element width
                mockConductor.timeOfInterest.and.returnValue(200);
                toiCallback();
                expect(conductorTOIController.left).toBe(100);
            });

            it("renders the TOI indicator visible", function () {
                expect(conductorTOIController.pinned).toBeFalsy();
                mockConductor.timeOfInterest.and.returnValue(100);
                toiCallback();
                expect(conductorTOIController.pinned).toBe(true);
            });
        });

        it("responds to zoom events", function () {
            var mockZoom = {
                bounds: {
                    start: 500,
                    end: 1000
                }
            };
            expect(mockConductorViewService.on).toHaveBeenCalledWith("zoom", jasmine.any(Function));

            // Should correspond to horizontal offset of 50%
            mockConductor.timeOfInterest.and.returnValue(750);
            var zoomCallback = getNamedCallback(mockConductorViewService.on, "zoom");
            zoomCallback(mockZoom);
            expect(conductorTOIController.left).toBe(50);
        });

        it("responds to pan events", function () {
            var mockPanBounds = {
                start: 1000,
                end: 3000
            };

            expect(mockConductorViewService.on).toHaveBeenCalledWith("pan", jasmine.any(Function));

            // Should correspond to horizontal offset of 25%
            mockConductor.timeOfInterest.and.returnValue(1500);
            var panCallback = getNamedCallback(mockConductorViewService.on, "pan");
            panCallback(mockPanBounds);
            expect(conductorTOIController.left).toBe(25);
        });


        it("Cleans up all listeners when controller destroyed", function () {
            var zoomCB = getNamedCallback(mockConductorViewService.on, "zoom");
            var panCB = getNamedCallback(mockConductorViewService.on, "pan");
            var toiCB = getNamedCallback(mockConductor.on, "timeOfInterest");

            expect(mockScope.$on).toHaveBeenCalledWith("$destroy", jasmine.any(Function));
            getNamedCallback(mockScope.$on, "$destroy")();
            expect(mockConductorViewService.off).toHaveBeenCalledWith("zoom", zoomCB);
            expect(mockConductorViewService.off).toHaveBeenCalledWith("pan", panCB);
            expect(mockConductor.off).toHaveBeenCalledWith("timeOfInterest", toiCB);
        });
    });
});
