/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    ["../src/PaneController"],
    function (PaneController) {

        describe("The PaneController", function () {
            var mockScope,
                mockAgentService,
                mockDomainObjects,
                mockWindow,
                controller,
                mockLocation,
                mockAttrs;

            // We want to reinstantiate for each test case
            // because device state can influence constructor-time behavior
            function instantiateController() {
                return new PaneController(
                    mockScope,
                    mockAgentService,
                    mockWindow,
                    mockLocation,
                    mockAttrs
                );
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$on"]);
                mockDomainObjects = ['a', 'b'].map(function (id) {
                    var mockDomainObject = jasmine.createSpyObj(
                        'domainObject-' + id,
                        ['getId', 'getModel', 'getCapability']
                    );

                    mockDomainObject.getId.and.returnValue(id);
                    mockDomainObject.getModel.and.returnValue({});

                    return mockDomainObject;
                });
                mockAgentService = jasmine.createSpyObj(
                    "agentService",
                    ["isMobile", "isPhone", "isTablet", "isPortrait", "isLandscape"]
                );
                mockWindow = jasmine.createSpyObj("$window", ["open"]);

                mockLocation = jasmine.createSpyObj('location', ['search']);
                mockLocation.search.and.returnValue({});

                mockAttrs = {};
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
                mockAgentService.isMobile.and.returnValue(true);
                mockAgentService.isPhone.and.returnValue(true);
                mockAgentService.isPortrait.and.returnValue(true);
                controller = instantiateController();
                expect(controller.visible()).toBeTruthy();

                // Simulate a change from the tree by invoking controller's
                controller.callback();

                // Tree should have collapsed
                expect(controller.visible()).toBeFalsy();
            });

            describe("specifying hideParameter", function () {
                beforeEach(function () {
                    mockAttrs = {hideParameter: 'hideTree'};
                });

                it("sets pane state to false when in location.search", function () {
                    mockLocation.search.and.returnValue({'hideTree': true});
                    expect(instantiateController().visible()).toBe(false);
                    expect(mockLocation.search).toHaveBeenCalledWith('hideTree', undefined);
                });

                it("sets state to true when not found in location.search", function () {
                    mockLocation.search.and.returnValue({});
                    expect(instantiateController().visible()).toBe(true);
                    expect(mockLocation.search).not.toHaveBeenCalledWith('hideTree', undefined);
                });
            });
        });
    }
);
