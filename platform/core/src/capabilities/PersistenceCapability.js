/*global define*/


define(
    function () {
        'use strict';

        /**
         * Defines the `persistence` capability, used to trigger the
         * writing of changes to a domain object to an underlying
         * persistence store.
         *
         * @param {PersistenceService} persistenceService the underlying
         *        provider of persistence capabilities.
         * @param {string} SPACE the name of the persistence space to
         *        use (this is an arbitrary string, useful in principle
         *        for distinguishing different persistence stores from
         *        one another.)
         * @param {DomainObject} the domain object which shall expose
         *        this capability
         *
         * @constructor
         */
        function PersistenceCapability(persistenceService, SPACE, domainObject) {
            // Cache modified timestamp
            var modified = domainObject.getModel().modified;

            // Update a domain object's model upon refresh
            function updateModel(model) {
                var modified = model.modified;
                return domainObject.useCapability("mutation", function () {
                    return model;
                }, modified);
            }

            // For refresh; update a domain object model, only if there
            // are no unsaved changes.
            function updatePersistenceTimestamp() {
                var modified = domainObject.getModel().modified;
                domainObject.useCapability("mutation", function (model) {
                    model.persisted = modified;
                }, modified);
            }

            // Utility function for creating promise-like objects which
            // resolve synchronously when possible
            function fastPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return fastPromise(callback(value));
                    }
                };
            }

            return {
                /**
                 * Persist any changes which have been made to this
                 * domain object's model.
                 * @returns {Promise} a promise which will be resolved
                 *          if persistence is successful, and rejected
                 *          if not.
                 */
                persist: function () {
                    updatePersistenceTimestamp();
                    return persistenceService.updateObject(
                        SPACE,
                        domainObject.getId(),
                        domainObject.getModel()
                    );
                },
                /**
                 * Update this domain object to match the latest from
                 * persistence.
                 * @returns {Promise} a promise which will be resolved
                 *          when the update is complete
                 */
                refresh: function () {
                    var model = domainObject.getModel();
                    // Only update if we don't have unsaved changes
                    return (model.modified === model.persisted) ?
                            persistenceService.readObject(
                                SPACE,
                                domainObject.getId()
                            ).then(updateModel) :
                            fastPromise(false);
                },
                /**
                 * Get the space in which this domain object is persisted;
                 * this is useful when, for example, decided which space a
                 * newly-created domain object should be persisted to (by
                 * default, this should be the space of its containing
                 * object.)
                 *
                 * @returns {string} the name of the space which should
                 *          be used to persist this object
                 */
                getSpace: function () {
                    return SPACE;
                }
            };
        }

        return PersistenceCapability;
    }
);