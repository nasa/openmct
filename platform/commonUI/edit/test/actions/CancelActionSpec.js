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
/*global define,describe,it,expect,beforeEach,jasmine,xit,xdescribe*/

define(
    ["../../src/actions/CancelAction"],
    function (CancelAction) {
        "use strict";

        //TODO: Disabled for NEM Beta
        xdescribe("The Cancel action", function () {
            var mockLocation,
                mockDomainObject,
                mockEditorCapability,
                mockUrlService,
                actionContext,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    [ "path" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability", "hasCapability" ]
                );
                mockEditorCapability = jasmine.createSpyObj(
                    "editor",
                    [ "save", "cancel" ]
                );
                mockUrlService = jasmine.createSpyObj(
                    "urlService",
                    ["urlForLocation"]
                );

                actionContext = {
                    domainObject: mockDomainObject
                };

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockEditorCapability);
                mockEditorCapability.cancel.andReturn(mockPromise(true));

                action = new CancelAction(mockLocation, mockUrlService, actionContext);

            });

            it("only applies to domain object with an editor capability", function () {
                expect(CancelAction.appliesTo(actionContext)).toBeTruthy();
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.hasCapability.andReturn(false);
                mockDomainObject.getCapability.andReturn(undefined);
                expect(CancelAction.appliesTo(actionContext)).toBeFalsy();
            });

            it("invokes the editor capability's save functionality when performed", function () {
                // Verify precondition
                expect(mockEditorCapability.cancel).not.toHaveBeenCalled();
                action.perform();

                // Should have called cancel
                expect(mockEditorCapability.cancel).toHaveBeenCalled();

                // Definitely shouldn't call save!
                expect(mockEditorCapability.save).not.toHaveBeenCalled();
            });

            it("returns to browse when performed", function () {
                action.perform();
                expect(mockLocation.path).toHaveBeenCalledWith(
                    mockUrlService.urlForLocation("browse", mockDomainObject)
                );
            });
        });
    }
);