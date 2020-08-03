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
    "../../src/actions/FollowTimerAction"
], function (FollowTimerAction) {
    var TIMER_SERVICE_METHODS =
        ['setTimer', 'getTimer', 'clearTimer', 'on', 'off'];

    describe("The Follow Timer action", function () {
        var testContext;
        var testModel;
        var testAdaptedObject;

        beforeEach(function () {
            testModel = {};
            testContext = {
                domainObject: jasmine.createSpyObj('domainObject', [
                    'getModel',
                    'useCapability'
                ])
            };
            testAdaptedObject = { foo: 'bar' };
            testContext.domainObject.getModel.and.returnValue(testModel);
            testContext.domainObject.useCapability.and.callFake(function (c) {
                return c === 'adapter' && testAdaptedObject;
            });
        });

        it("is applicable to timers", function () {
            testModel.type = "timer";
            expect(FollowTimerAction.appliesTo(testContext)).toBe(true);
        });

        it("is inapplicable to non-timers", function () {
            testModel.type = "folder";
            expect(FollowTimerAction.appliesTo(testContext)).toBe(false);
        });

        describe("when instantiated", function () {
            var mockTimerService;
            var action;

            beforeEach(function () {
                mockTimerService = jasmine.createSpyObj(
                    'timerService',
                    TIMER_SERVICE_METHODS
                );
                action = new FollowTimerAction(mockTimerService, testContext);
            });

            it("does not interact with the timer service", function () {
                TIMER_SERVICE_METHODS.forEach(function (method) {
                    expect(mockTimerService[method]).not.toHaveBeenCalled();
                });
            });

            describe("and performed", function () {
                beforeEach(function () {
                    action.perform();
                });

                it("sets the active timer", function () {
                    expect(mockTimerService.setTimer)
                        .toHaveBeenCalledWith(testAdaptedObject);
                });
            });
        });
    });
});
