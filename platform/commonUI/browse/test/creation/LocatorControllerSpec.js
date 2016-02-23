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
    ["../../src/creation/LocatorController"],
    function (LocatorController) {
        "use strict";

        describe("The locator controller", function () {
            var mockScope,
                mockTimeout,
                mockDomainObject,
                mockRootObject,
                mockContext,
                mockObjectService,
                getObjectsPromise,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch" ]
                );
                mockTimeout = jasmine.createSpy("$timeout");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability" ]
                );
                mockRootObject = jasmine.createSpyObj(
                    "rootObject",
                    [ "getCapability" ]
                );
                mockContext = jasmine.createSpyObj(
                    "context",
                    [ "getRoot" ]
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
                describe("when context is available", function () {

                    beforeEach(function () {
                        mockContext.getRoot.andReturn(mockRootObject);
                        controller = new LocatorController(mockScope, mockTimeout, mockObjectService);
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
                        mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockScope.ngModel.someField).toEqual(mockDomainObject);
                        expect(mockScope.rootObject).toEqual(mockRootObject);

                        // Verify that the capability we expect to have been used
                        // was used.
                        expect(mockDomainObject.getCapability)
                            .toHaveBeenCalledWith("context");
                    });

                    it("rejects changes which fail validation", function () {
                        mockScope.structure = { validate: jasmine.createSpy('validate') };
                        mockScope.structure.validate.andReturn(false);

                        // Pass selection change
                        mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                        mockTimeout.mostRecentCall.args[0]();

                        expect(mockScope.structure.validate).toHaveBeenCalled();
                        // Change should have been rejected
                        expect(mockScope.ngModel.someField).not.toEqual(mockDomainObject);
                    });

                    it("treats a lack of a selection as invalid", function () {
                        mockScope.ngModelController = jasmine.createSpyObj(
                            'ngModelController',
                            [ '$setValidity' ]
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
                describe("when no context is available", function () {
                    var defaultRoot = "DEFAULT_ROOT";

                    beforeEach(function () {
                        mockContext.getRoot.andReturn(undefined);
                        getObjectsPromise.then.andCallFake(function(callback){
                            callback({'ROOT':defaultRoot});
                        });
                        controller = new LocatorController(mockScope, mockTimeout, mockObjectService);
                    });

                    it("provides a default context where none is available", function () {
                        mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockScope.rootObject).toBe(defaultRoot);

                    });
                });
        });
    }
);
