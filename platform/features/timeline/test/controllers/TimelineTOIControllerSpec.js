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

define([
    "../../src/controllers/TimelineTOIController",
    "EventEmitter"
], function (TimelineTOIController, EventEmitter) {
    describe("The timeline TOI controller", function () {
        var mockmct;
        var mockTimerService;
        var mockScope;
        var controller;

        beforeEach(function () {
            mockmct = { time: new EventEmitter() };
            mockmct.time.bounds = jasmine.createSpy('bounds');
            mockTimerService = new EventEmitter();
            mockTimerService.getTimer = jasmine.createSpy('getTimer');
            mockTimerService.hasTimer = jasmine.createSpy('hasTimer');
            mockTimerService.now = jasmine.createSpy('now');
            mockTimerService.convert = jasmine.createSpy('convert');
            mockScope = new EventEmitter();
            mockScope.$on = mockScope.on.bind(mockScope);
            mockScope.zoomController = jasmine.createSpyObj('zoom', [
                'bounds',
                'toPixels'
            ]);
            mockScope.scroll = { x: 10, width: 1000 };

            spyOn(mockmct.time, "on").andCallThrough();
            spyOn(mockmct.time, "off").andCallThrough();
            spyOn(mockTimerService, "on").andCallThrough();
            spyOn(mockTimerService, "off").andCallThrough();

            controller = new TimelineTOIController(
                mockmct,
                mockTimerService,
                mockScope
            );
        });

        it("reports an undefined x position initially", function () {
            expect(controller.x()).toBeUndefined();
        });

        it("listens for bounds changes", function () {
            expect(mockmct.time.on)
                .toHaveBeenCalledWith('bounds', controller.bounds);
        });

        it("listens for timer changes", function () {
            expect(mockTimerService.on)
                .toHaveBeenCalledWith('change', controller.change);
        });

        it("is not active", function () {
            expect(controller.isActive()).toBe(false);
        });

        describe("on $destroy from scope", function () {
            beforeEach(function () {
                mockScope.emit("$destroy");
            });

            it("unregisters listeners", function () {
                expect(mockmct.time.off)
                    .toHaveBeenCalledWith('bounds', controller.bounds);
                expect(mockTimerService.off)
                    .toHaveBeenCalledWith('change', controller.change);
            });
        });

        describe("when a timer and timestamp present", function () {
            var mockTimer;
            var testNow;

            beforeEach(function () {
                testNow = 333221;
                mockScope.zoomController.toPixels
                    .andCallFake(function (millis) {
                        return millis * 2;
                    });
                mockTimerService.emit('change', mockTimer);
                mockTimerService.now.andReturn(testNow);
            });

            it("reports an x value from the zoomController", function () {
                var now = mockTimerService.now();
                var expected = mockScope.zoomController.toPixels(now);
                expect(controller.x()).toEqual(expected);
            });
        });

        describe("when follow mode is disabled", function () {
            beforeEach(function () {
                mockScope.scroll.follow = false;
            });

            it("ignores bounds events", function () {
                mockmct.time.emit('bounds', { start: 0, end: 1000 });
                expect(mockScope.zoomController.bounds)
                    .not.toHaveBeenCalled();
            });
        });

        describe("when follow mode is enabled", function () {
            beforeEach(function () {
                mockScope.scroll.follow = true;
                mockTimerService.now.andReturn(500);
            });

            it("zooms on bounds events", function () {
                mockmct.time.emit('bounds', { start: 0, end: 1000 });
                expect(mockScope.zoomController.bounds)
                    .toHaveBeenCalled();
            });
        });
    });
});
