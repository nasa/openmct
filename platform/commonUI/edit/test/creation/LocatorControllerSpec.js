/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/LocatorController"],
    (LocatorController) => {

        describe("The locator controller", () => {
            let mockScope,
                mockTimeout,
                mockDomainObject,
                mockRootObject,
                mockContext,
                mockObjectService,
                getObjectsPromise,
                controller;

            beforeEach( () => {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$watch"]
                );
                mockTimeout = jasmine.createSpy("$timeout");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability"]
                );
                mockRootObject = jasmine.createSpyObj(
                    "rootObject",
                    ["getCapability"]
                );
                mockContext = jasmine.createSpyObj(
                    "context",
                    ["getRoot"]
                );
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    ["getObjects"]
                );
                getObjectsPromise = jasmine.createSpyObj(
                    "promise",
                    ["then"]
                );

                mockDomainObject.getCapability.andReturn(mockContext);
                mockContext.getRoot.andReturn(mockRootObject);
                mockObjectService.getObjects.andReturn(getObjectsPromise);

                mockScope.ngModel = {};
                mockScope.field = "someField";

                controller = new LocatorController(mockScope, mockTimeout, mockObjectService);
            });
            describe("when context is available", () => {

                beforeEach( () => {
                        mockContext.getRoot.andReturn(mockRootObject);
                        controller = new LocatorController(mockScope, mockTimeout, mockObjectService);
                    });

                it("adds a treeModel to scope", () => {
                        expect(mockScope.treeModel).toBeDefined();
                    });

                it("watches for changes to treeModel", () => {
                        // This is what the embedded tree representation
                        // will be modifying.
                        expect(mockScope.$watch).toHaveBeenCalledWith(
                            "treeModel.selectedObject",
                            jasmine.any(Function)
                        );
                    });

                it("changes its own model on embedded model updates", () => {
                        // Need to pass on selection changes as updates to
                        // the control's value
                        mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockScope.ngModel.someField).toEqual(mockDomainObject);
                        expect(mockScope.rootObject).toEqual(mockRootObject);

                        // Verify that the capability we expect to have been used
                        // was used.
                        expect(mockDomainObject.getCapability)
                            .toHaveBeenCalledWith("context");
                    });

                it("rejects changes which fail validation", () => {
                        mockScope.structure = { validate: jasmine.createSpy('validate') };
                        mockScope.structure.validate.andReturn(false);

                        // Pass selection change
                        mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                        mockTimeout.mostRecentCall.args[0]();

                        expect(mockScope.structure.validate).toHaveBeenCalled();
                        // Change should have been rejected
                        expect(mockScope.ngModel.someField).not.toEqual(mockDomainObject);
                    });

                it("treats a lack of a selection as invalid", () => {
                        mockScope.ngModelController = jasmine.createSpyObj(
                            'ngModelController',
                            ['$setValidity']
                        );

                        mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockScope.ngModelController.$setValidity)
                            .toHaveBeenCalledWith(jasmine.any(String), true);

                        mockScope.$watch.mostRecentCall.args[1](undefined);
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockScope.ngModelController.$setValidity)
                            .toHaveBeenCalledWith(jasmine.any(String), false);
                    });
            });
            describe("when no context is available", () => {
                let defaultRoot = "DEFAULT_ROOT";

                beforeEach( () => {
                    mockContext.getRoot.andReturn(undefined);
                    getObjectsPromise.then.andCallFake( (callback) => {
                        callback({'ROOT': defaultRoot});
                    });
                    controller = new LocatorController(mockScope, mockTimeout, mockObjectService);
                });

                it("provides a default context where none is available",  () => {
                    mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                    mockTimeout.mostRecentCall.args[0]();
                    expect(mockScope.rootObject).toBe(defaultRoot);
                });

                it("does not issue redundant requests for the root object",  () => {
                    mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                    mockTimeout.mostRecentCall.args[0]();
                    mockScope.$watch.mostRecentCall.args[1](undefined);
                    mockTimeout.mostRecentCall.args[0]();
                    mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                    mockTimeout.mostRecentCall.args[0]();
                    expect(mockObjectService.getObjects.calls.length)
                        .toEqual(1);
                });

            });
        });
    }
);
