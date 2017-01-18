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
    ["../../src/actions/StopTimerAction"],
    function (StopTimerAction) {

        describe("A timer's stop action", function () {
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

            beforeEach(function () {
                mockNow = jasmine.createSpy('now');
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );

                mockDomainObject.useCapability.andCallFake(function (c, v) {
                    if (c === 'mutation') {
                        testModel = v(testModel) || testModel;
                        return asPromise(true);
                    }
                });
                mockDomainObject.getModel.andCallFake(function () {
                    return testModel;
                });

                testModel = {};
                testContext = {domainObject: mockDomainObject};

                action = new StopTimerAction(mockNow, testContext);
            });

            it("updates the model with a timestamp", function () {
                mockNow.andReturn(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
            });

            it("applies only to timers in a non-stopped state", function () {
                //in a stopped state
                testStates(testModel, 'timer', undefined, undefined, false);

                //in a paused state
                testStates(testModel, 'timer', 'pause', undefined, true);

                //in a playing state
                testStates(testModel, 'timer', 'play', undefined, true);

                //not a timer
                testStates(testModel, 'clock', 'pause', undefined, false);
            });

            function testStates(testModel, type, timerState, timestamp, expected) {
                testModel.type = type;
                testModel.timerState = timerState;
                testModel.timestamp = timestamp;

                if (expected) {
                    expect(StopTimerAction.appliesTo(testContext)).toBeTruthy()
                } else {
                    expect(StopTimerAction.appliesTo(testContext)).toBeFalsy()
                }

                //first test without time, this test with time
                if (timestamp === undefined) {
                    testStates(testModel, type, timerState, 12000, expected);
                }
            }
        });
    }
);
