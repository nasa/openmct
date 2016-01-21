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
 * MCTRepresentationSpec. Created by ahenry on 01/21/14.
 */
define(
    ["../../src/creation/AddActionProvider"],
    function (AddActionProvider) {
        "use strict";

        describe("The add action provider", function () {
            var mockTypeService,
                mockDialogService,
                mockPolicyService,
                mockCreationPolicy,
                mockCompositionPolicy,
                mockPolicyMap = {},
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
                mockPolicyService = jasmine.createSpyObj(
                    "policyService",
                    [ "allow" ]
                );

                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability" ]
                );

                //Mocking getCapability because AddActionProvider uses the
                // type capability of the destination object.
                mockDomainObject.getCapability.andReturn({});

                mockTypes = [ "A", "B", "C" ].map(createMockType);

                mockTypes.forEach(function(type){
                    mockPolicyMap[type.getName()] = true;
                });

                mockCreationPolicy = function(type){
                    return mockPolicyMap[type.getName()];
                };

                mockCompositionPolicy = function(){
                    return true;
                };

                mockPolicyService.allow.andReturn(true);

                mockTypeService.listTypes.andReturn(mockTypes);

                provider = new AddActionProvider(
                    mockQ,
                    mockTypeService,
                    mockDialogService,
                    mockPolicyService
                );
            });

            it("checks for creatability", function () {
                provider.getActions({
                    key: "add",
                    domainObject: mockDomainObject
                });
                // Make sure it was creation which was used to check
                expect(mockPolicyService.allow)
                    .toHaveBeenCalledWith("creation", mockTypes[0]);
            });

            it("checks for composability of type", function () {
                provider.getActions({
                    key: "add",
                    domainObject: mockDomainObject
                });

                expect(mockPolicyService.allow).toHaveBeenCalledWith(
                    "composition",
                    jasmine.any(Object),
                    jasmine.any(Object)
                );

                expect(mockDomainObject.getCapability).toHaveBeenCalledWith('type');
            });
        });
    }
);