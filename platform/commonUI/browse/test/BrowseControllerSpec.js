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
    ["../src/BrowseController"],
    function (BrowseController) {
        "use strict";

        describe("The browse controller", function () {
            var mockScope,
                mockRoute,
                mockLocation,
                mockObjectService,
                mockNavigationService,
                mockRootObject,
                mockDomainObject,
                controller;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockRoute = { current: { params: {} } };
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    [ "path" ]
                );
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [
                        "getNavigation",
                        "setNavigation",
                        "addListener",
                        "removeListener"
                    ]
                );
                mockRootObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "getModel", "useCapability" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "getModel", "useCapability" ]
                );

                mockObjectService.getObjects.andReturn(mockPromise({
                    ROOT: mockRootObject
                }));
                mockRootObject.useCapability.andReturn(mockPromise([
                    mockDomainObject
                ]));
                mockDomainObject.getId.andReturn("mine");

                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService
                );
            });

            it("uses composition to set the navigated object, if there is none", function () {
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("does not try to override navigation", function () {
                mockNavigationService.getNavigation.andReturn(mockDomainObject);
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockScope.navigatedObject).toBe(mockDomainObject);
            });

            it("updates scope when navigated object changes", function () {
                // Should have registered a listener - call it
                mockNavigationService.addListener.mostRecentCall.args[0](
                    mockDomainObject
                );
                expect(mockScope.navigatedObject).toEqual(mockDomainObject);
            });

            it("releases its navigation listener when its scope is destroyed", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
                mockScope.$on.mostRecentCall.args[1]();
                // Should remove the listener it added earlier
                expect(mockNavigationService.removeListener).toHaveBeenCalledWith(
                    mockNavigationService.addListener.mostRecentCall.args[0]
                );
            });

        });
    }
);
