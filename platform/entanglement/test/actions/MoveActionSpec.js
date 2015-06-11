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
                locationService,
                locationServicePromise,
                moveService,
                context,
                selectedObject,
                selectedObjectContextCapability,
                currentParent,
                newParent;

            beforeEach(function () {
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
