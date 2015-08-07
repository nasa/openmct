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
        "use strict";

        /**
         * The caching model decorator maintains a cache of loaded domain
         * object models, and ensures that duplicate models for the same
         * object are not provided.
         * @memberof platform/core
         * @constructor
         */
        function CachingModelDecorator(modelService) {
            var cache = {},
                cached = {};

            // Update the cached instance of a model to a new value.
            // We update in-place to ensure there is only ever one instance
            // of any given model exposed by the modelService as a whole.
            function updateModel(id, model) {
                var oldModel = cache[id];

                // Same object instance is a possibility, so don't copy
                if (oldModel === model) {
                    return model;
                }

                // If we'd previously cached an undefined value, or are now
                // seeing undefined, replace the item in the cache entirely.
                if (oldModel === undefined || model === undefined) {
                    cache[id] = model;
                    return model;
                }

                // Otherwise, empty out the old model...
                Object.keys(oldModel).forEach(function (k) {
                    delete oldModel[k];
                });

                // ...and replace it with the contents of the new model.
                Object.keys(model).forEach(function (k) {
                    oldModel[k] = model[k];
                });

                return oldModel;
            }

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
                cache[id] = cached[id] ? updateModel(id, model) : model;
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
                 * @memberof platform/core.CachingModelDecorator#
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
