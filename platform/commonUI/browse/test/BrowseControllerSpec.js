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

        describe("The browse controller", function () {
            var mockScope,
                mockRoute,
                mockLocation,
                mockObjectService,
                mockNavigationService,
                mockRootObject,
                mockUrlService,
                mockDomainObject,
                mockNextObject,
                mockWindow,
                mockPolicyService,
                testDefaultRoot,
                controller;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function instantiateController() {
                controller = new BrowseController(
                    mockScope,
                    mockRoute,
                    mockLocation,
                    mockWindow,
                    mockObjectService,
                    mockNavigationService,
                    mockUrlService,
                    mockPolicyService,
                    testDefaultRoot
                );
            }

            beforeEach(function () {
                mockWindow = jasmine.createSpyObj('$window', [
                   "confirm"
                ]);
                mockWindow.confirm.andReturn(true);

                mockPolicyService = jasmine.createSpyObj('policyService', [
                    'allow'
                ]);

                testDefaultRoot = "some-root-level-domain-object";

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
                mockDomainObject.getId.andReturn(testDefaultRoot);

                instantiateController();
            });

            it("uses composition to set the navigated object, if there is none", function () {
                instantiateController();
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("navigates to a root-level object, even when default path is not found", function () {
                mockDomainObject.getId
                    .andReturn("something-other-than-the-" + testDefaultRoot);
                instantiateController();
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("does not try to override navigation", function () {
                mockNavigationService.getNavigation.andReturn(mockDomainObject);
                instantiateController();
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
                mockRoute.current.params.ids = testDefaultRoot + "/next";
                instantiateController();
                expect(mockScope.navigatedObject).toBe(mockNextObject);
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockNextObject);
            });

            it("handles invalid IDs by going as far as possible", function () {
                // Idea here is that if we get a bad path of IDs,
                // browse controller should traverse down it until
                // it hits an invalid ID.
                mockRoute.current.params.ids = testDefaultRoot + "/junk";
                instantiateController();
                expect(mockScope.navigatedObject).toBe(mockDomainObject);
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("handles compositionless objects by going as far as possible", function () {
                // Idea here is that if we get a path which passes
                // through an object without a composition, browse controller
                // should stop at it since remaining IDs cannot be loaded.
                mockRoute.current.params.ids = testDefaultRoot + "/next/junk";
                instantiateController();
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

                mockNavigationService.setNavigation.andReturn(true);

                // Exercise the Angular workaround
                mockNavigationService.addListener.mostRecentCall.args[0]();
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnlisten).toHaveBeenCalled();

                // location.path to be called with the urlService's
                // urlFor function with the next domainObject and mode
                expect(mockLocation.path).toHaveBeenCalledWith(
                    mockUrlService.urlForLocation(mockMode, mockNextObject)
                );
            });

            it("after successful navigation event sets the selected tree " +
                "object", function () {
                mockScope.navigatedObject = mockDomainObject;
                mockNavigationService.setNavigation.andReturn(true);

                //Simulate a change in selected tree object
                mockScope.treeModel = {selectedObject: mockDomainObject};
                mockScope.$watch.mostRecentCall.args[1](mockNextObject);

                expect(mockScope.treeModel.selectedObject).toBe(mockNextObject);
                expect(mockScope.treeModel.selectedObject).not.toBe(mockDomainObject);
            });

            it("after failed navigation event resets the selected tree" +
                " object", function () {
                mockScope.navigatedObject = mockDomainObject;
                mockWindow.confirm.andReturn(false);
                mockPolicyService.allow.andCallFake(function(category, object, context, callback){
                    callback("unsaved changes");
                    return false;
                });

                //Simulate a change in selected tree object
                mockScope.treeModel = {selectedObject: mockDomainObject};
                mockScope.$watch.mostRecentCall.args[1](mockNextObject);

                expect(mockScope.treeModel.selectedObject).not.toBe(mockNextObject);
                expect(mockScope.treeModel.selectedObject).toBe(mockDomainObject);
            });

        });
    }
);
