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
    ["../src/CompositionPolicy"],
    function (CompositionPolicy) {
        "use strict";
        describe("Composition policy", function () {
            var mockInjector,
                mockTypeService,
                mockCapabilityService,
                mockTypes,
                policy;

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj('$injector', ['get']);
                mockTypeService = jasmine.createSpyObj(
                    'typeService',
                    [ 'listTypes' ]
                );
                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    [ 'getCapabilities' ]
                );
                // Both types can only contain b, let's say
                mockTypes = ['a', 'b'].map(function (type) {
                    var mockType = jasmine.createSpyObj(
                        'type-' + type,
                        ['getKey', 'getDefinition', 'getInitialModel']
                    );
                    mockType.getKey.andReturn(type);
                    mockType.getDefinition.andReturn({
                        contains: ['b']
                    });
                    mockType.getInitialModel.andReturn({});
                    return mockType;
                });

                mockInjector.get.andCallFake(function (name) {
                    return {
                        typeService: mockTypeService,
                        capabilityService: mockCapabilityService
                    }[name];
                });

                mockTypeService.listTypes.andReturn(mockTypes);
                mockCapabilityService.getCapabilities.andReturn({});

                policy = new CompositionPolicy(mockInjector);
            });

            // Test basic composition policy here; test more closely at
            // the unit level in ContainmentTable for 'has' support, et al
            it("enforces containment rules defined by types", function () {
                expect(policy.allow(mockTypes[0], mockTypes[1]))
                    .toBeTruthy();
                expect(policy.allow(mockTypes[1], mockTypes[1]))
                    .toBeTruthy();
                expect(policy.allow(mockTypes[1], mockTypes[0]))
                    .toBeFalsy();
                expect(policy.allow(mockTypes[0], mockTypes[0]))
                    .toBeFalsy();
            });

        });
    }
);