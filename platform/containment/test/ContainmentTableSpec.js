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
    ["../src/ContainmentTable"],
    function (ContainmentTable) {
        "use strict";
        describe("Composition policy's containment table", function () {
            var mockTypeService,
                mockCapabilityService,
                mockTypes,
                table;

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    'typeService',
                    [ 'listTypes' ]
                );
                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    [ 'getCapabilities' ]
                );
                // Both types can only contain b, let's say
                mockTypes = ['a', 'b', 'c'].map(function (type, index) {
                    var mockType = jasmine.createSpyObj(
                        'type-' + type,
                        ['getKey', 'getDefinition', 'getInitialModel']
                    );
                    mockType.getKey.andReturn(type);
                    mockType.getDefinition.andReturn({
                        // First two contain objects with capability 'b';
                        // third one defines no containership rules
                        contains: (index < 2) ? [ { has: 'b' } ] : undefined
                    });
                    // Return a model to drive apparant capabilities
                    mockType.getInitialModel.andReturn({ id: type });
                    return mockType;
                });

                mockTypeService.listTypes.andReturn(mockTypes);
                mockCapabilityService.getCapabilities.andCallFake(function (model) {
                    var capabilities = {};
                    capabilities[model.id] = true;
                    return capabilities;
                });

                table = new ContainmentTable(
                    mockTypeService,
                    mockCapabilityService
                );
            });

            // The plain type case is tested in CompositionPolicySpec,
            // so just test for special syntax ('has', or no contains rules) here
            it("enforces 'has' containment rules related to capabilities", function () {
                expect(table.canContain(mockTypes[0], mockTypes[1]))
                    .toBeTruthy();
                expect(table.canContain(mockTypes[1], mockTypes[1]))
                    .toBeTruthy();
                expect(table.canContain(mockTypes[1], mockTypes[0]))
                    .toBeFalsy();
                expect(table.canContain(mockTypes[0], mockTypes[0]))
                    .toBeFalsy();
            });

            it("allows anything when no containership rules are defined", function () {
                expect(table.canContain(mockTypes[2], mockTypes[0]))
                    .toBeTruthy();
                expect(table.canContain(mockTypes[2], mockTypes[1]))
                    .toBeTruthy();
                expect(table.canContain(mockTypes[2], mockTypes[2]))
                    .toBeTruthy();
            });


        });
    }
);