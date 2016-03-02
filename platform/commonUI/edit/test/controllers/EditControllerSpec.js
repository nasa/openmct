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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/controllers/EditObjectController"],
    function (EditObjectController) {
        "use strict";

        describe("The Edit mode controller", function () {
            var mockScope,
                mockObject,
                mockType,
                mockLocation,
                mockStatusCapability,
                mockCapabilities,
                mockPolicyService,
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
                mockPolicyService = jasmine.createSpyObj(
                    "policyService",
                    [
                        "allow"
                    ]
                );
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability", "hasCapability", "useCapability" ]
                );
                mockType = jasmine.createSpyObj(
                    "type",
                    [ "hasFeature" ]
                );
                mockStatusCapability = jasmine.createSpyObj('statusCapability',
                    ["get"]
                );

                mockCapabilities = {
                    "type" : mockType,
                    "status": mockStatusCapability
                };

                mockLocation = jasmine.createSpyObj('$location',
                    ["search"]
                );
                mockLocation.search.andReturn({"view": "fixed"});

                mockObject.getId.andReturn("test");
                mockObject.getModel.andReturn({ name: "Test object" });
                mockObject.getCapability.andCallFake(function (key) {
                    return mockCapabilities[key];
                });
                mockType.hasFeature.andReturn(true);

                mockScope.domainObject = mockObject;

                controller = new EditObjectController(
                    mockScope,
                    mockLocation,
                    mockPolicyService
                );
            });

            it("exposes a warning message for unload", function () {
                var obj = mockObject,
                    errorMessage = "Unsaved changes";

                // Normally, should be undefined
                expect(controller.getUnloadWarning()).toBeUndefined();

                // Override the policy service to prevent navigation
                mockPolicyService.allow.andCallFake(function(category, object, context, callback){
                   callback(errorMessage);
                });

                // Should have some warning message here now
                expect(controller.getUnloadWarning()).toEqual(errorMessage);
            });


            it("sets the active view from query parameters", function () {
                var testViews = [
                        { key: 'abc' },
                        { key: 'def', someKey: 'some value' },
                        { key: 'xyz' }
                    ];

                mockObject.useCapability.andCallFake(function (c) {
                    return (c === 'view') && testViews;
                });
                mockLocation.search.andReturn({ view: 'def' });

                fireWatch('domainObject', mockObject);
                expect(mockScope.representation.selected)
                    .toEqual(testViews[1]);
            });

        });
    }
);
