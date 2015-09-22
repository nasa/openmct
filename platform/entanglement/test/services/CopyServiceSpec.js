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

/*global define,describe,beforeEach,it,jasmine,expect,spyOn */

define(
    [
        '../../src/services/CopyService',
        '../DomainObjectFactory'
    ],
    function (CopyService, domainObjectFactory) {
        "use strict";

        function synchronousPromise(value) {
            var promise = {
                then: function (callback) {
                    return synchronousPromise(callback(value));
                }
            };
            spyOn(promise, 'then').andCallThrough();
            return promise;
        }

        describe("CopyService", function () {
            var policyService;

            beforeEach(function () {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                policyService.allow.andReturn(true);
            });

            describe("validate", function () {

                var copyService,
                    object,
                    parentCandidate,
                    validate;

                beforeEach(function () {
                    copyService = new CopyService(
                        null,
                        null,
                        policyService
                    );
                    object = domainObjectFactory({
                        name: 'object',
                        capabilities: {
                            type: { type: 'object' }
                        }
                    });
                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate',
                        capabilities: {
                            type: { type: 'parentCandidate' }
                        }
                    });
                    validate = function () {
                        return copyService.validate(object, parentCandidate);
                    };
                });

                it("does not allow invalid parentCandidate", function () {
                    parentCandidate = undefined;
                    expect(validate()).toBe(false);
                    parentCandidate = {};
                    expect(validate()).toBe(false);
                });

                it("does not allow copying into source object", function () {
                    object.id = parentCandidate.id = 'abc';
                    expect(validate()).toBe(false);
                });

                describe("defers to policyService", function () {
                    beforeEach(function () {
                        object.id = 'a';
                        parentCandidate.id = 'b';
                    });

                    it("calls policy service with correct args", function () {
                        validate();
                        expect(policyService.allow).toHaveBeenCalledWith(
                            "composition",
                            parentCandidate.capabilities.type,
                            object.capabilities.type
                        );
                    });

                    it("and returns false", function () {
                        policyService.allow.andReturn(false);
                        expect(validate()).toBe(false);
                    });

                    it("and returns true", function () {
                        policyService.allow.andReturn(true);
                        expect(validate()).toBe(true);
                    });
                });
            });

            describe("perform", function () {

                var mockQ,
                    creationService,
                    createObjectPromise,
                    copyService,
                    object,
                    newParent,
                    copyResult,
                    copyFinished;

                describe("on domain object without composition", function () {
                    beforeEach(function () {
                        object = domainObjectFactory({
                            name: 'object',
                            id: 'abc',
                            model: {
                                name: 'some object'
                            }
                        });
                        newParent = domainObjectFactory({
                            name: 'newParent',
                            id: '456',
                            model: {
                                composition: []
                            }
                        });
                        creationService = jasmine.createSpyObj(
                            'creationService',
                            ['createObject']
                        );
                        createObjectPromise = synchronousPromise(undefined);
                        creationService.createObject.andReturn(createObjectPromise);
                        copyService = new CopyService(null, creationService, policyService);
                        copyResult = copyService.perform(object, newParent);
                        copyFinished = jasmine.createSpy('copyFinished');
                        copyResult.then(copyFinished);
                    });

                    it("uses creation service", function () {
                        expect(creationService.createObject)
                            .toHaveBeenCalledWith(jasmine.any(Object), newParent);

                        expect(createObjectPromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("deep clones object model", function () {
                        var newModel = creationService
                            .createObject
                            .mostRecentCall
                            .args[0];

                        expect(newModel).toEqual(object.model);
                        expect(newModel).not.toBe(object.model);
                    });

                    it("returns a promise", function () {
                        expect(copyResult).toBeDefined();
                        expect(copyFinished).toHaveBeenCalled();
                    });

                });

                describe("on domainObject with composition", function () {
                    var newObject,
                        childObject,
                        compositionCapability,
                        compositionPromise;

                    beforeEach(function () {
                        mockQ = jasmine.createSpyObj('mockQ', ['when']);
                        mockQ.when.andCallFake(synchronousPromise);
                        childObject = domainObjectFactory({
                            name: 'childObject',
                            id: 'def',
                            model: {
                                name: 'a child object'
                            }
                        });
                        compositionCapability = jasmine.createSpyObj(
                            'compositionCapability',
                            ['invoke']
                        );
                        compositionPromise = jasmine.createSpyObj(
                            'compositionPromise',
                            ['then']
                        );
                        compositionCapability
                            .invoke
                            .andReturn(compositionPromise);
                        object = domainObjectFactory({
                            name: 'object',
                            id: 'abc',
                            model: {
                                name: 'some object',
                                composition: ['def']
                            },
                            capabilities: {
                                composition: compositionCapability
                            }
                        });
                        newObject = domainObjectFactory({
                            name: 'object',
                            id: 'abc2',
                            model: {
                                name: 'some object',
                                composition: []
                            },
                            capabilities: {
                                composition: compositionCapability
                            }
                        });
                        newParent = domainObjectFactory({
                            name: 'newParent',
                            id: '456',
                            model: {
                                composition: []
                            }
                        });
                        creationService = jasmine.createSpyObj(
                            'creationService',
                            ['createObject']
                        );
                        policyService.allow.andReturn(true);

                        createObjectPromise = synchronousPromise(newObject);
                        creationService.createObject.andReturn(createObjectPromise);
                        copyService = new CopyService(mockQ, creationService, policyService);
                        copyResult = copyService.perform(object, newParent);
                        copyFinished = jasmine.createSpy('copyFinished');
                        copyResult.then(copyFinished);
                    });

                    it("uses creation service", function () {
                        expect(creationService.createObject)
                            .toHaveBeenCalledWith(jasmine.any(Object), newParent);

                        expect(createObjectPromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("clears model composition", function () {
                        var newModel = creationService
                            .createObject
                            .mostRecentCall
                            .args[0];

                        expect(newModel.composition.length).toBe(0);
                        expect(newModel.name).toBe('some object');
                    });

                    it("recursively clones it's children", function () {
                        expect(creationService.createObject.calls.length).toBe(1);
                        expect(compositionCapability.invoke).toHaveBeenCalled();
                        compositionPromise.then.mostRecentCall.args[0]([childObject]);
                        expect(creationService.createObject.calls.length).toBe(2);
                    });

                    it("returns a promise", function () {
                        expect(copyResult.then).toBeDefined();
                        expect(copyFinished).toHaveBeenCalled();
                    });
                });

            });
        });
    }
);
