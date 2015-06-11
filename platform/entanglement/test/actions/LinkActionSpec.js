/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/actions/LinkAction',
        '../services/MockLinkService',
        '../DomainObjectFactory'
    ],
    function (LinkAction, MockLinkService, domainObjectFactory) {
        "use strict";

        describe("Link Action", function () {

            var linkAction,
                locationService,
                locationServicePromise,
                linkService,
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

                linkService = new MockLinkService();
            });


            describe("with context from context-action", function () {
                beforeEach(function () {
                    context = {
                        domainObject: selectedObject
                    };

                    linkAction = new LinkAction(
                        locationService,
                        linkService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(linkAction).toBeDefined();
                });

                describe("when performed it", function () {
                    beforeEach(function () {
                        linkAction.perform();
                    });

                    it("prompts for location", function () {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Link selectedObject to a new location",
                                "Link To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location from user", function () {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("links object to selected location", function () {
                        locationServicePromise
                            .then
                            .mostRecentCall
                            .args[0](newParent);

                        expect(linkService.perform)
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

                    linkAction = new LinkAction(
                        locationService,
                        linkService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(linkAction).toBeDefined();
                });


                it("performs link immediately", function () {
                    linkAction.perform();
                    expect(linkService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);
