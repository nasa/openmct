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
            describe("validate", function () {

                var policyService,
                    copyService,
                    object,
                    parentCandidate,
                    validate;

                beforeEach(function () {
                    policyService = jasmine.createSpyObj(
                        'policyService',
                        ['allow']
                    );
                    copyService = new CopyService(
                        null,
                        null,
                        policyService
                    );
                    object = domainObjectFactory({
                        name: 'object'
                    });
                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate'
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
                        copyService = new CopyService(null, creationService);
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
                    var childObject,
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
                        copyService = new CopyService(mockQ, creationService);
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
