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
    ["../src/CapabilityTable"],
    function (CapabilityTable) {
        "use strict";
        describe("Composition policy's capability table", function () {
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
                mockTypes = ['a', 'b'].map(function (type, index) {
                    var mockType = jasmine.createSpyObj(
                        'type-' + type,
                        ['getKey', 'getDefinition', 'getInitialModel']
                    );
                    mockType.getKey.andReturn(type);
                    // Return a model to drive apparant capabilities
                    mockType.getInitialModel.andReturn({ id: type });
                    return mockType;
                });

                mockTypeService.listTypes.andReturn(mockTypes);
                mockCapabilityService.getCapabilities.andCallFake(function (model) {
                    var capabilities = {};
                    capabilities[model.id + '-capability'] = true;
                    return capabilities;
                });

                table = new CapabilityTable(
                    mockTypeService,
                    mockCapabilityService
                );
            });

            it("provides for lookup of capabilities by type", function () {
                // Based on initial model, should report the presence
                // of particular capabilities - suffixed above with -capability
                expect(table.hasCapability('a', 'a-capability'))
                    .toBeTruthy();
                expect(table.hasCapability('a', 'b-capability'))
                    .toBeFalsy();
                expect(table.hasCapability('a', 'c-capability'))
                    .toBeFalsy();
                expect(table.hasCapability('b', 'a-capability'))
                    .toBeFalsy();
                expect(table.hasCapability('b', 'b-capability'))
                    .toBeTruthy();
                expect(table.hasCapability('b', 'c-capability'))
                    .toBeFalsy();
            });

        });
    }
);