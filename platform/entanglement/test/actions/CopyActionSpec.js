/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/actions/CopyAction',
        '../services/MockCopyService',
        '../DomainObjectFactory'
    ],
    function (CopyAction, MockCopyService, domainObjectFactory) {
        "use strict";

        describe("Copy Action", function () {

            var copyAction,
                locationService,
                locationServicePromise,
                copyService,
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

                copyService = new MockCopyService();
            });


            describe("with context from context-action", function () {
                beforeEach(function () {
                    context = {
                        domainObject: selectedObject
                    };

                    copyAction = new CopyAction(
                        locationService,
                        copyService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(copyAction).toBeDefined();
                });

                describe("when performed it", function () {
                    beforeEach(function () {
                        copyAction.perform();
                    });

                    it("prompts for location", function () {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Duplicate selectedObject to a location",
                                "Duplicate To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location from user", function () {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("copys object to selected location", function () {
                        locationServicePromise
                            .then
                            .mostRecentCall
                            .args[0](newParent);

                        expect(copyService.perform)
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

                    copyAction = new CopyAction(
                        locationService,
                        copyService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(copyAction).toBeDefined();
                });


                it("performs copy immediately", function () {
                    copyAction.perform();
                    expect(copyService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);
