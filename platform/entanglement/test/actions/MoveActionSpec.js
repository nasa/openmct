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
        '../../src/actions/MoveAction',
        '../services/MockMoveService',
        '../DomainObjectFactory'
    ],
    function (MoveAction, MockMoveService, domainObjectFactory) {
        "use strict";

        describe("Move Action", function () {

            var moveAction,
                policyService,
                locationService,
                locationServicePromise,
                moveService,
                context,
                selectedObject,
                selectedObjectContextCapability,
                currentParent,
                newParent;

            beforeEach(function () {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    [ 'allow' ]
                );
                policyService.allow.andReturn(true);

                selectedObjectContextCapability = jasmine.createSpyObj(
                    'selectedObjectContextCapability',
                    [
                        'getParent'
                    ]
                );

                selectedObject = domainObjectFactory({
                    name: 'selectedObject',
                    model: {
                        name: 'selectedObject'
                    },
                    capabilities: {
                        context: selectedObjectContextCapability
                    }
                });

                currentParent = domainObjectFactory({
                    name: 'currentParent'
                });

                selectedObjectContextCapability
                    .getParent
                    .andReturn(currentParent);

                newParent = domainObjectFactory({
                    name: 'newParent'
                });

                locationService = jasmine.createSpyObj(
                    'locationService',
                    [
                        'getLocationFromUser'
                    ]
                );

                locationServicePromise = jasmine.createSpyObj(
                    'locationServicePromise',
                    [
                        'then'
                    ]
                );

                locationService
                    .getLocationFromUser
                    .andReturn(locationServicePromise);

                moveService = new MockMoveService();
            });


            describe("with context from context-action", function () {
                beforeEach(function () {
                    context = {
                        domainObject: selectedObject
                    };

                    moveAction = new MoveAction(
                        policyService,
                        locationService,
                        moveService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(moveAction).toBeDefined();
                });

                describe("when performed it", function () {
                    beforeEach(function () {
                        moveAction.perform();
                    });

                    it("prompts for location", function () {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Move selectedObject to a new location",
                                "Move To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location from user", function () {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("moves object to selected location", function () {
                        locationServicePromise
                            .then
                            .mostRecentCall
                            .args[0](newParent);

                        expect(moveService.perform)
                            .toHaveBeenCalledWith(selectedObject, newParent);
                    });
                });
            });

            describe("with context from drag-drop", function () {
                beforeEach(function () {
                    context = {
                        selectedObject: selectedObject,
                        domainObject: newParent
                    };

                    moveAction = new MoveAction(
                        policyService,
                        locationService,
                        moveService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(moveAction).toBeDefined();
                });


                it("performs move immediately", function () {
                    moveAction.perform();
                    expect(moveService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);
