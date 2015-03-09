/*global define*/


define(
    ['./EditableLookupCapability'],
    function (EditableLookupCapability) {
        'use strict';

        /**
         * Wrapper for the "relationship" capability;
         * ensures that any domain objects reachable in Edit mode
         * are also wrapped as EditableDomainObjects.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         */
        return function EditableRelationshipCapability(
            relationshipCapability,
            editableObject,
            domainObject,
            cache
        ) {
            // This is a "lookup" style capability (it looks up other
            // domain objects), but we do not want to return the same
            // specific value every time (composition may change)
            return new EditableLookupCapability(
                relationshipCapability,
                editableObject,
                domainObject,
                cache,
                false // Not idempotent
            );
        };
    }
);