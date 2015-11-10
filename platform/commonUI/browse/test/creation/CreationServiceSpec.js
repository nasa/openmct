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
    ["../../src/creation/CreationService"],
    function (CreationService) {
        "use strict";

        describe("The creation service", function () {
            var mockQ,
                mockLog,
                mockParentObject,
                mockNewObject,
                mockMutationCapability,
                mockPersistenceCapability,
                mockCompositionCapability,
                mockContextCapability,
                mockCreationCapability,
                mockCapabilities,
                mockNewPersistenceCapability,
                creationService;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function mockReject(value) {
                return {
                    then: function (callback, error) {
                        return mockPromise(error(value));
                    }
                };
            }

            beforeEach(function () {
                mockQ = { when: mockPromise, reject: mockReject };
                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "error", "warn", "info", "debug" ]
                );
                mockParentObject = jasmine.createSpyObj(
                    "parentObject",
                    [ "getId", "getCapability", "useCapability" ]
                );
                mockNewObject = jasmine.createSpyObj(
                    "newObject",
                    [ "getId", "getCapability", "useCapability" ]
                );
                mockMutationCapability = jasmine.createSpyObj(
                    "mutation",
                    [ "invoke" ]
                );
                mockPersistenceCapability = jasmine.createSpyObj(
                    "persistence",
                    [ "persist", "getSpace" ]
                );
                mockCompositionCapability = jasmine.createSpyObj(
                    "composition",
                    ["invoke", "add"]
                );
                mockContextCapability = jasmine.createSpyObj(
                    "context",
                    ["getPath"]
                );
                mockCreationCapability = jasmine.createSpyObj(
                    "creation",
                    ["instantiate", "invoke"]
                );
                mockCapabilities = {
                    mutation: mockMutationCapability,
                    persistence: mockPersistenceCapability,
                    composition: mockCompositionCapability,
                    context: mockContextCapability,
                    instantiation: mockCreationCapability
                };
                mockNewPersistenceCapability = jasmine.createSpyObj(
                    "new-persistence",
                    [ "persist", "getSpace" ]
                );

                mockParentObject.getCapability.andCallFake(function (key) {
                    return mockCapabilities[key];
                });
                mockParentObject.useCapability.andCallFake(function (key, value) {
                    return mockCapabilities[key].invoke(value);
                });
                mockParentObject.getId.andReturn('parentId');

                mockNewObject.getId.andReturn('newId');
                mockNewObject.getCapability.andCallFake(function (c) {
                    return c === 'persistence' ?
                            mockNewPersistenceCapability : undefined;
                });

                mockPersistenceCapability.persist
                    .andReturn(mockPromise(true));
                mockNewPersistenceCapability.persist
                    .andReturn(mockPromise(true));

                mockMutationCapability.invoke.andReturn(mockPromise(true));
                mockPersistenceCapability.getSpace.andReturn("testSpace");
                mockCompositionCapability.invoke.andReturn(
                    mockPromise([mockNewObject])
                );
                mockCompositionCapability.add.andReturn(mockPromise(true));
                mockCreationCapability.instantiate.andReturn(mockNewObject);
                mockCreationCapability.invoke.andCallFake(function (model) {
                    return mockCreationCapability.instantiate(model);
                });

                creationService = new CreationService(
                    mockQ,
                    mockLog
                );
            });

            it("allows new objects to be created", function () {
                var model = { someKey: "some value" };
                creationService.createObject(model, mockParentObject);
                expect(mockCreationCapability.instantiate)
                    .toHaveBeenCalledWith(model);
            });

            it("adds new objects to the parent's composition", function () {
                var model = { someKey: "some value" },
                    parentModel = { composition: ["notAnyUUID"] };
                creationService.createObject(model, mockParentObject);

                // Verify that a new ID was added
                expect(mockCompositionCapability.add)
                    .toHaveBeenCalledWith(mockNewObject);
            });

            it("provides the newly-created object", function () {
                var mockDomainObject = jasmine.createSpyObj(
                        'newDomainObject',
                        ['getId', 'getModel', 'getCapability']
                    ),
                    mockCallback = jasmine.createSpy('callback');

                // Act as if the object had been created
                mockCompositionCapability.add.andCallFake(function (id) {
                    mockDomainObject.getId.andReturn(id);
                    mockCompositionCapability.invoke
                        .andReturn(mockPromise([mockDomainObject]));
                    return mockPromise(mockDomainObject);
                });

                // Should find it in the composition
                creationService.createObject({}, mockParentObject)
                    .then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith(mockDomainObject);

            });

            it("warns if parent has no persistence capability", function () {
                // Callbacks
                var success = jasmine.createSpy("success"),
                    failure = jasmine.createSpy("failure");

                mockCapabilities.persistence = undefined;
                creationService.createObject({}, mockParentObject).then(
                    success,
                    failure
                );

                // Should have warned and rejected the promise
                expect(mockLog.warn).toHaveBeenCalled();
                expect(success).not.toHaveBeenCalled();
                expect(failure).toHaveBeenCalled();
            });

            it("logs an error when mutaton fails", function () {
                // If mutation of the parent fails, we've lost the
                // created object - this is an error.
                var model = { someKey: "some value" },
                    parentModel = { composition: ["notAnyUUID"] };

                mockCompositionCapability.add.andReturn(mockPromise(false));

                creationService.createObject(model, mockParentObject);

                expect(mockLog.error).toHaveBeenCalled();
            });


        });
    }
);
