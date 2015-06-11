/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/services/LinkService',
        '../DomainObjectFactory'
    ],
    function (LinkService, domainObjectFactory) {
        "use strict";

        describe("LinkService", function () {

            var linkService,
                mockPolicyService;

            beforeEach(function () {
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                linkService = new LinkService(mockPolicyService);
            });

            describe("validate", function () {

                var object,
                    parentCandidate,
                    validate;

                beforeEach(function () {

                    object = domainObjectFactory({
                        name: 'object'
                    });
                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate'
                    });
                    validate = function () {
                        return linkService.validate(object, parentCandidate);
                    };
                });

                it("does not allow invalid parentCandidate", function () {
                    parentCandidate = undefined;
                    expect(validate()).toBe(false);
                    parentCandidate = {};
                    expect(validate()).toBe(false);
                });

                it("does not allow parent to be object", function () {
                    parentCandidate.id = object.id = 'abc';
                    expect(validate()).toBe(false);
                });

                it("does not allow parent that contains object", function () {
                    object.id = 'abc';
                    parentCandidate.id = 'xyz';
                    parentCandidate.model.composition = ['abc'];
                    expect(validate()).toBe(false);
                });

                describe("defers to policyService", function () {
                    beforeEach(function () {
                        object.id = 'abc';
                        parentCandidate.id = 'xyz';
                        parentCandidate.model.composition = [];
                    });

                    it("and returns false", function () {
                        mockPolicyService.allow.andReturn(true);
                        expect(validate()).toBe(true);
                        expect(mockPolicyService.allow).toHaveBeenCalled();
                    });

                    it("and returns true", function () {
                        mockPolicyService.allow.andReturn(false);
                        expect(validate()).toBe(false);
                        expect(mockPolicyService.allow).toHaveBeenCalled();
                    });
                });
            });

            describe("perform", function () {

                var object,
                    parentModel,
                    parentObject,
                    mutationPromise,
                    persistenceCapability;

                beforeEach(function () {
                    mutationPromise = jasmine.createSpyObj(
                        'promise',
                        ['then']
                    );
                    persistenceCapability = jasmine.createSpyObj(
                        'persistenceCapability',
                        ['persist']
                    );
                    parentModel = {
                        composition: []
                    };
                    parentObject = domainObjectFactory({
                        name: 'parentObject',
                        model: parentModel,
                        capabilities: {
                            mutation: {
                                invoke: function (mutator) {
                                    mutator(parentModel);
                                    return mutationPromise;
                                }
                            },
                            persistence: persistenceCapability
                        }
                    });

                    object = domainObjectFactory({
                        name: 'object',
                        id: 'xyz'
                    });

                    parentObject.getCapability.andReturn(persistenceCapability);
                });


                it("modifies parent model composition", function () {
                    expect(parentModel.composition.length).toBe(0);
                    linkService.perform(object, parentObject);
                    expect(parentObject.useCapability).toHaveBeenCalledWith(
                        'mutation',
                        jasmine.any(Function)
                    );
                    expect(parentModel.composition).toContain('xyz');
                });

                it("persists parent", function () {
                    linkService.perform(object, parentObject);
                    expect(mutationPromise.then).toHaveBeenCalled();
                    mutationPromise.then.calls[0].args[0]();
                    expect(parentObject.getCapability)
                        .toHaveBeenCalledWith('persistence');

                    expect(persistenceCapability.persist).toHaveBeenCalled();
                });
            });
        });
    }
);
