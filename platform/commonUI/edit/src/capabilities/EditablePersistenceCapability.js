/*global define*/

/**
 * Editable Persistence Capability. Overrides the persistence capability
 * normally exhibited by a domain object to ensure that changes made
 * during edit mode are not immediately stored to the database or other
 * backing storage.
 */
define(
    function () {
        'use strict';

        return function EditablePersistenceCapability(
            persistenceCapability,
            editableObject,
            domainObject,
            cache
        ) {
            var persistence = Object.create(persistenceCapability);

            // Simply trigger refresh of in-view objects; do not
            // write anything to database.
            persistence.persist = function () {
                cache.markDirty(editableObject);
            };

            return persistence;
        };
    }
);