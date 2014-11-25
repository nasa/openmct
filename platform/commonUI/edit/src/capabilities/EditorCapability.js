/*global define,Promise*/

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
         */
        return function EditorCapability(
            persistenceCapability,
            editableObject,
            domainObject,
            cache
        ) {

            // Update the underlying, "real" domain object's model
            // with changes made to the copy used for editing.
            function doMutate() {
                return domainObject.useCapability('mutation', function () {
                    return editableObject.getModel();
                });
            }

            // Persist the underlying domain object
            function doPersist() {
                return persistenceCapability.persist();
            }

            // Save any other objects that have been modified in the cache.
            // IMPORTANT: This must not be called until after this object
            // has been marked as clean.
            function saveOthers() {
                return cache.saveAll();
            }

            // Indicate that this object has been saved.
            function markClean() {
                return cache.markClean(editableObject);
            }

            return {
                /**
                 * Save any changes that have been made to this domain object
                 * (as well as to others that might have been retrieved and
                 * modified during the editing session)
                 * @returns {Promise} a promise that will be fulfilled after
                 *          persistence has completed.
                 */
                save: function () {
                    return Promise.resolve(doMutate())
                        .then(doPersist)
                        .then(markClean)
                        .then(saveOthers);
                },
                /**
                 * Cancel editing; Discard any changes that have been made to
                 * this domain object (as well as to others that might have
                 * been retrieved and modified during the editing session)
                 * @returns {Promise} a promise that will be fulfilled after
                 *          cancellation has completed.
                 */
                cancel: function () {
                    return Promise.resolve(undefined);
                }
            };
        };
    }
);