/*global define,describe,it,expect,beforeEach,jasmine */

define(
    [
        '../../src/capabilities/LocationCapability',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    function (LocationCapability, domainObjectFactory, ControlledPromise) {
        'use strict';

        describe("LocationCapability", function () {

            describe("instantiated with domain object", function () {
                var locationCapability,
                    persistencePromise,
                    mutationPromise,
                    mockQ,
                    mockInjector,
                    mockObjectService,
                    domainObject;

                beforeEach(function () {
                    domainObject = domainObjectFactory({
                        id: "testObject",
                        capabilities: {
                            context: {
                                getParent: function () {
                                    return domainObjectFactory({id: 'root'});
                                }
                            },
                            persistence: jasmine.createSpyObj(
                                'persistenceCapability',
                                ['persist']
                            ),
                            mutation: jasmine.createSpyObj(
                                'mutationCapability',
                                ['invoke']
                            )
                        }
                    });

                    mockQ = jasmine.createSpyObj("$q", ["when"]);
                    mockInjector = jasmine.createSpyObj("$injector", ["get"]);
                    mockObjectService =
                        jasmine.createSpyObj("objectService", ["getObjects"]);

                    persistencePromise = new ControlledPromise();
                    domainObject.capabilities.persistence.persist.andReturn(
                        persistencePromise
                    );

                    mutationPromise = new ControlledPromise();
                    domainObject.capabilities.mutation.invoke.andCallFake(
                        function (mutator) {
                            return mutationPromise.then(function () {
                                mutator(domainObject.model);
                            });
                        }
                    );

                    locationCapability = new LocationCapability(
                        mockQ,
                        mockInjector,
                        domainObject
                    );
                });

                it("returns contextual location", function () {
                    expect(locationCapability.getContextualLocation())
                        .toBe('root');
                });

                it("knows when the object is an original", function () {
                    domainObject.model.location = 'root';
                    expect(locationCapability.isOriginal()).toBe(true);
                    expect(locationCapability.isLink()).toBe(false);
                });

                it("knows when the object is a link.", function () {
                    domainObject.model.location = 'different-root';
                    expect(locationCapability.isLink()).toBe(true);
                    expect(locationCapability.isOriginal()).toBe(false);
                });

                it("can persist location", function () {
                    var persistResult = locationCapability
                            .setPrimaryLocation('root'),
                        whenComplete = jasmine.createSpy('whenComplete');

                    persistResult.then(whenComplete);

                    expect(domainObject.model.location).not.toBeDefined();
                    mutationPromise.resolve();
                    expect(domainObject.model.location).toBe('root');

                    expect(whenComplete).not.toHaveBeenCalled();
                    expect(domainObject.capabilities.persistence.persist)
                        .toHaveBeenCalled();

                    persistencePromise.resolve();
                    expect(whenComplete).toHaveBeenCalled();
                });

                describe("when used to load an original instance", function () {
                    var objectPromise,
                        qPromise,
                        originalObjects,
                        mockCallback;

                    function resolvePromises() {
                        if (mockQ.when.calls.length > 0) {
                            qPromise.resolve(mockQ.when.mostRecentCall.args[0]);
                        }
                        if (mockObjectService.getObjects.calls.length > 0) {
                            objectPromise.resolve(originalObjects);
                        }
                    }

                    beforeEach(function () {
                        objectPromise = new ControlledPromise();
                        qPromise = new ControlledPromise();
                        originalObjects = {
                            testObject: domainObjectFactory()
                        };

                        mockInjector.get.andCallFake(function (key) {
                            return key === 'objectService' && mockObjectService;
                        });
                        mockObjectService.getObjects.andReturn(objectPromise);
                        mockQ.when.andReturn(qPromise);

                        mockCallback = jasmine.createSpy('callback');
                    });

                    it("provides originals directly", function () {
                        domainObject.model.location = 'root';
                        locationCapability.getOriginal().then(mockCallback);
                        expect(mockCallback).not.toHaveBeenCalled();
                        resolvePromises();
                        expect(mockCallback)
                            .toHaveBeenCalledWith(domainObject);
                    });

                    it("loads from the object service for links", function () {
                        domainObject.model.location = 'some-other-root';
                        locationCapability.getOriginal().then(mockCallback);
                        expect(mockCallback).not.toHaveBeenCalled();
                        resolvePromises();
                        expect(mockCallback)
                            .toHaveBeenCalledWith(originalObjects.testObject);
                    });
                });


            });
        });
    }
);
