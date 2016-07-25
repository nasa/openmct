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
    ["../../src/actions/AbstractStartTimerAction"],
    function (AbstractStartTimerAction) {

        describe("A timer's start/restart action", function () {
            var mockNow,
                mockDomainObject,
                testModel,
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
                    ['getCapability', 'useCapability']
                );

                mockDomainObject.useCapability.andCallFake(function (c, v) {
                    if (c === 'mutation') {
                        testModel = v(testModel) || testModel;
                        return asPromise(true);
                    }
                });

                testModel = {};

                action = new AbstractStartTimerAction(mockNow, {
                    domainObject: mockDomainObject
                });
            });

            it("updates the model with a timestamp", function () {
                mockNow.andReturn(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
            });

            it("does not truncate milliseconds", function () {
                mockNow.andReturn(42321);
                action.perform();
                expect(testModel.timestamp).toEqual(42321);
            });
        });
    }
);
