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
    ["../../src/controllers/TimerController"],
    function (TimerController) {

        // Wed, 03 Jun 2015 17:56:14 GMT
        var TEST_TIMESTAMP = 1433354174000;

        describe("A timer view's controller", function () {
            var mockScope,
                mockWindow,
                mockNow,
                mockDomainObject,
                mockActionCapability,
                mockStart,
                mockPause,
                mockStop,
                testModel,
                controller;

            function invokeWatch(expr, value) {
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === expr) {
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
                    ['getCapability', 'useCapability', 'getModel']
                );
                mockActionCapability = jasmine.createSpyObj(
                    'action',
                    ['getActions']
                );
                mockStart = jasmine.createSpyObj(
                    'start',
                    ['getMetadata', 'perform']
                );
                mockPause = jasmine.createSpyObj(
                    'paused',
                    ['getMetadata', 'perform']
                );
                mockStop = jasmine.createSpyObj(
                    'stopped',
                    ['getMetadata', 'perform']
                );
                mockNow = jasmine.createSpy('now');

                mockDomainObject.getCapability.and.callFake(function (c) {
                    return (c === 'action') && mockActionCapability;
                });
                mockDomainObject.getModel.and.callFake(function () {
                    return testModel;
                });
                mockActionCapability.getActions.and.callFake(function (k) {
                    return [{
                        'timer.start': mockStart,
                        'timer.pause': mockPause,
                        'timer.stop': mockStop
                    }[k]];
                });

                mockStart.getMetadata.and.returnValue({
                    cssClass: "icon-play",
                    name: "Start"
                });
                mockPause.getMetadata.and.returnValue({
                    cssClass: "icon-pause",
                    name: "Pause"
                });
                mockStop.getMetadata.and.returnValue({
                    cssClass: "icon-box",
                    name: "Stop"
                });
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
                mockNow.and.returnValue(TEST_TIMESTAMP);
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(controller.sign()).toEqual("");
                expect(controller.signClass()).toEqual("");
                expect(controller.text()).toEqual("");
            });

            it("formats time to display relative to target", function () {
                testModel.timestamp = TEST_TIMESTAMP;
                testModel.timerFormat = 'long';
                // Notify that domain object is available via scope
                invokeWatch('domainObject', mockDomainObject);

                mockNow.and.returnValue(TEST_TIMESTAMP + 121000);
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(controller.sign()).toEqual("+");
                expect(controller.signClass()).toEqual("icon-plus");
                expect(controller.text()).toEqual("0D 00:02:01");

                mockNow.and.returnValue(TEST_TIMESTAMP - 121000);
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(controller.sign()).toEqual("-");
                expect(controller.signClass()).toEqual("icon-minus");
                expect(controller.text()).toEqual("0D 00:02:01");

                mockNow.and.returnValue(TEST_TIMESTAMP);
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(controller.sign()).toEqual("");
                expect(controller.signClass()).toEqual("");
                expect(controller.text()).toEqual("0D 00:00:00");
            });

            it("shows cssClass & name for the applicable start/pause action", function () {
                invokeWatch('domainObject', mockDomainObject);
                expect(controller.buttonCssClass()).toEqual("icon-play");
                expect(controller.buttonText()).toEqual("Start");

                testModel.timestamp = 12321;
                testModel.timerState = 'started';
                invokeWatch('model.modified', 1);
                expect(controller.buttonCssClass()).toEqual("icon-pause");
                expect(controller.buttonText()).toEqual("Pause");
            });

            it("performs correct start/pause/stop action on click", function () {
                //test start
                invokeWatch('domainObject', mockDomainObject);
                expect(mockStart.perform).not.toHaveBeenCalled();
                controller.clickButton();
                expect(mockStart.perform).toHaveBeenCalled();

                //test pause
                testModel.timestamp = 12321;
                testModel.timerState = 'started';
                invokeWatch('model.modified', 1);
                expect(mockPause.perform).not.toHaveBeenCalled();
                controller.clickButton();
                expect(mockPause.perform).toHaveBeenCalled();

                //test stop
                expect(mockStop.perform).not.toHaveBeenCalled();
                controller.clickStopButton();
                expect(mockStop.perform).toHaveBeenCalled();
            });

            it("stops requesting animation frames when destroyed", function () {
                var initialCount = mockWindow.requestAnimationFrame.calls.count();

                // First, check that normally new frames keep getting requested
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(mockWindow.requestAnimationFrame.calls.count())
                    .toEqual(initialCount + 1);
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(mockWindow.requestAnimationFrame.calls.count())
                    .toEqual(initialCount + 2);

                // Now, verify that it stops after $destroy
                expect(mockScope.$on.calls.mostRecent().args[0])
                    .toEqual('$destroy');
                mockScope.$on.calls.mostRecent().args[1]();

                // Frames should no longer get requested
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(mockWindow.requestAnimationFrame.calls.count())
                    .toEqual(initialCount + 2);
                mockWindow.requestAnimationFrame.calls.mostRecent().args[0]();
                expect(mockWindow.requestAnimationFrame.calls.count())
                    .toEqual(initialCount + 2);
            });
        });
    }
);
