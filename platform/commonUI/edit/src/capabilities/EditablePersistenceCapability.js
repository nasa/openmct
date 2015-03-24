/*global define*/


define(
    function () {
        'use strict';

        /**
         * Editable Persistence Capability. Overrides the persistence capability
         * normally exhibited by a domain object to ensure that changes made
         * during edit mode are not immediately stored to the database or other
         * backing storage.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         */
        function EditablePersistenceCapability(
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

            // Delegate refresh to the original object; this avoids refreshing
            // the editable instance of the object, and ensures that refresh
            // correctly targets the "real" version of the object.
            persistence.refresh = function () {
                return domainObject.getCapability('persistence').refresh();
            };

            return persistence;
        }

        return EditablePersistenceCapability;
    }
);