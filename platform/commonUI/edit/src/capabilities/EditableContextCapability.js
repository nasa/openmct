/*global define*/


define(
    ['./EditableLookupCapability'],
    function (EditableLookupCapability) {
        'use strict';

        /**
         * Wrapper for the "context" capability;
         * ensures that any domain objects reachable in Edit mode
         * are also wrapped as EditableDomainObjects.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         */
        return function EditableContextCapability(
            contextCapability,
            editableObject,
            domainObject,
            cache
        ) {
            // This is a "lookup" style capability (it looks up other
            // domain objects), and it should be idempotent
            var capability = new EditableLookupCapability(
                    contextCapability,
                    editableObject,
                    domainObject,
                    cache,
                    true // Idempotent
                ),
                // Track the real root object for the Elements pane
                trueRoot = capability.getRoot();

            // Provide access to the real root, for the Elements pane.
            capability.getTrueRoot = function () {
                return trueRoot;
            };

            // Hide ancestry after the root of this subgraph
            if (cache.isRoot(domainObject)) {
                capability.getRoot = function () {
                    return editableObject;
                };
                capability.getPath = function () {
                    return [editableObject];
                };
            }

            return capability;
        };
    }
);