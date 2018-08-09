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
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/LocatorController"],
    function (LocatorController) {

        describe("The locator controller", function () {
            var mockScope,
                mockTimeout,
                mockDomainObject,
                mockFolderObject,
                mockRootObject,
                mockContext,
                mockActions,
                mockObjectService,
                mockTypeService,
                mockType,
                mockInstantiate,
                mockPolicyService,
                getObjectsPromise,
                testModel,
                capabilities,
                mockCreateNewFolderAction,
                mockActionCapability,
                mockProperties,
                controller;

            beforeEach(function () {
                
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$watch"]
                );
                mockTimeout = jasmine.createSpy("$timeout");
                mockInstantiate = jasmine.createSpy("instantiate");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "useCapability",
                        "getModel",
                        "getCapability"
                    ]
                );
                mockFolderObject = jasmine.createSpyObj(
                    "folderObject",
                    [
                        "useCapability",
                        "getModel",
                        "getCapability"
                    ]
                );
                mockCreateNewFolderAction = jasmine.createSpyObj(
                    "createNewFolderAction",
                    [
                        "perform"
                    ]
                );
                mockRootObject = jasmine.createSpyObj(
                    "rootObject",
                    ["getCapability"]
                );
                mockActionCapability = jasmine.createSpyObj(
                    "actionCapability",
                    [
                        "getActions",
                        "perform"
                    ]
                );
                mockContext = jasmine.createSpyObj(
                    "context",
                    ["getRoot"]
                );
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    ["getObjects"]
                );
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    ["getType"]
                );
                mockPolicyService = jasmine.createSpyObj(
                    "policyService",
                    ["allow"]
                );
                getObjectsPromise = jasmine.createSpyObj(
                    "promise",
                    ["then"]
                );
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getProperties",
                        "getInitialModel"
                    ]
                );
                testModel = { someKey: "some value" };
                
                mockProperties = ['a', 'b', 'c'].map(function (k) {
                    var mockProperty = jasmine.createSpyObj(
                            'property-' + k,
                            ['propertyDefinition']
                        );
                    mockProperty.propertyDefinition = {
                            key: "name",
                            pattern: "test"
                        }
                    return mockProperty;
                });
                
                capabilities = {
                    "action" : mockActionCapability,
                    "context": mockContext
                };
                
                mockActions = [mockCreateNewFolderAction];
                
                mockContext.getRoot.and.returnValue(mockRootObject);
                mockObjectService.getObjects.and.returnValue(getObjectsPromise);
                mockTypeService.getType.and.callFake(function (typename) {
                    return mockType;
                });
                mockInstantiate.and.returnValue(mockFolderObject)
                mockType.getKey.and.returnValue("test");
                mockType.getInitialModel.and.returnValue(testModel);
                mockType.getProperties.and.returnValue(mockProperties);
                mockDomainObject.getCapability.and.callFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.useCapability.and.returnValue();
                mockDomainObject.getModel.and.returnValue(testModel);
                mockFolderObject.getCapability.and.returnValue(capabilities);
                mockFolderObject.useCapability.and.returnValue();
                mockFolderObject.getModel.and.returnValue(testModel);
                mockScope.ngModel = {};
                mockScope.field = "someField";

                controller = new LocatorController(mockScope, mockTimeout, mockObjectService, mockTypeService, mockPolicyService, mockInstantiate);
            });
            describe("when context is available", function () {

                beforeEach(function () {
                        mockContext.getRoot.and.returnValue(mockRootObject);
                        controller = new LocatorController(mockScope, mockTimeout, mockObjectService, mockTypeService, mockPolicyService, mockInstantiate);
                    });

                it("adds a treeModel to scope", function () {
                        expect(mockScope.treeModel).toBeDefined();
                    });

                it("watches for changes to treeModel", function () {
                        // This is what the embedded tree representation
                        // will be modifying.
                        expect(mockScope.$watch).toHaveBeenCalledWith(
                            "treeModel.selectedObject",
                            jasmine.any(Function)
                        );
                    });

                it("changes its own model on embedded model updates", function () {
                        // Need to pass on selection changes as updates to
                        // the control's value
                        mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                        mockTimeout.calls.mostRecent().args[0]();
                        expect(mockScope.ngModel.someField).toEqual(mockDomainObject);
                        expect(mockScope.rootObject).toEqual(mockRootObject);

                        // Verify that the capability we expect to have been used
                        // was used.
                        expect(mockDomainObject.getCapability)
                            .toHaveBeenCalledWith("context");
                    });

                it("rejects changes which fail validation", function () {
                        mockScope.structure = { validate: jasmine.createSpy('validate') };
                        mockScope.structure.validate.and.returnValue(false);

                        // Pass selection change
                        mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                        mockTimeout.calls.mostRecent().args[0]();

                        expect(mockScope.structure.validate).toHaveBeenCalled();
                        // Change should have been rejected
                        expect(mockScope.ngModel.someField).not.toEqual(mockDomainObject);
                    });

                it("treats a lack of a selection as invalid", function () {
                        mockScope.ngModelController = jasmine.createSpyObj(
                            'ngModelController',
                            ['$setValidity']
                        );

                        mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                        mockTimeout.calls.mostRecent().args[0]();
                        expect(mockScope.ngModelController.$setValidity)
                            .toHaveBeenCalledWith(jasmine.any(String), true);

                        mockScope.$watch.calls.mostRecent().args[1](undefined);
                        mockTimeout.calls.mostRecent().args[0]();
                        expect(mockScope.ngModelController.$setValidity)
                            .toHaveBeenCalledWith(jasmine.any(String), false);
                    });
                
                it("performs create new folder action when policy allows", function () {
                    expect(mockTypeService.getType).toHaveBeenCalledWith('folder');
                });
                    
            });
            describe("when no context is available", function () {
                var defaultRoot = "DEFAULT_ROOT";

                beforeEach(function () {
                    mockContext.getRoot.and.returnValue(undefined);
                    getObjectsPromise.then.and.callFake(function (callback) {
                        callback({'ROOT': defaultRoot});
                    });
                    controller = new LocatorController(mockScope, mockTimeout, mockObjectService, mockTypeService, mockPolicyService, mockInstantiate);
                });

                it("provides a default context where none is available", function () {
                    mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                    mockTimeout.calls.mostRecent().args[0]();
                    expect(mockScope.rootObject).toBe(defaultRoot);
                });

                it("does not issue redundant requests for the root object", function () {
                    mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                    mockTimeout.calls.mostRecent().args[0]();
                    mockScope.$watch.calls.mostRecent().args[1](undefined);
                    mockTimeout.calls.mostRecent().args[0]();
                    mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                    mockTimeout.calls.mostRecent().args[0]();
                    expect(mockObjectService.getObjects.calls.count())
                        .toEqual(1);
                });

            });
            describe("when new folder can be created", function () {
                beforeEach( function() {
                    mockContext.getRoot.and.returnValue(mockRootObject);
                    mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                    mockScope.validParent = true;
                    controller = new LocatorController(mockScope, mockTimeout, mockObjectService, mockTypeService, mockPolicyService, mockInstantiate);
                });
                
                it("performs create new folder action when policy allows", function () {
                    expect(mockDomainObject.getCapability.getActions).toHaveBeenCalledWith("create-new-folder");
                });
            });
            describe("when new folder cannot be created", function() {
                beforeEach( function() {
                    mockPolicyService.allow.and.returnValue(false);
                    controller = new LocatorController(mockScope, mockTimeout, mockObjectService, mockTypeService, mockPolicyService, mockInstantiate);
                });
                
                it("Does not perform create new folder action", function () {
                    expect(mockScope.validParent).toBeFalsy;
                    expect(mockDomainObject.getCapability.getActions).not.toHaveBeenCalled();
                    expect(mockCreateNewFolderAction.perform).not.toHaveBeenCalled();
                });
                
            });
            });
    }
);
