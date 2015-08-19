/*global define,describe,it,expect,beforeEach,jasmine */

define(
    [
        '../../src/capabilities/LocationCapability',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    function (LocationCapability, domainObjectFactory, ControlledPromise) {

        describe("LocationCapability", function () {

            describe("instantiated with domain object", function () {
                var locationCapability,
                    persistencePromise,
                    mutationPromise,
                    domainObject;

                beforeEach(function () {
                    domainObject = domainObjectFactory({
                        capabilities: {
                            context: {
                                getParent: function() {
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

                    locationCapability = new LocationCapability(domainObject);
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

            });
        });
    }
);
