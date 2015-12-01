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
    ["../../src/controllers/TimerController"],
    function (TimerController) {
        "use strict";

        // Wed, 03 Jun 2015 17:56:14 GMT
        var TEST_TIMESTAMP = 1433354174000;

        describe("A timer view's controller", function () {
            var mockScope,
                mockWindow,
                mockNow,
                mockDomainObject,
                mockActionCapability,
                mockStart,
                mockRestart,
                testModel,
                controller;

            function invokeWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] ===  expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    ['$watch', '$on', '$apply']
                );
                mockWindow = jasmine.createSpyObj(
                    '$window',
                    ['requestAnimationFrame']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getCapability', 'useCapability', 'getModel' ]
                );
                mockActionCapability = jasmine.createSpyObj(
                    'action',
                    ['getActions']
                );
                mockStart = jasmine.createSpyObj(
                    'start',
                    ['getMetadata', 'perform']
                );
                mockRestart = jasmine.createSpyObj(
                    'restart',
                    ['getMetadata', 'perform']
                );
                mockNow = jasmine.createSpy('now');

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'action') && mockActionCapability;
                });
                mockDomainObject.getModel.andCallFake(function () {
                    return testModel;
                });
                mockActionCapability.getActions.andCallFake(function (k) {
                    return [{
                        'timer.start': mockStart,
                        'timer.restart': mockRestart
                    }[k]];
                });
                mockStart.getMetadata.andReturn({ glyph: "S", name: "Start" });
                mockRestart.getMetadata.andReturn({ glyph: "R", name: "Restart" });
                mockScope.domainObject = mockDomainObject;

                testModel = {};

                controller = new TimerController(mockScope, mockWindow, mockNow);
            });

            it("watches for the domain object in view", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("watches for domain object modifications", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "model.modified",
                    jasmine.any(Function)
                );
            });

            it("updates on a timer", function () {
                expect(mockWindow.requestAnimationFrame)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("displays nothing when there is no target", function () {
                // Notify that domain object is available via scope
                invokeWatch('domainObject', mockDomainObject);
                mockNow.andReturn(TEST_TIMESTAMP);
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(controller.sign()).toEqual("");
                expect(controller.text()).toEqual("");
            });

            it("formats time to display relative to target", function () {
                testModel.timestamp = TEST_TIMESTAMP;
                testModel.timerFormat = 'long';
                // Notify that domain object is available via scope
                invokeWatch('domainObject', mockDomainObject);

                mockNow.andReturn(TEST_TIMESTAMP + 121000);
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(controller.sign()).toEqual("+");
                expect(controller.text()).toEqual("0D 00:02:01");

                mockNow.andReturn(TEST_TIMESTAMP - 121000);
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(controller.sign()).toEqual("-");
                expect(controller.text()).toEqual("0D 00:02:01");

                mockNow.andReturn(TEST_TIMESTAMP);
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(controller.sign()).toEqual("");
                expect(controller.text()).toEqual("0D 00:00:00");
            });

            it("shows glyph & name for the applicable start/restart action", function () {
                invokeWatch('domainObject', mockDomainObject);
                expect(controller.buttonGlyph()).toEqual("S");
                expect(controller.buttonText()).toEqual("Start");

                testModel.timestamp = 12321;
                invokeWatch('model.modified', 1);
                expect(controller.buttonGlyph()).toEqual("R");
                expect(controller.buttonText()).toEqual("Restart");
            });

            it("performs correct start/restart action on click", function () {
                invokeWatch('domainObject', mockDomainObject);
                expect(mockStart.perform).not.toHaveBeenCalled();
                controller.clickButton();
                expect(mockStart.perform).toHaveBeenCalled();

                testModel.timestamp = 12321;
                invokeWatch('model.modified', 1);
                expect(mockRestart.perform).not.toHaveBeenCalled();
                controller.clickButton();
                expect(mockRestart.perform).toHaveBeenCalled();
            });

            it("stops requesting animation frames when destroyed", function () {
                var initialCount = mockWindow.requestAnimationFrame.calls.length;

                // First, check that normally new frames keep getting requested
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(mockWindow.requestAnimationFrame.calls.length)
                    .toEqual(initialCount + 1);
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(mockWindow.requestAnimationFrame.calls.length)
                    .toEqual(initialCount + 2);

                // Now, verify that it stops after $destroy
                expect(mockScope.$on.mostRecentCall.args[0])
                    .toEqual('$destroy');
                mockScope.$on.mostRecentCall.args[1]();

                // Frames should no longer get requested
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(mockWindow.requestAnimationFrame.calls.length)
                    .toEqual(initialCount + 2);
                mockWindow.requestAnimationFrame.mostRecentCall.args[0]();
                expect(mockWindow.requestAnimationFrame.calls.length)
                    .toEqual(initialCount + 2);
            });
        });
    }
);
