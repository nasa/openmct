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

define(
    ["../src/InspectorPaneController"],
    function (InspectorPaneController) {

        describe("The InspectorPaneController", function () {
            var mockScope,
                mockAgentService,
                mockDomainObject,
                mockWindow,
                mockStatusCapability,
                mockNavigationService,
                mockNavigationUnlistener,
                mockStatusUnlistener,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$on"]);
                mockWindow = jasmine.createSpyObj("$window", ["open"]);
                mockAgentService = jasmine.createSpyObj(
                    "agentService",
                    ["isMobile", "isPhone", "isTablet", "isPortrait", "isLandscape"]
                );

                mockNavigationUnlistener = jasmine.createSpy("navigationUnlistener");
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    ["getNavigation", "addListener"]
                );
                mockNavigationService.addListener.andReturn(mockNavigationUnlistener);

                mockStatusUnlistener = jasmine.createSpy("statusUnlistener");
                mockStatusCapability = jasmine.createSpyObj(
                    "statusCapability",
                    ["listen"]
                );
                mockStatusCapability.listen.andReturn(mockStatusUnlistener);

                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [
                        'getId',
                        'getModel',
                        'getCapability',
                        'hasCapability'
                    ]
                );
                mockDomainObject.getId.andReturn("domainObject");
                mockDomainObject.getModel.andReturn({});
                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockStatusCapability);

                controller = new InspectorPaneController(mockScope, mockAgentService, mockWindow, mockNavigationService);
            });

            it("listens for changes to navigation and attaches a status" +
                " listener", function () {
                expect(mockNavigationService.addListener).toHaveBeenCalledWith(jasmine.any(Function));
                mockNavigationService.addListener.mostRecentCall.args[0](mockDomainObject);
                expect(mockStatusCapability.listen).toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("if hidden, shows the inspector when domain object switches to" +
                " edit mode", function () {
                controller.toggle();
                // test pre-condition that inspector is hidden
                expect(controller.visible()).toBe(false);
                mockNavigationService.addListener.mostRecentCall.args[0](mockDomainObject);
                mockStatusCapability.listen.mostRecentCall.args[0](["editing"]);
                expect(controller.visible()).toBe(true);
            });

        });
    }
);
