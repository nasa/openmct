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
        '../../src/actions/MoveAction',
        '../services/MockMoveService',
        '../DomainObjectFactory'
    ],
    (MoveAction, MockMoveService, domainObjectFactory) => {

        describe("Move Action", () =>  {

            let moveAction,
                policyService,
                locationService,
                locationServicePromise,
                moveService,
                context,
                selectedObject,
                selectedObjectContextCapability,
                currentParent,
                newParent;

            beforeEach(() =>  {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
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


            describe("with context from context-action", () =>  {
                beforeEach(() =>  {
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

                it("initializes happily", () =>  {
                    expect(moveAction).toBeDefined();
                });

                describe("when performed it", () =>  {
                    beforeEach(() =>  {
                        moveAction.perform();
                    });

                    it("prompts for location", () =>  {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Move selectedObject To a New Location",
                                "Move To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location from user", () =>  {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("moves object to selected location", () =>  {
                        locationServicePromise
                            .then
                            .mostRecentCall
                            .args[0](newParent);

                        expect(moveService.perform)
                            .toHaveBeenCalledWith(selectedObject, newParent);
                    });
                });
            });

            describe("with context from drag-drop", () =>  {
                beforeEach(() =>  {
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

                it("initializes happily", () =>  {
                    expect(moveAction).toBeDefined();
                });


                it("performs move immediately", () =>  {
                    moveAction.perform();
                    expect(moveService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);
