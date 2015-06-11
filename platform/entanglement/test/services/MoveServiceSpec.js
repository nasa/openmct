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
        '../DomainObjectFactory'
    ],
    function (MoveService, MockLinkService, domainObjectFactory) {
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
                            context: objectContextCapability
                        }
                    });

                    currentParent = domainObjectFactory({
                        name: 'currentParent',
                        id: 'b'
                    });

                    objectContextCapability.getParent.andReturn(currentParent);

                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate',
                        model: {composition: []},
                        id: 'c'
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
                    parentObject,
                    actionCapability;

                beforeEach(function () {
                    actionCapability = jasmine.createSpyObj(
                        'actionCapability',
                        ['perform']
                    );

                    object = domainObjectFactory({
                        name: 'object',
                        capabilities: {
                            action: actionCapability
                        }
                    });

                    parentObject = domainObjectFactory({
                        name: 'parentObject'
                    });

                    moveService.perform(object, parentObject);
                });

                it("links object to parentObject", function () {
                    expect(linkService.perform).toHaveBeenCalledWith(
                        object,
                        parentObject
                    );
                });

                it("waits for result of link", function () {
                    expect(linkService.perform.mostRecentCall.promise.then)
                        .toHaveBeenCalledWith(jasmine.any(Function));
                });

                it("removes object when link is completed", function () {
                    linkService.perform.mostRecentCall.resolve();
                    expect(object.getCapability)
                        .toHaveBeenCalledWith('action');
                    expect(actionCapability.perform)
                        .toHaveBeenCalledWith('remove');
                });

            });
        });
    }
);
