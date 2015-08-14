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

/**
 * This bundle decorates the persistence service to maintain a local cache
 * of persisted documents.
 * @namespace platform/persistence/cache
 */
define(
    [],
    function () {
        'use strict';

        /**
         * A caching persistence decorator maintains local copies of persistent objects
         * that have been loaded, and keeps them in sync after writes. This allows
         * retrievals to occur more quickly after the first load.
         *
         * @memberof platform/persistence/cache
         * @constructor
         * @param {string[]} cacheSpaces persistence space names which
         *        should be cached
         * @param {PersistenceService} persistenceService the service which
         *        implements object persistence, whose inputs/outputs
         *        should be cached.
         * @implements {PersistenceService}
         */
        function CachingPersistenceDecorator(cacheSpaces, persistenceService) {
            var spaces = cacheSpaces || [], // List of spaces to cache
                cache = {}; // Where objects will be stored

            // Arrayify list of spaces to cache, if necessary.
            spaces = Array.isArray(spaces) ? spaces : [ spaces ];

            // Initialize caches
            spaces.forEach(function (space) {
                cache[space] = {};
            });

            this.spaces = spaces;
            this.cache = cache;
            this.persistenceService = persistenceService;
        }

        // Wrap as a thenable; used instead of $q.when because that
        // will resolve on a future tick, which can cause latency
        // issues (which this decorator is intended to address.)
        function fastPromise(value) {
            return {
                then: function (callback) {
                    return fastPromise(callback(value));
                }
            };
        }

        // Update the cached instance of an object to a new value
        function replaceValue(valueHolder, newValue) {
            var v = valueHolder.value;

            // If it's a JS object, we want to replace contents, so that
            // everybody gets the same instance.
            if (typeof v === 'object' && v !== null) {
                // Only update contents if these are different instances
                if (v !== newValue) {
                    // Clear prior contents
                    Object.keys(v).forEach(function (k) {
                        delete v[k];
                    });
                    // Shallow-copy contents
                    Object.keys(newValue).forEach(function (k) {
                        v[k] = newValue[k];
                    });
                }
            } else {
                // Otherwise, just store the new value
                valueHolder.value = newValue;
            }
        }

        // Place value in the cache for space, if there is one.
        CachingPersistenceDecorator.prototype.addToCache = function (space, key, value) {
            var cache = this.cache;
            if (cache[space]) {
                if (cache[space][key]) {
                    replaceValue(cache[space][key], value);
                } else {
                    cache[space][key] = { value: value };
                }
            }
        };

        // Create a function for putting value into a cache;
        // useful for then-chaining.
        CachingPersistenceDecorator.prototype.putCache = function (space, key) {
            var self = this;
            return function (value) {
                self.addToCache(space, key, value);
                return value;
            };
        };



        CachingPersistenceDecorator.prototype.listSpaces = function () {
            return this.persistenceService.listSpaces();
        };

        CachingPersistenceDecorator.prototype.listObjects = function (space) {
            return this.persistenceService.listObjects(space);
        };

        CachingPersistenceDecorator.prototype.createObject = function (space, key, value) {
            this.addToCache(space, key, value);
            return this.persistenceService.createObject(space, key, value);
        };

        CachingPersistenceDecorator.prototype.readObject = function (space, key) {
            var cache = this.cache;
            return (cache[space] && cache[space][key]) ?
                fastPromise(cache[space][key].value) :
                this.persistenceService.readObject(space, key)
                    .then(this.putCache(space, key));
        };

        CachingPersistenceDecorator.prototype.updateObject = function (space, key, value) {
            var self = this;
            return this.persistenceService.updateObject(space, key, value)
                .then(function (result) {
                    self.addToCache(space, key, value);
                    return result;
                });
        };

        CachingPersistenceDecorator.prototype.deleteObject = function (space, key, value) {
            if (this.cache[space]) {
                delete this.cache[space][key];
            }
            return this.persistenceService.deleteObject(space, key, value);
        };

        return CachingPersistenceDecorator;
    }
);
