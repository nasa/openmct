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

/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/services/LinkService',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    function (LinkService, domainObjectFactory, ControlledPromise) {
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
                        object.capabilities.type = { type: 'object' };
                        parentCandidate.id = 'xyz';
                        parentCandidate.capabilities.type = {
                            type: 'parentCandidate'
                        };
                        parentCandidate.model.composition = [];
                    });

                    it("calls policy service with correct args", function () {
                        validate();
                        expect(mockPolicyService.allow).toHaveBeenCalledWith(
                            "composition",
                            parentCandidate.capabilities.type,
                            object.capabilities.type
                        );
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
                    linkedObject,
                    parentModel,
                    parentObject,
                    mutationPromise,
                    compositionPromise,
                    persistencePromise,
                    compositionCapability,
                    persistenceCapability;

                beforeEach(function () {
                    mutationPromise = new ControlledPromise();
                    compositionPromise = new ControlledPromise();
                    persistencePromise = new ControlledPromise();
                    persistenceCapability = jasmine.createSpyObj(
                        'persistenceCapability',
                        ['persist']
                    );
                    persistenceCapability.persist.andReturn(persistencePromise);
                    compositionCapability = jasmine.createSpyObj(
                        'compositionCapability',
                        ['invoke']
                    );
                    compositionCapability.invoke.andReturn(compositionPromise);
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
                            persistence: persistenceCapability,
                            composition: compositionCapability
                        }
                    });

                    object = domainObjectFactory({
                        name: 'object',
                        id: 'xyz'
                    });

                    linkedObject = domainObjectFactory({
                        name: 'object-link',
                        id: 'xyz'
                    });

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
                    mutationPromise.resolve();
                    expect(parentObject.getCapability)
                        .toHaveBeenCalledWith('persistence');
                    expect(persistenceCapability.persist).toHaveBeenCalled();
                });

                it("returns object representing new link", function () {
                    var returnPromise, whenComplete;
                    returnPromise = linkService.perform(object, parentObject);
                    whenComplete = jasmine.createSpy('whenComplete');
                    returnPromise.then(whenComplete);

                    mutationPromise.resolve();
                    persistencePromise.resolve();
                    compositionPromise.resolve([linkedObject]);
                    expect(whenComplete).toHaveBeenCalledWith(linkedObject);
                });
            });
        });
    }
);
