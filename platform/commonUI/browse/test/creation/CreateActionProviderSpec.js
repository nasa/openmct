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
    ["../../src/creation/CreateActionProvider"],
    function (CreateActionProvider) {
        "use strict";

        describe("The create action provider", function () {
            var mockTypeService,
                mockDialogService,
                mockCreationService,
                mockTypes,
                provider;

            function createMockType(name) {
                var mockType = jasmine.createSpyObj(
                    "type" + name,
                    [
                        "getKey",
                        "getGlyph",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel",
                        "hasFeature"
                    ]
                );
                mockType.hasFeature.andReturn(true);
                mockType.getName.andReturn(name);
                return mockType;
            }

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    [ "listTypes" ]
                );
                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    [ "getUserInput" ]
                );
                mockCreationService = jasmine.createSpyObj(
                    "creationService",
                    [ "createObject" ]
                );
                mockTypes = [ "A", "B", "C" ].map(createMockType);

                mockTypeService.listTypes.andReturn(mockTypes);

                provider = new CreateActionProvider(
                    mockTypeService,
                    mockDialogService,
                    mockCreationService
                );
            });

            it("exposes one create action per type", function () {
                expect(provider.getActions({
                    key: "create",
                    domainObject: {}
                }).length).toEqual(3);
            });

            it("exposes no non-create actions", function () {
                expect(provider.getActions({
                    key: "somethingElse",
                    domainObject: {}
                }).length).toEqual(0);
            });

            it("does not expose non-creatable types", function () {
                // One of the types won't have the creation feature...
                mockTypes[1].hasFeature.andReturn(false);
                // ...so it should have been filtered out.
                expect(provider.getActions({
                    key: "create",
                    domainObject: {}
                }).length).toEqual(2);
                // Make sure it was creation which was used to check
                expect(mockTypes[1].hasFeature)
                    .toHaveBeenCalledWith("creation");
            });
        });
    }
);