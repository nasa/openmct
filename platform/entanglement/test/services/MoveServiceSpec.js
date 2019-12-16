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

        xdescribe("MoveService", function () {

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

                objectContextCapability.getParent.and.returnValue(currentParent);

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
                policyService.allow.and.returnValue(true);
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
                            parentCandidate,
                            object
                        );
                    });

                    it("and returns false", function () {
                        policyService.allow.and.returnValue(false);
                        expect(validate()).toBe(false);
                    });

                    it("and returns true", function () {
                        policyService.allow.and.returnValue(true);
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
                        .and.returnValue(locationPromise);

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

                it("returns a promise", function () {
                    expect(moveResult.then).toEqual(jasmine.any(Function));
                });

                it("waits for result of link", function () {
                    expect(linkService.perform.calls.mostRecent().promise.then)
                        .toHaveBeenCalledWith(jasmine.any(Function));
                });

                it("throws an error when performed on invalid inputs", function () {
                    function perform() {
                        moveService.perform(object, newParent);
                    }

                    spyOn(moveService, "validate");
                    moveService.validate.and.returnValue(true);
                    expect(perform).not.toThrow();
                    moveService.validate.and.returnValue(false);
                    expect(perform).toThrow();
                });

                describe("when moving an original", function () {
                    beforeEach(function () {
                        locationCapability.getContextualLocation
                            .and.returnValue('new-location');
                        locationCapability.isOriginal.and.returnValue(true);
                        linkService.perform.calls.mostRecent().promise.resolve();
                    });

                    it("updates location", function () {
                        expect(locationCapability.setPrimaryLocation)
                            .toHaveBeenCalledWith('new-location');
                    });

                    describe("after location update", function () {
                        beforeEach(function () {
                            locationPromise.resolve();
                        });

                        it("removes object from parent without user warning dialog", function () {
                            expect(actionCapability.perform)
                                .toHaveBeenCalledWith('remove', true);
                        });

                    });

                });

                describe("when moving a link", function () {
                    beforeEach(function () {
                        locationCapability.isOriginal.and.returnValue(false);
                        linkService.perform.calls.mostRecent().promise.resolve();
                    });

                    it("does not update location", function () {
                        expect(locationCapability.setPrimaryLocation)
                            .not
                            .toHaveBeenCalled();
                    });

                    it("removes object from parent without user warning dialog", function () {
                        expect(actionCapability.perform)
                            .toHaveBeenCalledWith('remove', true);
                    });
                });

            });
        });
    }
);
