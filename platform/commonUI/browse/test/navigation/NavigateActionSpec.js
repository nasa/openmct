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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/navigation/NavigateAction"],
    function (NavigateAction) {
        "use strict";

        describe("The navigate action", function () {
            var mockNavigationService,
                mockQ,
                actionContext,
                mockDomainObject,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "setNavigation" ]
                );
                mockQ = { when: mockPromise };
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );

                action = new NavigateAction(
                    mockNavigationService,
                    mockQ,
                    { domainObject: mockDomainObject }
                );
            });

            it("invokes the navigate service when performed", function () {
                action.perform();
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("is only applicable when a domain object is in context", function () {
                expect(NavigateAction.appliesTo({})).toBeFalsy();
                expect(NavigateAction.appliesTo({
                    domainObject: mockDomainObject
                })).toBeTruthy();
            });

        });
    }
);