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
        '../../src/actions/GoToOriginalAction',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    function (GoToOriginalAction, domainObjectFactory, ControlledPromise) {
        'use strict';

        describe("The 'go to original' action", function () {
            var testContext,
                originalDomainObject,
                mockLocationCapability,
                mockOriginalActionCapability,
                originalPromise,
                action;

            beforeEach(function () {
                mockLocationCapability = jasmine.createSpyObj(
                    'location',
                    [ 'isLink', 'isOriginal', 'getOriginal' ]
                );
                mockOriginalActionCapability = jasmine.createSpyObj(
                    'action',
                    [ 'perform', 'getActions' ]
                );
                originalPromise = new ControlledPromise();
                mockLocationCapability.getOriginal.andReturn(originalPromise);
                mockLocationCapability.isLink.andReturn(true);
                mockLocationCapability.isOriginal.andCallFake(function () {
                    return !mockLocationCapability.isLink();
                });
                testContext = {
                    domainObject: domainObjectFactory({
                        capabilities: {
                            location: mockLocationCapability
                        }
                    })
                };
                originalDomainObject = domainObjectFactory({
                    capabilities: {
                        action: mockOriginalActionCapability
                    }
                });

                action = new GoToOriginalAction(testContext);
            });

            it("is applicable to links", function () {
                expect(GoToOriginalAction.appliesTo(testContext))
                    .toBeTruthy();
            });

            it("is not applicable to originals", function () {
                mockLocationCapability.isLink.andReturn(false);
                expect(GoToOriginalAction.appliesTo(testContext))
                    .toBeFalsy();
            });

            it("navigates to original objects when performed", function () {
                expect(mockOriginalActionCapability.perform)
                    .not.toHaveBeenCalled();
                action.perform();
                originalPromise.resolve(originalDomainObject);
                expect(mockOriginalActionCapability.perform)
                    .toHaveBeenCalledWith('navigate');
            });

        });
    }
);
