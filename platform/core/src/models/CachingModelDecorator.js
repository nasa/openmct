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
         * @param {ModelService} modelService this service to decorate
         * @implements {ModelService}
         */
        function CachingModelDecorator(cacheService, modelService) {
            this.cacheService = cacheService;
            this.modelService = modelService;
        }

        // Fast-resolving promise
        function fastPromise(value) {
            return (value || {}).then ? value : {
                then: function (callback) {
                    return fastPromise(callback(value));
                }
            };
        }

        CachingModelDecorator.prototype.getModels = function (ids) {
            var cacheService = this.cacheService,
                neededIds = ids.filter(function notCached(id) {
                    return !cacheService.has(id);
                });

            // Update the cached instance of a model to a new value.
            // We update in-place to ensure there is only ever one instance
            // of any given model exposed by the modelService as a whole.
            function updateModel(id, model) {
                var oldModel = cacheService.get(id);

                // Same object instance is a possibility, so don't copy
                if (oldModel === model) {
                    return model;
                }

                // If we'd previously cached an undefined value, or are now
                // seeing undefined, replace the item in the cache entirely.
                if (oldModel === undefined || model === undefined) {
                    cacheService.put(id, model);
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

            // Store the provided models in our cache
            function cacheAll(models) {
                Object.keys(models).forEach(function (id) {
                    var model = cacheService.has(id) ?
                        updateModel(id, models[id]) : models[id];
                    cacheService.put(id, model);
                });
            }

            // Expose the cache (for promise chaining)
            function giveCache() {
                return cacheService.all();
            }

            // Look up if we have unknown IDs
            if (neededIds.length > 0) {
                return this.modelService.getModels(neededIds)
                    .then(cacheAll)
                    .then(giveCache);
            }

            // Otherwise, just expose the cache directly
            return fastPromise(cacheService.all());
        };

        return CachingModelDecorator;
    }
);
