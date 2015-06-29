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
    ["../src/BrowseObjectController"],
    function (BrowseObjectController) {
        "use strict";

        describe("The browse object controller", function () {
            var mockScope,
                mockLocation,
                mockRoute,
                mockUnlisten,
                controller;

            // Utility function; look for a $watch on scope and fire it
            function fireWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockRoute = { current: { params: {} } };
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    [ "path", "search" ]
                );
                mockUnlisten = jasmine.createSpy("unlisten");

                mockScope.$on.andReturn(mockUnlisten);

                controller = new BrowseObjectController(
                    mockScope,
                    mockLocation,
                    mockRoute
                );
            });

            it("updates query parameters when selected view changes", function () {
                fireWatch("representation.selected.key", "xyz");
                expect(mockLocation.search).toHaveBeenCalledWith('view', "xyz");

                // Allows the path index to be checked
                // prior to setting $route.current
                mockLocation.path.andReturn("/browse/");
                
                // Exercise the Angular workaround
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnlisten).toHaveBeenCalled();
            });

            it("sets the active view from query parameters", function () {
                var mockDomainObject = jasmine.createSpyObj(
                        "domainObject",
                        ['getId', 'getModel', 'getCapability', 'useCapability']
                    ),
                    testViews = [
                        { key: 'abc' },
                        { key: 'def', someKey: 'some value' },
                        { key: 'xyz' }
                    ];

                mockDomainObject.useCapability.andCallFake(function (c) {
                    return (c === 'view') && testViews;
                });
                mockLocation.search.andReturn({ view: 'def' });

                fireWatch('domainObject', mockDomainObject);
                expect(mockScope.representation.selected)
                    .toEqual(testViews[1]);
            });

        });
    }
);
