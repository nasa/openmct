/*global define,describe,it,expect,beforeEach */

define(
    [
        '../../src/capabilities/LocationCapability',
        '../DomainObjectFactory'
    ],
    function (LocationCapability, domainObjectFactory) {

        describe("LocationCapability", function () {


            it("applies to objects with a context capability", function () {
                var domainObject = domainObjectFactory({
                    capabilities: {
                        context: true
                    }
                });
                expect(LocationCapability.appliesTo(domainObject)).toBe(true);
            });

            it("does not apply to objects without context capability", function () {
                var domainObject = domainObjectFactory();
                expect(LocationCapability.appliesTo(domainObject)).toBe(false);
            });

            describe("instantiated with domain object", function () {
                var locationCapability,
                    domainObject;

                beforeEach(function () {
                    domainObject = domainObjectFactory({
                        capabilities: {
                            context: {
                                getPath: function() {
                                    return [
                                        {
                                            getId: function () {
                                                return 'root';
                                            }
                                        },
                                        {
                                            getId: function () {
                                                return 'parent';
                                            }
                                        },
                                        {
                                            getId: function () {
                                                return 'me';
                                            }
                                        }
                                    ];
                                }
                            }
                        }
                    });

                    locationCapability = new LocationCapability(domainObject);
                });

                it("returns location", function () {
                    expect(locationCapability.getLocation())
                        .toBe('root/parent/me');
                });

                it("knows when the object is an original", function () {
                    domainObject.model.location = 'root/parent/me';
                    expect(locationCapability.isOriginal()).toBe(true);
                    expect(locationCapability.isLink()).toBe(false);
                });

                it("knows when the object is a link.", function () {
                    domainObject.model.location = 'root/another/location/me';
                    expect(locationCapability.isLink()).toBe(true);
                    expect(locationCapability.isOriginal()).toBe(false);
                });

            });
        });
    }
);
