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

define(
    [],
    function () {
        'use strict';


        /**
         * Implements "save" and "cancel" as capabilities of
         * the object. In editing mode, user is seeing/using
         * a copy of the object (an EditableDomainObject)
         * which is disconnected from persistence; the Save
         * and Cancel actions can use this capability to
         * propagate changes from edit mode to the underlying
         * actual persistable object.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         * @constructor
         * @memberof platform/commonUI/edit
         */
        function EditorCapability(
            persistenceCapability,
            editableObject,
            domainObject,
            cache
        ) {
            this.editableObject = editableObject;
            this.domainObject = domainObject;
            this.cache = cache;
        }

        // Simulate Promise.resolve (or $q.when); the former
        // causes a delayed reaction from Angular (since it
        // does not trigger a digest) and the latter is not
        // readily accessible, since we're a few classes
        // removed from the layer which gets dependency
        // injection.
        function resolvePromise(value) {
            return (value && value.then) ? value : {
                then: function (callback) {
                    return resolvePromise(callback(value));
                }
            };
        }

        /**
         * Save any changes that have been made to this domain object
         * (as well as to others that might have been retrieved and
         * modified during the editing session)
         * @param {boolean} nonrecursive if true, save only this
         *        object (and not other objects with associated changes)
         * @returns {Promise} a promise that will be fulfilled after
         *          persistence has completed.
         * @memberof platform/commonUI/edit.EditorCapability#
         */
        EditorCapability.prototype.save = function (nonrecursive) {
            var domainObject = this.domainObject,
                editableObject = this.editableObject,
                self = this,
                cache = this.cache,
                returnPromise;

            // Update the underlying, "real" domain object's model
            // with changes made to the copy used for editing.
            function doMutate() {
                return domainObject.useCapability('mutation', function () {
                    return editableObject.getModel();
                });
            }

            // Persist the underlying domain object
            function doPersist() {
                return domainObject.getCapability('persistence').persist();
            }

            editableObject.getCapability("status").set("editing", false);

            if (nonrecursive) {
                returnPromise = resolvePromise(doMutate())
                    .then(doPersist)
                    .then(function(){
                        self.cancel();
                    });
            } else {
                returnPromise = resolvePromise(cache.saveAll());
            }
            //Return the original (non-editable) object
            return returnPromise.then(function() {
                return domainObject.getOriginalObject ? domainObject.getOriginalObject() : domainObject;
            });
        };

        /**
         * Cancel editing; Discard any changes that have been made to
         * this domain object (as well as to others that might have
         * been retrieved and modified during the editing session)
         * @returns {Promise} a promise that will be fulfilled after
         *          cancellation has completed.
         * @memberof platform/commonUI/edit.EditorCapability#
         */
        EditorCapability.prototype.cancel = function () {
            this.editableObject.getCapability("status").set("editing", false);
            this.cache.markClean();
            return resolvePromise(undefined);
        };

        /**
         * Check if there are any unsaved changes.
         * @returns {boolean} true if there are unsaved changes
         * @memberof platform/commonUI/edit.EditorCapability#
         */
        EditorCapability.prototype.dirty = function () {
            return this.cache.dirty();
        };

        return EditorCapability;
    }
);
