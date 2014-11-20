/*global define*/

/**
 * Module defining ModelAggregator. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Allows multiple services which provide models for domain objects
         * to be treated as one.
         *
         * @constructor
         * @param {ModelProvider[]} providers the model providers to be
         *        aggregated
         */
        function ModelAggregator($q, providers) {

            // Merge results from multiple providers into one
            // large result object.
            function mergeModels(provided, ids) {
                var result = {};
                ids.forEach(function (id) {
                    provided.forEach(function (models) {
                        if (models[id]) {
                            result[id] = models[id];
                        }
                    });
                });
                return result;
            }

            return {
                /**
                 * Get models with the specified identifiers.
                 *
                 * This will invoke the `getModels()` method of all providers
                 * given at constructor-time, and aggregate the result into
                 * one object.
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
                    return $q.all(providers.map(function (provider) {
                        return provider.getModels(ids);
                    })).then(function (provided) {
                        return mergeModels(provided, ids);
                    });
                }
            };
        }

        return ModelAggregator;
    }
);