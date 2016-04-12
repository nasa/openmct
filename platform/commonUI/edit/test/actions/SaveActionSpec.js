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
    ["../../src/actions/SaveAction"],
    function (SaveAction) {
        "use strict";

        describe("The Save action", function () {
            var mockDomainObject,
                mockEditorCapability,
                actionContext,
                mockActionCapability,
                capabilities = {},
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getCapability",
                        "hasCapability",
                        "getModel",
                        "getOriginalObject"
                    ]
                );
                mockEditorCapability = jasmine.createSpyObj(
                    "editor",
                    [ "save", "cancel" ]
                );
                mockActionCapability = jasmine.createSpyObj(
                    "actionCapability",
                    [ "perform"]
                );
                capabilities.editor = mockEditorCapability;
                capabilities.action = mockActionCapability;

                actionContext = {
                    domainObject: mockDomainObject
                };

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andCallFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.getModel.andReturn({persisted: 0});
                mockEditorCapability.save.andReturn(mockPromise(true));
                mockDomainObject.getOriginalObject.andReturn(mockDomainObject);

                action = new SaveAction(actionContext);

            });

            it("only applies to domain object with an editor capability", function () {
                expect(SaveAction.appliesTo(actionContext)).toBe(true);
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.hasCapability.andReturn(false);
                mockDomainObject.getCapability.andReturn(undefined);
                expect(SaveAction.appliesTo(actionContext)).toBe(false);
            });

            it("only applies to domain object that has already been persisted",
                function () {
                    mockDomainObject.getModel.andReturn({persisted: undefined});
                    expect(SaveAction.appliesTo(actionContext)).toBe(false);
            });

            it("uses the editor capability to save the object",
                function () {
                    action.perform();
                    expect(mockEditorCapability.save).toHaveBeenCalled();
                });
        });
    }
);