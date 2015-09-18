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

define(
    ["../src/MobileBrowseTreeController"],
    function (MobileBrowseTreeController) {
        'use strict';

        describe("The mobile variant of the BrowseTreeController", function () {
            var mockScope,
                mockNavigationService,
                mockAgentService,
                mockDomainObjects,
                controller;

            // We want to reinstantiate for each test case
            // because device state can influence constructor-time behavior
            function instantiateController() {
                return new MobileBrowseTreeController(
                    mockScope,
                    mockNavigationService,
                    mockAgentService
                );
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", [ "$on" ]);
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "getNavigation", "addListener", "removeListener" ]
                );
                mockDomainObjects = ['a', 'b'].map(function (id) {
                    var mockDomainObject = jasmine.createSpyObj(
                        'domainObject-' + id,
                        [ 'getId', 'getModel', 'getCapability' ]
                    );

                    mockDomainObject.getId.andReturn(id);
                    mockDomainObject.getModel.andReturn({});

                    return mockDomainObject;
                });
                mockAgentService = jasmine.createSpyObj(
                    "agentService",
                    [ "isMobile", "isPhone", "isTablet", "isPortrait", "isLandscape" ]
                );

                mockNavigationService.getNavigation.andReturn(mockDomainObjects[0]);
            });

            it("is initially visible", function () {
                expect(instantiateController().visible()).toBeTruthy();
            });

            it("allows visibility to be toggled", function () {
                controller = instantiateController();
                controller.toggle();
                expect(controller.visible()).toBeFalsy();
                controller.toggle();
                expect(controller.visible()).toBeTruthy();
            });

            it("collapses on navigation changes on portrait-oriented phones", function () {
                mockAgentService.isMobile.andReturn(true);
                mockAgentService.isPhone.andReturn(true);
                mockAgentService.isPortrait.andReturn(true);
                controller = instantiateController();
                expect(controller.visible()).toBeTruthy();

                // Simulate a navigation change
                mockNavigationService.getNavigation.andReturn(mockDomainObjects[1]);
                mockNavigationService.addListener.calls.forEach(function (call) {
                    call.args[0](mockDomainObjects[1]);
                });

                // Tree should have collapsed
                expect(controller.visible()).toBeFalsy();
            });

            it("detaches registered listeners when the scope is destroyed", function () {
                mockAgentService.isMobile.andReturn(true);
                mockAgentService.isPhone.andReturn(true);
                mockAgentService.isPortrait.andReturn(true);
                controller = instantiateController();

                // Verify precondition
                expect(mockNavigationService.removeListener)
                    .not.toHaveBeenCalled();

                mockScope.$on.calls.forEach(function (call) {
                    if (call.args[0] === '$destroy') {
                        call.args[1]();
                    }
                });

                expect(mockNavigationService.removeListener)
                    .toHaveBeenCalledWith(
                        mockNavigationService.addListener.mostRecentCall.args[0]
                    );
            });
        });
    }
);
