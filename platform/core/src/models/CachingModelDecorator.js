/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The caching model decorator maintains a cache of loaded domain
         * object models, and ensures that duplicate models for the same
         * object are not provided.
         * @constructor
         */
        function CachingModelDecorator(modelService) {
            var cache = {},
                cached = {};

            // Fast-resolving promise
            function fastPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return fastPromise(callback(value));
                    }
                };
            }

            // Store this model in the cache
            function cacheModel(id, model) {
                cache[id] = model;
                cached[id] = true;
            }

            // Check if an id is not in cache, for lookup filtering
            function notCached(id) {
                return !cached[id];
            }

            // Store the provided models in our cache
            function cacheAll(models) {
                Object.keys(models).forEach(function (id) {
                    cacheModel(id, models[id]);
                });
            }

            // Expose the cache (for promise chaining)
            function giveCache() {
                return cache;
            }

            return {
                /**
                 * Get models for these specified string identifiers.
                 * These will be given as an object containing keys
                 * and values, where keys are object identifiers and
                 * values are models.
                 * This result may contain either a subset or a
                 * superset of the total objects.
                 *
                 * @param {Array<string>} ids the string identifiers for
                 *        models of interest.
                 * @returns {Promise<object>} a promise for an object
                 *          containing key-value pairs, where keys are
                 *          ids and values are models
                 * @method
                 */
                getModels: function (ids) {
                    var neededIds = ids.filter(notCached);

                    // Look up if we have unknown IDs
                    if (neededIds.length > 0) {
                        return modelService.getModels(neededIds)
                                .then(cacheAll)
                                .then(giveCache);
                    }

                    // Otherwise, just expose the cache directly
                    return fastPromise(cache);
                }
            };
        }

        return CachingModelDecorator;
    }
);