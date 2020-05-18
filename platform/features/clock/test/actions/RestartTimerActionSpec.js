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
    ["../../src/actions/RestartTimerAction"],
    function (RestartTimerAction) {

        describe("A timer's restart action", function () {
            var mockNow,
                mockDomainObject,
                testModel,
                testContext,
                action;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function testState(type, timerState, timestamp, expected) {
                testModel.type = type;
                testModel.timerState = timerState;
                testModel.timestamp = timestamp;

                if (expected) {
                    expect(RestartTimerAction.appliesTo(testContext)).toBeTruthy();
                } else {
                    expect(RestartTimerAction.appliesTo(testContext)).toBeFalsy();
                }
            }

            beforeEach(function () {
                mockNow = jasmine.createSpy('now');
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );

                mockDomainObject.useCapability.and.callFake(function (c, v) {
                    if (c === 'mutation') {
                        testModel = v(testModel) || testModel;

                        return asPromise(true);
                    }
                });
                mockDomainObject.getModel.and.callFake(function () {
                    return testModel;
                });

                testModel = {};
                testContext = { domainObject: mockDomainObject };

                action = new RestartTimerAction(mockNow, testContext);
            });

            it("updates the model with a timestamp", function () {
                testModel.pausedTime = 12000;
                mockNow.and.returnValue(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
            });

            it("updates the model with a pausedTime", function () {
                testModel.pausedTime = 12000;
                action.perform();
                expect(testModel.pausedTime).toEqual(undefined);
            });

            it("updates the model with a timerState", function () {
                testModel.timerState = 'stopped';
                action.perform();
                expect(testModel.timerState).toEqual('started');
            });

            it("applies only to timers in a non-stopped state", function () {
                //in a stopped state
                testState('timer', 'stopped', undefined, false);

                //in a paused state
                testState('timer', 'paused', 12000, true);

                //in a playing state
                testState('timer', 'started', 12000, true);

                //not a timer
                testState('clock', 'paused', 12000, false);
            });
        });
    }
);
