/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/capabilities/EditablePersistenceCapability"],
    function (EditablePersistenceCapability) {
        "use strict";

        describe("An editable persistence capability", function () {
            var mockPersistence,
                mockEditableObject,
                mockDomainObject,
                mockCache,
                capability;

            beforeEach(function () {
                mockPersistence = jasmine.createSpyObj(
                    "persistence",
                    [ "persist" ]
                );
                mockEditableObject = jasmine.createSpyObj(
                    "editableObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "editableObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockCache = jasmine.createSpyObj(
                    "cache",
                    [ "markDirty" ]
                );

                capability = new EditablePersistenceCapability(
                    mockPersistence,
                    mockEditableObject,
                    mockDomainObject,
                    mockCache
                );
            });

            it("marks objects as dirty (in the cache) upon persist", function () {
                capability.persist();
                expect(mockCache.markDirty)
                    .toHaveBeenCalledWith(mockEditableObject);
            });

            it("does not invoke the underlying persistence capability", function () {
                capability.persist();
                expect(mockPersistence.persist).not.toHaveBeenCalled();
            });

        });
    }
);