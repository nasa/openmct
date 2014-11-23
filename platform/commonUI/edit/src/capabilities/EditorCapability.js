/*global define*/

/**
 * Implements "save" and "cancel" as capabilities of
 * the object. In editing mode, user is seeing/using
 * a copy of the object (an EditableDomainObject)
 * which is disconnected from persistence; the Save
 * and Cancel actions can use this capability to
 * propagate changes from edit mode to the underlying
 * actual persistable object.
 */
define(
    [],
    function () {
        'use strict';

        return function EditorCapability(
            persistenceCapability,
            editableObject,
            domainObject,
            cache
        ) {

            function doMutate() {
                return domainObject.useCapability('mutation', function () {
                    return editableObject.getModel();
                });
            }

            function doPersist() {
                return persistenceCapability.persist();
            }

            function saveOthers() {
                return cache.saveAll();
            }

            function markClean() {
                return cache.markClean(editableObject);
            }

            return {
                save: function () {
                    return Promise.resolve(doMutate())
                        .then(doPersist)
                        .then(markClean)
                        .then(saveOthers);
                },
                cancel: function () {
                    return Promise.resolve(undefined);
                }
            };
        };
    }
);