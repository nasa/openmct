/*global define,Promise*/

/**
 * Module defining RootModelProvider. Created by vwoeltje on 11/7/14.
 */
define(
    ['./StaticModelProvider'],
    function (StaticModelProvider) {
        "use strict";

        /**
         * Provides the root object (id = "ROOT"), which is the top-level
         * domain object shown when the application is started, from which all
         * other domain objects are reached.
         *
         * The root model provider works as the static model provider,
         * except that it aggregates roots[] instead of models[], and
         * exposes them all as composition of the root object ROOT,
         * whose model is also provided by this service.
         *
         * @constructor
         */
        function RootModelProvider(roots, $q, $log) {
            // Pull out identifiers to used as ROOT's
            var ids = roots.map(function (root) { return root.id; }),
                baseProvider = new StaticModelProvider(roots, $q, $log);

            function addRoot(models) {
                models.ROOT = {
                    name: "The root object",
                    composition: ids
                };
                return models;
            }

            return {

                /**
                 * Get models with the specified identifiers.
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
                getModels: function (ids) {
                    return baseProvider.getModels(ids).then(addRoot);
                }
            };
        }

        return RootModelProvider;
    }
);