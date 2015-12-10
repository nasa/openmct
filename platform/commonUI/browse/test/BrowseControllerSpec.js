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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,xit,xdescribe*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/BrowseController"],
    function (BrowseController) {
        "use strict";

        //TODO: Disabled for NEM Beta
        xdescribe("The browse controller", function () {
            var mockScope,
                mockRoute,
                mockLocation,
                mockObjectService,
                mockNavigationService,
                mockRootObject,
                mockUrlService,
                mockDomainObject,
                mockNextObject,
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
                mockUrlService = jasmine.createSpyObj(
                    "urlService",
                    ["urlForLocation"]
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
                mockNextObject = jasmine.createSpyObj(
                    "nextObject",
                    [ "getId", "getCapability", "getModel", "useCapability" ]
                );

                mockObjectService.getObjects.andReturn(mockPromise({
                    ROOT: mockRootObject
                }));
                mockRootObject.useCapability.andReturn(mockPromise([
                    mockDomainObject
                ]));
                mockDomainObject.useCapability.andReturn(mockPromise([
                    mockNextObject
                ]));
                mockNextObject.useCapability.andReturn(undefined);
                mockNextObject.getId.andReturn("next");
                mockDomainObject.getId.andReturn("mine");

                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService,
                    mockUrlService
                );
            });

            it("uses composition to set the navigated object, if there is none", function () {
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService,
                    mockUrlService
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
                    mockNavigationService,
                    mockUrlService
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

            it("uses route parameters to choose initially-navigated object", function () {
                mockRoute.current.params.ids = "mine/next";
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockScope.navigatedObject).toBe(mockNextObject);
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockNextObject);
            });

            it("handles invalid IDs by going as far as possible", function () {
                // Idea here is that if we get a bad path of IDs,
                // browse controller should traverse down it until
                // it hits an invalid ID.
                mockRoute.current.params.ids = "mine/junk";
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockScope.navigatedObject).toBe(mockDomainObject);
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("handles compositionless objects by going as far as possible", function () {
                // Idea here is that if we get a path which passes
                // through an object without a composition, browse controller
                // should stop at it since remaining IDs cannot be loaded.
                mockRoute.current.params.ids = "mine/next/junk";
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockScope.navigatedObject).toBe(mockNextObject);
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockNextObject);
            });

            it("updates the displayed route to reflect current navigation", function () {
                var mockContext = jasmine.createSpyObj('context', ['getPath']),
                    mockUnlisten = jasmine.createSpy('unlisten'),
                    mockMode = "browse";

                mockContext.getPath.andReturn(
                    [mockRootObject, mockDomainObject, mockNextObject]
                );
                mockNextObject.getCapability.andCallFake(function (c) {
                    return c === 'context' && mockContext;
                });
                mockScope.$on.andReturn(mockUnlisten);
                // Provide a navigation change
                mockNavigationService.addListener.mostRecentCall.args[0](
                    mockNextObject
                );

                // Allows the path index to be checked
                // prior to setting $route.current
                mockLocation.path.andReturn("/browse/");

                // Exercise the Angular workaround
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnlisten).toHaveBeenCalled();

                // location.path to be called with the urlService's
                // urlFor function with the next domainObject and mode
                expect(mockLocation.path).toHaveBeenCalledWith(
                    mockUrlService.urlForLocation(mockMode, mockNextObject)
                );
            });

        });
    }
);
