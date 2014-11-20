/*global define*/

/**
 * Defines the "persistence" capability, used to indicate
 * that changes to an object should be written to some
 * underlying store.
 *
 * Current implementation is a stub that simply triggers
 * a refresh on modified views, which is a necessary
 * side effect of persisting the object.
 */
define(
    function () {
        'use strict';

        function PersistenceCapability(persistenceService, SPACE, domainObject) {
            var self = {
                persist: function () {
                    return persistenceService.updateObject(
                        SPACE,
                        domainObject.getId(),
                        domainObject.getModel()
                    );
                },
                getSpace: function () {
                    return SPACE;
                },
                invoke: function () {
                    return self;
                }
            };

            return self;
        }

        return PersistenceCapability;
    }
);