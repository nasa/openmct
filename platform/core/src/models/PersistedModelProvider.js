/*global define,Promise*/

/**
 * Module defining PersistedModelProvider. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A model service which reads domain object models from an external
         * persistence service.
         *
         * @constructor
         * @param {PersistenceService} persistenceService the service in which
         *        domain object models are persisted.
         * @param $q Angular's $q service, for working with promises
         * @param {string} SPACE the name of the persistence space from which
         *        models should be retrieved.
         */
        function PersistedModelProvider(persistenceService, $q, SPACE) {
            function promiseModels(ids) {
                return $q.all(ids.filter(function (id) {
                    return id.indexOf(":") === -1;
                }).map(function (id) {
                    return persistenceService.readObject(SPACE, id);
                })).then(function (models) {
                    var result = {};
                    ids.forEach(function (id, index) {
                        result[id] = models[index];
                    });
                    return result;
                });
            }

            return {
                /**
                 * Get models with the specified identifiers.
                 *
                 * This will invoke the underlying persistence service to
                 * retrieve object models which match the provided
                 * identifiers.
                 *
                 * Note that the returned object may contain a subset or a
                 * superset of the models requested.
                 *
                 * @param {string[]} ids an array of domain object identifiers
                 * @returns {Promise.<object>} a promise for  an object
                 *          containing key-value pairs,
                 *          where keys are object identifiers and values
                 *          are object models.
                 */
                getModels: promiseModels
            };
        }


        return PersistedModelProvider;
    }
);