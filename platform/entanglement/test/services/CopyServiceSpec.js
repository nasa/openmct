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


define(
    [
        '../../src/services/CopyService',
        '../DomainObjectFactory'
    ],
    (CopyService, domainObjectFactory) => {

        const synchronousPromise = (value) => {
            if (value && value.then) {
                return value;
            }

            let promise = {
                then: (callback) => {
                    return synchronousPromise(callback(value));
                }
            };
            spyOn(promise, 'then').andCallThrough();
            return promise;
        }

        describe("CopyService", () =>  {
            let policyService;

            beforeEach(() =>  {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
            });

            describe("validate", () =>  {

                let copyService,
                    object,
                    parentCandidate,
                    validate;

                beforeEach(() =>  {
                    copyService = new CopyService(
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
                    validate = () =>  {
                        return copyService.validate(object, parentCandidate);
                    };
                });

                it("does not allow invalid parentCandidate", () =>  {
                    parentCandidate = undefined;
                    expect(validate()).toBe(false);
                    parentCandidate = {};
                    expect(validate()).toBe(false);
                });

                it("does not allow copying into source object", () =>  {
                    object.id = parentCandidate.id = 'abc';
                    expect(validate()).toBe(false);
                });

                describe("defers to policyService", () =>  {
                    beforeEach(() =>  {
                        object.id = 'a';
                        parentCandidate.id = 'b';
                    });

                    it("calls policy service with correct args", () =>  {
                        validate();
                        expect(policyService.allow).toHaveBeenCalledWith(
                            "composition",
                            parentCandidate.capabilities.type,
                            object.capabilities.type
                        );
                    });

                    it("and returns false", () =>  {
                        policyService.allow.andReturn(false);
                        expect(validate()).toBe(false);
                    });

                    it("and returns true", () =>  {
                        policyService.allow.andReturn(true);
                        expect(validate()).toBe(true);
                    });
                });
            });

            describe("perform", () =>  {

                let mockQ,
                    mockDeferred,
                    createObjectPromise,
                    copyService,
                    object,
                    newParent,
                    copyResult,
                    copyFinished,
                    persistObjectPromise,
                    persistenceCapability,
                    instantiationCapability,
                    compositionCapability,
                    locationCapability,
                    resolvedValue;

                beforeEach(() =>  {
                    createObjectPromise = synchronousPromise(undefined);
                    policyService.allow.andReturn(true);

                    persistObjectPromise = synchronousPromise(undefined);

                    instantiationCapability = jasmine.createSpyObj(
                        "instantiation",
                        ["invoke"]
                    );

                    persistenceCapability = jasmine.createSpyObj(
                        "persistenceCapability",
                        ["persist", "getSpace"]
                    );
                    persistenceCapability.persist.andReturn(persistObjectPromise);

                    compositionCapability = jasmine.createSpyObj(
                        'compositionCapability',
                        ['invoke', 'add']
                    );
                    compositionCapability.add.andCallFake(synchronousPromise);

                    locationCapability = jasmine.createSpyObj(
                        'locationCapability',
                        ['isLink']
                    );
                    locationCapability.isLink.andReturn(false);

                    mockDeferred = jasmine.createSpyObj(
                        'mockDeferred',
                        ['notify', 'resolve', 'reject']
                    );
                    mockDeferred.notify.andCallFake(() =>  {});
                    mockDeferred.resolve.andCallFake( (value) => {
                        resolvedValue = value;
                    });
                    mockDeferred.promise = {
                        then: (callback) => {
                            return synchronousPromise(callback(resolvedValue));
                        }
                    };

                    mockQ = jasmine.createSpyObj(
                        'mockQ',
                        ['when', 'all', 'reject', 'defer']
                    );
                    mockQ.reject.andReturn(synchronousPromise(undefined));
                    mockQ.when.andCallFake(synchronousPromise);
                    mockQ.all.andCallFake( (promises) => {
                        let result = {};
                        Object.keys(promises).forEach( (k) => {
                            promises[k].then( (v) => {
                                result[k] = v;
                            });
                        });
                        return synchronousPromise(result);
                    });
                    mockQ.defer.andReturn(mockDeferred);

                });

                describe("on domain object without composition", () =>  {
                    beforeEach(() =>  {
                        let objectCopy;

                        newParent = domainObjectFactory({
                            name: 'newParent',
                            id: '456',
                            model: {
                                composition: []
                            },
                            capabilities: {
                                instantiation: instantiationCapability,
                                persistence: persistenceCapability,
                                composition: compositionCapability
                            }
                        });

                        object = domainObjectFactory({
                            name: 'object',
                            id: 'abc',
                            model: {
                                name: 'some object',
                                location: '456',
                                someOtherAttribute: 'some other value',
                                embeddedObjectAttribute: {
                                    name: 'Some embedded object'
                                }
                            },
                            capabilities: {
                                persistence: persistenceCapability
                            }
                        });

                        objectCopy = domainObjectFactory({
                            name: 'object',
                            id: 'abc.copy.fdgdfgdf',
                            capabilities: {
                                persistence: persistenceCapability,
                                location: locationCapability
                            }
                        });

                        instantiationCapability.invoke.andCallFake(
                             (model) => {
                                objectCopy.model = model;
                                return objectCopy;
                            }
                        );

                        copyService = new CopyService(mockQ, policyService);
                        copyResult = copyService.perform(object, newParent);
                        copyFinished = jasmine.createSpy('copyFinished');
                        copyResult.then(copyFinished);
                    });

                    it("uses persistence capability", () =>  {
                        expect(persistenceCapability.persist)
                            .toHaveBeenCalled();
                    });

                    it("deep clones object model", () =>  {
                        let newModel = copyFinished.calls[0].args[0].getModel();
                        expect(newModel).toEqual(object.model);
                        expect(newModel).not.toBe(object.model);
                    });

                    it("returns a promise", () =>  {
                        expect(copyResult).toBeDefined();
                        expect(copyFinished).toHaveBeenCalled();
                    });

                });

                describe("on domainObject with composition", () =>  {
                    let childObject,
                        objectClone,
                        childObjectClone,
                        compositionPromise;

                    beforeEach(() =>  {
                        let invocationCount = 0,
                            objectClones;

                        instantiationCapability.invoke.andCallFake(
                            function (model) {
                                let cloneToReturn = objectClones[invocationCount++];
                                cloneToReturn.model = model;
                                return cloneToReturn;
                            }
                        );

                        newParent = domainObjectFactory({
                            name: 'newParent',
                            id: '456',
                            model: {
                                composition: []
                            },
                            capabilities: {
                                instantiation: instantiationCapability,
                                persistence: persistenceCapability,
                                composition: compositionCapability
                            }
                        });

                        childObject = domainObjectFactory({
                            name: 'childObject',
                            id: 'def',
                            model: {
                                name: 'a child object',
                                location: 'abc'
                            },
                            capabilities: {
                                persistence: persistenceCapability,
                                location: locationCapability
                            }
                        });

                        childObjectClone = domainObjectFactory({
                            name: 'childObject',
                            id: 'def.clone',
                            capabilities: {
                                persistence: persistenceCapability,
                                location: locationCapability
                            }
                        });

                        compositionPromise = jasmine.createSpyObj(
                            'compositionPromise',
                            ['then']
                        );

                        compositionCapability
                            .invoke
                            .andReturn(synchronousPromise([childObject]));

                        object = domainObjectFactory({
                            name: 'some object',
                            id: 'abc',
                            model: {
                                name: 'some object',
                                composition: ['def'],
                                location: 'testLocation'
                            },
                            capabilities: {
                                instantiation: instantiationCapability,
                                composition: compositionCapability,
                                location: locationCapability,
                                persistence: persistenceCapability
                            }
                        });

                        objectClone = domainObjectFactory({
                            name: 'some object',
                            id: 'abc.clone',
                            capabilities: {
                                instantiation: instantiationCapability,
                                composition: compositionCapability,
                                location: locationCapability,
                                persistence: persistenceCapability
                            }
                        });

                        objectClones = [objectClone, childObjectClone];

                        copyService = new CopyService(mockQ, policyService);
                    });

                    describe("the cloning process", () =>  {
                        beforeEach(() =>  {
                            copyResult = copyService.perform(object, newParent);
                            copyFinished = jasmine.createSpy('copyFinished');
                            copyResult.then(copyFinished);
                        });

                        it("returns a promise", () =>  {
                            expect(copyResult.then).toBeDefined();
                            expect(copyFinished).toHaveBeenCalled();
                        });

                        it("returns a promise", () =>  {
                            expect(copyResult.then).toBeDefined();
                            expect(copyFinished).toHaveBeenCalled();
                        });

                        it ("correctly locates cloned objects", () =>  {
                            expect(childObjectClone.getModel().location).toEqual(objectClone.getId());
                        });
                    });

                    describe("when cloning non-creatable objects", () =>  {
                        beforeEach(() =>  {
                            policyService.allow.andCallFake( (category) => {
                                //Return false for 'creation' policy
                                return category !== 'creation';
                            });

                            copyResult = copyService.perform(object, newParent);
                            copyFinished = jasmine.createSpy('copyFinished');
                            copyResult.then(copyFinished);
                        });
                        it ("creates link instead of clone", () =>  {
                            let copiedObject = copyFinished.calls[0].args[0];
                            expect(copiedObject).toBe(object);
                            expect(compositionCapability.add)
                                .toHaveBeenCalledWith(copiedObject);
                        });
                    });

                    describe("when provided a filtering function", () =>  {
                        const accept = () => {
                            return true;
                        }
                        const reject = () => {
                            return false;
                        }

                        it("does not create new instances of objects " +
                            "rejected by the filter", () =>  {
                            copyService.perform(object, newParent, reject)
                                .then(copyFinished);
                            expect(copyFinished.mostRecentCall.args[0])
                                .toBe(object);
                        });

                        it("does create new instances of objects " +
                            "accepted by the filter", () =>  {
                            copyService.perform(object, newParent, accept)
                                .then(copyFinished);
                            expect(copyFinished.mostRecentCall.args[0])
                                .not.toBe(object);
                        });
                    });
                });

                describe("on invalid inputs", () =>  {
                    beforeEach(() =>  {
                        object = domainObjectFactory({
                            name: 'object',
                            capabilities: {
                                type: { type: 'object' },
                                location: locationCapability,
                                persistence: persistenceCapability
                            }
                        });

                        newParent = domainObjectFactory({
                            name: 'parentCandidate',
                            capabilities: {
                                type: { type: 'parentCandidate' },
                                instantiation: instantiationCapability,
                                composition: compositionCapability,
                                persistence: persistenceCapability
                            }
                        });

                        instantiationCapability.invoke.andReturn(object);
                    });

                    it("throws an error", () =>  {
                        let service =
                            new CopyService(mockQ, policyService);

                        const perform = () => {
                            service.perform(object, newParent);
                        }

                        spyOn(service, "validate");
                        service.validate.andReturn(true);
                        expect(perform).not.toThrow();
                        service.validate.andReturn(false);
                        expect(perform).toThrow();
                    });
                });

            });
        });
    }
);
