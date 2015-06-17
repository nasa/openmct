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
    ["../../src/controllers/EditController"],
    function (EditController) {
        "use strict";

        describe("The Edit mode controller", function () {
            var mockScope,
                mockQ,
                mockNavigationService,
                mockObject,
                mockType,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on" ]
                );
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "getNavigation", "addListener", "removeListener" ]
                );
                mockObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability", "hasCapability" ]
                );
                mockType = jasmine.createSpyObj(
                    "type",
                    [ "hasFeature" ]
                );

                mockNavigationService.getNavigation.andReturn(mockObject);
                mockObject.getId.andReturn("test");
                mockObject.getModel.andReturn({ name: "Test object" });
                mockObject.getCapability.andCallFake(function (key) {
                    return key === 'type' && mockType;
                });
                mockType.hasFeature.andReturn(true);

                controller = new EditController(
                    mockScope,
                    mockQ,
                    mockNavigationService
                );
            });

            it("exposes the currently-navigated object", function () {
                expect(controller.navigatedObject()).toBeDefined();
                expect(controller.navigatedObject().getId()).toEqual("test");
            });

            it("adds an editor capability to the navigated object", function () {
                // Should provide an editor capability...
                expect(controller.navigatedObject().getCapability("editor"))
                    .toBeDefined();
                // Shouldn't have been the mock capability we provided
                expect(controller.navigatedObject().getCapability("editor"))
                    .not.toEqual(mockType);
            });

            it("detaches its navigation listener when destroyed", function () {
                var navCallback = mockNavigationService
                        .addListener.mostRecentCall.args[0];

                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );

                // Verify precondition
                expect(mockNavigationService.removeListener)
                    .not.toHaveBeenCalled();

                // Trigger destroy
                mockScope.$on.mostRecentCall.args[1]();

                // Listener should have been removed
                expect(mockNavigationService.removeListener)
                    .toHaveBeenCalledWith(navCallback);
            });

            it("exposes a warning message for unload", function () {
                var obj = controller.navigatedObject(),
                    mockEditor = jasmine.createSpyObj('editor', ['dirty']);

                // Normally, should be undefined
                expect(controller.getUnloadWarning()).toBeUndefined();

                // Override the object's editor capability, make it look
                // like there are unsaved changes.
                obj.getCapability = jasmine.createSpy();
                obj.getCapability.andReturn(mockEditor);
                mockEditor.dirty.andReturn(true);

                // Should have some warning message here now
                expect(controller.getUnloadWarning()).toEqual(jasmine.any(String));
            });

        });
    }
);
