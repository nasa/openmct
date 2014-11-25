/*global define*/


/**
 * An editable domain object cache stores domain objects that have been
 * made editable, in a group that can be saved all-at-once. This supports
 * Edit mode, which is launched for a specific object but may contain
 * changes across many objects.
 *
 * Editable domain objects have certain specific capabilities overridden
 * to ensure that changes made while in edit mode do not propagate up
 * to the objects used in browse mode (or to persistence) until the user
 * initiates a Save.
 *
 * @module editor/object/editable-domain-object-cache
 */
define(
    function () {
        'use strict';

        /**
         * Construct a new cache for editable domain objects. This can be used
         * to get-or-create editable objects, particularly to support wrapping
         * of objects retrieved via composition or context capabilities as
         * editable domain objects.
         *
         * @param {Constructor<EditableDomainObject>} EditableDomainObject a
         *        constructor function which takes a regular domain object as
         *        an argument, and returns an editable domain object as its
         *        result.
         * @constructor
         * @memberof module:editor/object/editable-domain-object-cache
         */
        function EditableDomainObjectCache(EditableDomainObject) {
            var cache = {},
                dirty = {};

            return {
                /**
                 * Wrap this domain object in an editable form, or pull such
                 * an object from the cache if one already exists.
                 *
                 * @param {DomainObject} domainObject the regular domain object
                 * @returns {DomainObject} the domain object in an editable form
                 */
                getEditableObject: function (domainObject) {
                    var id = domainObject.getId();
                    return (cache[id] =
                        cache[id] || new EditableDomainObject(domainObject));
                },
                /**
                 * Mark an editable domain object (presumably already cached)
                 * as having received modifications during editing; it should be
                 * included in the bulk save invoked when editing completes.
                 *
                 * @param {DomainObject} domainObject the domain object
                 */
                markDirty: function (domainObject) {
                    dirty[domainObject.getId()] = domainObject;
                },
                /**
                 * Mark an object (presumably already cached) as having had its
                 * changes saved (and thus no longer needing to be subject to a
                 * save operation.)
                 *
                 * @param {DomainObject} domainObject the domain object
                 */
                markClean: function (domainObject) {
                    delete dirty[domainObject.getId()];
                },
                /**
                 * Initiate a save on all objects that have been cached.
                 */
                saveAll: function () {
                    var object;

                    // Most save logic is handled by the "editor.completion"
                    // capability, but this in turn will typically invoke
                    // Save All. An infinite loop is avoided by marking
                    // objects as clean as we go.

                    while (Object.keys(dirty).length > 0) {
                        // Pick the first dirty object
                        object = dirty[Object.keys(dirty)[0]];

                        // Mark non-dirty to avoid successive invocations
                        this.markClean(object);

                        // Invoke its save behavior
                        object.getCapability('editor').save();
                    }
                }
            };
        }

        return EditableDomainObjectCache;
    }
);