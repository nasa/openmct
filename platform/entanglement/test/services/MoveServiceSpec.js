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
        '../../src/services/MoveService',
        '../services/MockLinkService',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    function (
        MoveService,
        MockLinkService,
        domainObjectFactory,
        ControlledPromise
    ) {
        "use strict";

        describe("MoveService", function () {

            var moveService,
                policyService,
                linkService;

            beforeEach(function () {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                linkService = new MockLinkService();
                moveService = new MoveService(policyService, linkService);
            });

            describe("validate", function () {
                var object,
                    objectContextCapability,
                    currentParent,
                    parentCandidate,
                    validate;

                beforeEach(function () {

                    objectContextCapability = jasmine.createSpyObj(
                        'objectContextCapability',
                        [
                            'getParent'
                        ]
                    );

                    object = domainObjectFactory({
                        name: 'object',
                        id: 'a',
                        capabilities: {
                            context: objectContextCapability,
                            type: { type: 'object' }
                        }
                    });

                    currentParent = domainObjectFactory({
                        name: 'currentParent',
                        id: 'b'
                    });

                    objectContextCapability.getParent.andReturn(currentParent);

                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate',
                        model: { composition: [] },
                        id: 'c',
                        capabilities: {
                            type: { type: 'parentCandidate' }
                        }
                    });

                    validate = function () {
                        return moveService.validate(object, parentCandidate);
                    };
                });

                it("does not allow an invalid parent", function () {
                    parentCandidate = undefined;
                    expect(validate()).toBe(false);
                    parentCandidate = {};
                    expect(validate()).toBe(false);
                });

                it("does not allow moving to current parent", function () {
                    parentCandidate.id = currentParent.id = 'xyz';
                    expect(validate()).toBe(false);
                });

                it("does not allow moving to self", function () {
                    object.id = parentCandidate.id = 'xyz';
                    expect(validate()).toBe(false);
                });

                it("does not allow moving to the same location", function () {
                    object.id = 'abc';
                    parentCandidate.model.composition = ['abc'];
                    expect(validate()).toBe(false);
                });

                describe("defers to policyService", function () {

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

                var object,
                    newParent,
                    actionCapability,
                    locationCapability,
                    persistenceCapability,
                    persistencePromise,
                    mutationPromise,
                    moveResult;

                beforeEach(function () {
                    actionCapability = jasmine.createSpyObj(
                        'actionCapability',
                        ['perform']
                    );

                    locationCapability = jasmine.createSpyObj(
                        'locationCapability',
                        [
                            'isOriginal',
                            'getLocation'
                        ]
                    );

                    persistenceCapability = jasmine.createSpyObj(
                        'persistenceCapability',
                        ['persist']
                    );

                    persistencePromise = new ControlledPromise();
                    persistenceCapability.persist.andReturn(persistencePromise);

                    mutationPromise = new ControlledPromise();

                    object = domainObjectFactory({
                        name: 'object',
                        capabilities: {
                            action: actionCapability,
                            mutation: {
                                invoke: function (mutator) {
                                    mutator(object.model);
                                    return mutationPromise;
                                }
                            },
                            persistence: persistenceCapability,
                            location: locationCapability
                        },
                        model: {
                            location: 'otherThing'
                        }
                    });

                    moveResult = moveService.perform(object, newParent);
                });

                it("links object to newParent", function () {
                    expect(linkService.perform).toHaveBeenCalledWith(
                        object,
                        newParent
                    );
                });

                it("waits for result of link", function () {
                    expect(linkService.perform.mostRecentCall.promise.then)
                        .toHaveBeenCalledWith(jasmine.any(Function));
                });

                it("removes object when link is completed", function () {
                    linkService.perform.mostRecentCall.promise.resolve();
                    expect(object.getCapability)
                        .toHaveBeenCalledWith('action');
                    expect(actionCapability.perform)
                        .toHaveBeenCalledWith('remove');
                });

                describe("when moving an original", function() {
                    beforeEach(function () {
                        locationCapability.isOriginal.andReturn(true);
                        locationCapability.getLocation.andReturn('newParent');
                        linkService.perform.mostRecentCall.promise.resolve();
                    });

                    it("updates location", function() {
                       expect(object.model.location).toBe('newParent');
                    });
                    it("persists new model when mutation completes", function() {
                        mutationPromise.resolve();
                        expect(persistenceCapability.persist)
                            .toHaveBeenCalled();
                    });
                });

                describe("when moving a link", function() {
                    beforeEach(function () {
                        locationCapability.isOriginal.andReturn(false);
                        locationCapability.getLocation.andReturn('newParent');
                        linkService.perform.mostRecentCall.promise.resolve();
                    });
                    it("does not modify location", function() {
                        expect(object.model.location).toBe('otherThing');
                    });
                    it("does not call persistence", function() {
                        expect(persistenceCapability.persist)
                            .not
                            .toHaveBeenCalled();
                    });
                });

                describe("when moving an object with children", function() {

                    var children;

                    beforeEach(function () {

                        var instantMutator = function (index) {
                            return {
                                invoke: function (mutator) {
                                    mutator(children[index].model);
                                    return {
                                        then: function(callback) {
                                            callback();
                                        }
                                    };
                                }
                            };
                        };

                        children = [
                            domainObjectFactory({
                                id: 'childa',
                                capabilities: {
                                    location: jasmine.createSpyObj(
                                        'childalocation',
                                        ['isOriginal', 'getLocation']
                                    ),
                                    mutation: instantMutator(0)
                                },
                                model: {
                                    location: 'childa-old-location'
                                }
                            }),
                            domainObjectFactory({
                                id: 'childb',
                                capabilities: {
                                    location: jasmine.createSpyObj(
                                        'childblocation',
                                        ['isOriginal', 'getLocation']
                                    ),
                                    mutation: instantMutator(1)
                                },
                                model: {
                                    location: 'childb-old-location'
                                }
                            }),
                            domainObjectFactory({
                                id: 'childc',
                                capabilities: {
                                    location: jasmine.createSpyObj(
                                        'childclocation',
                                        ['isOriginal', 'getLocation']
                                    ),
                                    mutation: instantMutator(2)
                                },
                                model: {
                                    location: 'childc-old-location'
                                }
                            })
                        ];

                        children[0].capabilities.location.isOriginal.andReturn(true);
                        children[0].capabilities.location.getLocation.andReturn('childalocation');
                        children[1].capabilities.location.isOriginal.andReturn(true);
                        children[1].capabilities.location.getLocation.andReturn('childblocation');
                        children[2].capabilities.location.isOriginal.andReturn(false);
                        children[2].capabilities.location.getLocation.andReturn('childclocation');

                        object.capabilities.composition = {
                            invoke: function () {
                                return {
                                    then: function (callback) {
                                        callback(children);
                                    }
                                };
                            }
                        };
                        linkService.perform.mostRecentCall.promise.resolve();
                    });


                    it("recursively updates the location of originals", function () {
                        expect(children[0].model.location).toBe('childalocation');
                        expect(children[1].model.location).toBe('childblocation');
                        expect(children[2].model.location).toBe('childc-old-location');
                    });
                });
            });
        });
    }
);
