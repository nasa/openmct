/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * MCTRepresentationSpec. Created by ahenry on 01/21/14.
 */
define(
    ["../../src/creation/AddActionProvider"],
    function (AddActionProvider) {

        describe("The add action provider", function () {
            var mockTypeService,
                mockDialogService,
                mockPolicyService,
                mockTypeMap,
                mockTypes,
                mockDomainObject,
                mockQ,
                provider;

            function createMockType(name) {
                var mockType = jasmine.createSpyObj(
                    "type" + name,
                    [
                        "getKey",
                        "getGlyph",
                        "getCssClass",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel",
                        "hasFeature"
                    ]
                );
                mockType.hasFeature.and.returnValue(true);
                mockType.getName.and.returnValue(name);
                mockType.getKey.and.returnValue(name);
                return mockType;
            }

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    ["getType"]
                );
                mockDialogService = {};
                mockPolicyService = {};
                mockDomainObject = {};

                mockTypes = [
                    "timeline",
                    "activity",
                    "other"
                ].map(createMockType);
                mockTypeMap = {};

                mockTypes.forEach(function (type) {
                    mockTypeMap[type.getKey()] = type;
                });

                mockTypeService.getType.and.callFake(function (key) {
                    return mockTypeMap[key];
                });

                provider = new AddActionProvider(
                    mockQ,
                    mockTypeService,
                    mockDialogService,
                    mockPolicyService
                );
            });

            it("provides actions for timeline and activity", function () {
                var actions = provider.getActions({
                    key: "add",
                    domainObject: mockDomainObject
                });
                expect(actions.length).toBe(2);
                expect(actions[0].metadata.type).toBe('timeline');
                expect(actions[1].metadata.type).toBe('activity');

                // Make sure it was creation which was used to check
            });
        });
    }
);
