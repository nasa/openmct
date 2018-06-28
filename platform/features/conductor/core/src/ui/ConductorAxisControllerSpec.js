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
    './ConductorAxisController',
    'zepto',
    'd3-selection',
    'd3-scale'
], function (
    ConductorAxisController,
    $,
    d3Selection,
    d3Scale
) {
    describe("The ConductorAxisController", function () {
        var controller,
            mockConductor,
            mockConductorViewService,
            mockFormatService,
            mockScope,
            mockElement,
            mockTarget,
            mockBounds,
            element,
            mockTimeSystem,
            mockFormat;

        function getCallback(target, name) {
            return target.calls.all().filter(function (call) {
                return call.args[0] === name;
            })[0].args[1];
        }

        beforeEach(function () {
            mockScope = jasmine.createSpyObj("scope", [
                "$on"
            ]);

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
                "on",
                "off",
                "clock"
            ]);
            mockConductor.bounds.and.returnValue(mockBounds);

            mockFormatService = jasmine.createSpyObj("formatService", [
                "getFormat"
            ]);

            mockConductorViewService = jasmine.createSpyObj("conductorViewService", [
                "on",
                "off",
                "emit"
            ]);

            spyOn(d3Scale, 'scaleUtc').and.callThrough();
            spyOn(d3Scale, 'scaleLinear').and.callThrough();

            element = $('<div style="width: 100px;"><div style="width: 100%;"></div></div>');
            $(document).find('body').append(element);
            ConductorAxisController.prototype.viewService = mockConductorViewService;
            controller = new ConductorAxisController({time: mockConductor}, mockFormatService, mockScope, element);

            mockTimeSystem = {};
            mockFormat = jasmine.createSpyObj("format", [
                "format"
            ]);

            mockTimeSystem.timeFormat = "mockFormat";
            mockFormatService.getFormat.and.returnValue(mockFormat);
            mockConductor.timeSystem.and.returnValue(mockTimeSystem);
            mockTimeSystem.isUTCBased = false;
        });

        it("listens for changes to time system and bounds", function () {
            expect(mockConductor.on).toHaveBeenCalledWith("timeSystem", controller.changeTimeSystem);
            expect(mockConductor.on).toHaveBeenCalledWith("bounds", controller.changeBounds);
        });

        it("on scope destruction, deregisters listeners", function () {
            expect(mockScope.$on).toHaveBeenCalledWith("$destroy", controller.destroy);
            controller.destroy();
            expect(mockConductor.off).toHaveBeenCalledWith("timeSystem", controller.changeTimeSystem);
            expect(mockConductor.off).toHaveBeenCalledWith("bounds", controller.changeBounds);
        });

        describe("when the time system changes", function () {
            it("uses a UTC scale for UTC time systems", function () {
                mockTimeSystem.isUTCBased = true;
                controller.changeTimeSystem(mockTimeSystem);

                expect(d3Scale.scaleUtc).toHaveBeenCalled();
                expect(d3Scale.scaleLinear).not.toHaveBeenCalled();
            });

            it("uses a linear scale for non-UTC time systems", function () {
                mockTimeSystem.isUTCBased = false;
                controller.changeTimeSystem(mockTimeSystem);
                expect(d3Scale.scaleLinear).toHaveBeenCalled();
                expect(d3Scale.scaleUtc).not.toHaveBeenCalled();
            });

            it("sets axis domain to time conductor bounds", function () {
                mockTimeSystem.isUTCBased = false;
                controller.setScale();
                expect(controller.xScale.domain()).toEqual([mockBounds.start, mockBounds.end]);
            });

            it("uses the format specified by the time system to format tick" +
                " labels", function () {
                controller.changeTimeSystem(mockTimeSystem);
                expect(mockFormat.format).toHaveBeenCalled();
            });

            it('responds to zoom events', function () {
                expect(mockConductorViewService.on).toHaveBeenCalledWith("zoom", controller.onZoom);
                var cb = getCallback(mockConductorViewService.on, "zoom");
                spyOn(controller, 'setScale').and.callThrough();
                cb({bounds: {start: 0, end: 100}});
                expect(controller.setScale).toHaveBeenCalled();
            });

            it('adjusts scale on pan', function () {
                spyOn(controller, 'setScale').and.callThrough();
                controller.pan(100);
                expect(controller.setScale).toHaveBeenCalled();
            });

            it('emits event on pan', function () {
                spyOn(controller, 'setScale').and.callThrough();
                controller.pan(100);
                expect(mockConductorViewService.emit).toHaveBeenCalledWith("pan", jasmine.any(Object));
            });

            it('cleans up listeners on destruction', function () {
                controller.destroy();
                expect(mockConductor.off).toHaveBeenCalledWith("bounds", controller.changeBounds);
                expect(mockConductor.off).toHaveBeenCalledWith("timeSystem", controller.changeTimeSystem);

                expect(mockConductorViewService.off).toHaveBeenCalledWith("zoom", controller.onZoom);
            });

        });
    });
});
