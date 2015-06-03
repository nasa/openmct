/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
    ["./EditableModelCache"],
    function (EditableModelCache) {
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
         * @param $q Angular's $q, for promise handling
         * @constructor
         * @memberof module:editor/object/editable-domain-object-cache
         */
        function EditableDomainObjectCache(EditableDomainObject, $q) {
            var cache = new EditableModelCache(),
                dirty = {},
                root;

            return {
                /**
                 * Wrap this domain object in an editable form, or pull such
                 * an object from the cache if one already exists.
                 *
                 * @param {DomainObject} domainObject the regular domain object
                 * @returns {DomainObject} the domain object in an editable form
                 */
                getEditableObject: function (domainObject) {
                    // Track the top-level domain object; this will have
                    // some special behavior for its context capability.
                    root = root || domainObject;

                    // Avoid double-wrapping (WTD-1017)
                    if (domainObject.hasCapability('editor')) {
                        return domainObject;
                    }

                    // Provide an editable form of the object
                    return new EditableDomainObject(
                        domainObject,
                        cache.getCachedModel(domainObject)
                    );
                },
                /**
                 * Check if a domain object is (effectively) the top-level
                 * object in this editable subgraph.
                 * @returns {boolean} true if it is the root
                 */
                isRoot: function (domainObject) {
                    return domainObject === root;
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
                    // Get a list of all dirty objects
                    var objects = Object.keys(dirty).map(function (k) {
                        return dirty[k];
                    });

                    // Clear dirty set, since we're about to save.
                    dirty = {};

                    // Most save logic is handled by the "editor.completion"
                    // capability, so that is delegated here.
                    return $q.all(objects.map(function (object) {
                        // Save; pass a nonrecursive flag to avoid looping
                        return object.getCapability('editor').save(true);
                    }));
                },
                /**
                 * Check if any objects have been marked dirty in this cache.
                 * @returns {boolean} true if objects are dirty
                 */
                dirty: function () {
                    return Object.keys(dirty).length > 0;
                }
            };
        }

        return EditableDomainObjectCache;
    }
);