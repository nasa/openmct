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
    ['../../src/capabilities/CostCapability'],
    function (CostCapability) {
        'use strict';

        describe("A subsystem mode's cost capability", function () {
            var testModel,
                capability;

            beforeEach(function () {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getModel', 'getId' ]
                );

                testModel = {
                    resources: {
                        abc: -1,
                        power: 12321,
                        comms: 42
                    }
                };

                mockDomainObject.getModel.andReturn(testModel);

                capability = new CostCapability(mockDomainObject);
            });

            it("provides a list of resource types", function () {
                expect(capability.resources())
                    .toEqual(['abc', 'comms', 'power']);
            });

            it("provides resource costs", function () {
                expect(capability.cost('abc')).toEqual(-1);
                expect(capability.cost('power')).toEqual(12321);
                expect(capability.cost('comms')).toEqual(42);
            });

            it("provides all resources in a group", function () {
                expect(capability.invoke()).toEqual(testModel.resources);
            });

            it("applies to subsystem modes", function () {
                expect(CostCapability.appliesTo({
                    type: "mode"
                })).toBeTruthy();
                expect(CostCapability.appliesTo({
                    type: "activity"
                })).toBeFalsy();
                expect(CostCapability.appliesTo({
                    type: "other"
                })).toBeFalsy();
            });

        });
    }
);
