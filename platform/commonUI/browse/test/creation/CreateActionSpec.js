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
    ["../../src/creation/CreateAction"],
    function (CreateAction) {
        "use strict";

        describe("The create action", function () {
            var mockType,
                mockParent,
                mockContext,
                mockDialogService,
                mockCreationService,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getGlyph",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel"
                    ]
                );
                mockParent = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "getCapability"
                    ]
                );
                mockContext = {
                    domainObject: mockParent
                };
                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    [ "getUserInput" ]
                );
                mockCreationService = jasmine.createSpyObj(
                    "creationService",
                    [ "createObject" ]
                );

                mockType.getKey.andReturn("test");
                mockType.getGlyph.andReturn("T");
                mockType.getDescription.andReturn("a test type");
                mockType.getName.andReturn("Test");
                mockType.getProperties.andReturn([]);
                mockType.getInitialModel.andReturn({});

                mockDialogService.getUserInput.andReturn(mockPromise({}));

                action = new CreateAction(
                    mockType,
                    mockParent,
                    mockContext,
                    mockDialogService,
                    mockCreationService
                );
            });

            it("exposes type-appropriate metadata", function () {
                var metadata = action.getMetadata();

                expect(metadata.name).toEqual("Test");
                expect(metadata.description).toEqual("a test type");
                expect(metadata.glyph).toEqual("T");
            });

            //TODO: Disabled for NEM Beta
            xit("invokes the creation service when performed", function () {
                action.perform();
                expect(mockCreationService.createObject).toHaveBeenCalledWith(
                    { type: "test" },
                    mockParent
                );
            });

            //TODO: Disabled for NEM Beta
            xit("does not create an object if the user cancels", function () {
                mockDialogService.getUserInput.andReturn({
                    then: function (callback, fail) {
                        fail();
                    }
                });

                action.perform();

                expect(mockCreationService.createObject)
                    .not.toHaveBeenCalled();

            });

        });
    }
);