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
                    [ "persist", "refresh" ]
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

                mockDomainObject.getCapability.andReturn(mockPersistence);

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

            it("refreshes using the original domain object's persistence", function () {
                // Refreshing needs to delegate via the unwrapped domain object.
                // Otherwise, only the editable version of the object will be updated;
                // we instead want the real version of the object to receive these
                // changes.
                expect(mockDomainObject.getCapability).not.toHaveBeenCalled();
                expect(mockPersistence.refresh).not.toHaveBeenCalled();
                capability.refresh();
                expect(mockDomainObject.getCapability).toHaveBeenCalledWith('persistence');
                expect(mockPersistence.refresh).toHaveBeenCalled();
            });

        });
    }
);