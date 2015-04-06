/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * PersistenceCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/PersistenceCapability"],
    function (PersistenceCapability) {
        "use strict";

        describe("The persistence capability", function () {
            var mockPersistenceService,
                mockDomainObject,
                id = "object id",
                model = { someKey: "some value"},
                SPACE = "some space",
                persistence;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockPersistenceService = jasmine.createSpyObj(
                    "persistenceService",
                    [ "updateObject", "readObject" ]
                );
                mockDomainObject = {
                    getId: function () { return id; },
                    getModel: function () { return model; },
                    useCapability: jasmine.createSpy()
                };
                // Simulate mutation capability
                mockDomainObject.useCapability.andCallFake(function (capability, mutator) {
                    if (capability === 'mutation') {
                        model = mutator(model) || model;
                    }
                });
                persistence = new PersistenceCapability(
                    mockPersistenceService,
                    SPACE,
                    mockDomainObject
                );
            });

            it("makes a call to the persistence service when invoked", function () {
                // Verify precondition; no call made during constructor
                expect(mockPersistenceService.updateObject).not.toHaveBeenCalled();

                persistence.persist();

                expect(mockPersistenceService.updateObject).toHaveBeenCalledWith(
                    SPACE,
                    id,
                    model
                );
            });

            it("reports which persistence space an object belongs to", function () {
                expect(persistence.getSpace()).toEqual(SPACE);
            });

            it("updates persisted timestamp on persistence", function () {
                model.modified = 12321;
                persistence.persist();
                expect(model.persisted).toEqual(12321);
            });

            it("refreshes the domain object model from persistence", function () {
                var refreshModel = { someOtherKey: "some other value" };
                mockPersistenceService.readObject.andReturn(asPromise(refreshModel));
                persistence.refresh();
                expect(model).toEqual(refreshModel);
            });

            it("does not overwrite unpersisted changes on refresh", function () {
                var refreshModel = { someOtherKey: "some other value" },
                    mockCallback = jasmine.createSpy();
                model.modified = 2;
                model.persisted = 1;
                mockPersistenceService.readObject.andReturn(asPromise(refreshModel));
                persistence.refresh().then(mockCallback);
                expect(model).not.toEqual(refreshModel);
                // Should have also indicated that no changes were actually made
                expect(mockCallback).toHaveBeenCalledWith(false);
            });

        });
    }
);