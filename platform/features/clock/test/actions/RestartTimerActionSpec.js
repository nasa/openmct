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
    ["../../src/actions/RestartTimerAction"],
    function (RestartTimerAction) {
        "use strict";

        describe("A timer's restart action", function () {
            var mockNow,
                mockDomainObject,
                mockPersistence,
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
                    [ 'getCapability', 'useCapability', 'getModel' ]
                );
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist']
                );

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });
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
                testContext = { domainObject: mockDomainObject };

                action = new RestartTimerAction(mockNow, testContext);
            });

            it("updates the model with a timestamp and persists", function () {
                mockNow.andReturn(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("applies only to timers with a target time", function () {
                testModel.type = 'timer';
                testModel.timestamp = 12000;
                expect(RestartTimerAction.appliesTo(testContext)).toBeTruthy();

                testModel.type = 'timer';
                testModel.timestamp = undefined;
                expect(RestartTimerAction.appliesTo(testContext)).toBeFalsy();

                testModel.type = 'clock';
                testModel.timestamp = 12000;
                expect(RestartTimerAction.appliesTo(testContext)).toBeFalsy();
            });
        });
    }
);
