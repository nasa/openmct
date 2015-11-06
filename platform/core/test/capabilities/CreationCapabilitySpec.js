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
 * ContextCapability. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/CreationCapability"],
    function (CreationCapability) {
        'use strict';

        describe("The 'creation' capability", function () {
            var mockInjector,
                mockCapabilityService,
                creation;

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj("$injector", ["get"]);
                mockCapabilityService = jasmine.createSpyObj(
                    "capabilityService",
                    [ "getCapabilities" ]
                );

                mockInjector.get.andCallFake(function (key) {
                    return key === 'capabilityService' ?
                            mockCapabilityService : undefined;
                });

                creation = new CreationCapability(mockInjector);
            });


            it("aliases 'create' as 'invoke'", function () {
                expect(creation.invoke).toBe(creation.create);
            });

            describe("when creating an object", function () {
                var mockCapabilityConstructor,
                    mockCapabilityInstance,
                    mockCapabilities,
                    testModel,
                    domainObject;

                beforeEach(function () {
                    mockCapabilityConstructor = jasmine.createSpy('capability');
                    mockCapabilityInstance = {};
                    mockCapabilityService.getCapabilities.andReturn({
                        something: mockCapabilityConstructor
                    });
                    mockCapabilityConstructor.andReturn(mockCapabilityInstance);

                    testModel = { someKey: "some value" };

                    domainObject = creation.create(testModel);
                });

                it("loads capabilities from the capability service", function () {
                    expect(mockCapabilityService.getCapabilities)
                        .toHaveBeenCalledWith(testModel);
                });

                it("exposes loaded capabilities from the created object", function () {
                    expect(domainObject.getCapability('something'))
                        .toBe(mockCapabilityInstance);
                    expect(mockCapabilityConstructor)
                        .toHaveBeenCalledWith(domainObject);
                });

                it("exposes the provided model", function () {
                    expect(domainObject.getModel()).toEqual(testModel);
                });

                it("provides unique identifiers", function () {
                    expect(domainObject.getId()).toEqual(jasmine.any(String));
                    expect(creation.create(testModel).getId())
                        .not.toEqual(domainObject.getId());
                });
            });

        });
    }
);
