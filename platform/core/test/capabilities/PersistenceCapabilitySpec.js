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

            beforeEach(function () {
                mockPersistenceService = jasmine.createSpyObj(
                    "persistenceService",
                    [ "updateObject" ]
                );
                mockDomainObject = {
                    getId: function () { return id; },
                    getModel: function () { return model; },
                    useCapability: jasmine.createSpy()
                };
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

        });
    }
);