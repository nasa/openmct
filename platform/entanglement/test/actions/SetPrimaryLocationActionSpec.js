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

/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/actions/SetPrimaryLocationAction',
        '../DomainObjectFactory'
    ],
    function (SetPrimaryLocation, domainObjectFactory) {
        'use strict';

        describe("The 'set primary location' action", function () {
            var testContext,
                testModel,
                testId,
                mockLocationCapability,
                mockContextCapability;

            beforeEach(function () {
                testId = "some-id";
                testModel = { name: "some name" };

                mockLocationCapability = jasmine.createSpyObj(
                    'location',
                    [ 'setPrimaryLocation', 'getContextualLocation' ]
                );

                mockLocationCapability.getContextualLocation.andReturn(testId);

                testContext = {
                    domainObject: domainObjectFactory({
                        capabilities: {
                            location: mockLocationCapability
                        },
                        model: testModel
                    })
                };
            });

            it("is applicable to objects with no location specified", function () {
                expect(SetPrimaryLocation.appliesTo(testContext))
                    .toBe(true);
                testContext.domainObject.getModel.andReturn({
                    location: "something",
                    name: "some name"
                });
                expect(SetPrimaryLocation.appliesTo(testContext))
                    .toBe(false);
            });

            it("sets the location contextually when performed", function () {
                new SetPrimaryLocation(testContext).perform();
                expect(mockLocationCapability.setPrimaryLocation)
                    .toHaveBeenCalledWith(testId);
            });

        });
    }
);
