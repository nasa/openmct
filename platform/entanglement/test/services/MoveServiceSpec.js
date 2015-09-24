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
                object,
                objectContextCapability,
                currentParent,
                parentCandidate,
                linkService;

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
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                linkService = new MockLinkService();
                policyService.allow.andReturn(true);
                moveService = new MoveService(policyService, linkService);
            });

            describe("validate", function () {
                var validate;

                beforeEach(function () {
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

                var actionCapability,
                    locationCapability,
                    locationPromise,
                    newParent,
                    moveResult;

                beforeEach(function () {
                    newParent = parentCandidate;

                    actionCapability = jasmine.createSpyObj(
                        'actionCapability',
                        ['perform']
                    );

                    locationCapability = jasmine.createSpyObj(
                        'locationCapability',
                        [
                            'isOriginal',
                            'setPrimaryLocation',
                            'getContextualLocation'
                        ]
                    );

                    locationPromise = new ControlledPromise();
                    locationCapability.setPrimaryLocation
                        .andReturn(locationPromise);

                    object = domainObjectFactory({
                        name: 'object',
                        capabilities: {
                            action: actionCapability,
                            location: locationCapability,
                            context: objectContextCapability,
                            type: { type: 'object' }
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

                it("throws an error when performed on invalid inputs", function () {
                    function perform() {
                        moveService.perform(object, newParent);
                    }

                    spyOn(moveService, "validate");
                    moveService.validate.andReturn(true);
                    expect(perform).not.toThrow();
                    moveService.validate.andReturn(false);
                    expect(perform).toThrow();
                });

                describe("when moving an original", function () {
                    beforeEach(function () {
                        locationCapability.getContextualLocation
                            .andReturn('new-location');
                        locationCapability.isOriginal.andReturn(true);
                        linkService.perform.mostRecentCall.promise.resolve();
                    });

                    it("updates location", function () {
                        expect(locationCapability.setPrimaryLocation)
                            .toHaveBeenCalledWith('new-location');
                    });

                    describe("after location update", function () {
                        beforeEach(function () {
                            locationPromise.resolve();
                        });

                        it("removes object from parent", function () {
                            expect(actionCapability.perform)
                                .toHaveBeenCalledWith('remove');
                        });
                    });

                });

                describe("when moving a link", function () {
                    beforeEach(function () {
                        locationCapability.isOriginal.andReturn(false);
                        linkService.perform.mostRecentCall.promise.resolve();
                    });

                    it("does not update location", function () {
                        expect(locationCapability.setPrimaryLocation)
                            .not
                            .toHaveBeenCalled();
                    });

                    it("removes object from parent", function () {
                        expect(actionCapability.perform)
                            .toHaveBeenCalledWith('remove');
                    });
                });

            });
        });
    }
);
