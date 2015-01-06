/*global define*/

define(
    [],
    function () {
        'use strict';

        /**
         * A caching persistence decorator maintains local copies of persistent objects
         * that have been loaded, and keeps them in sync after writes. This allows
         * retrievals to occur more quickly after the first load.
         *
         * @constructor
         * @param {string[]} CACHE_SPACES persistence space names which
         *        should be cached
         * @param {PersistenceService} persistenceService the service which
         *        implements object persistence, whose inputs/outputs
         *        should be cached.
         */
        function CachingPersistenceDecorator(CACHE_SPACES, persistenceService) {
            var spaces = CACHE_SPACES || [], // List of spaces to cache
                cache = {}; // Where objects will be stored

            // Utility function; avoid sharing one instance everywhere.
            function clone(value) {
                // Only clone truthy values (no need to clone undefined, false...)
                return value && JSON.parse(JSON.stringify(value));
            }

            // Place value in the cache for space, if there is one.
            function addToCache(space, key, value) {
                if (cache[space]) {
                    cache[space][key] = { value: clone(value) };
                }
            }

            // Create a function for putting value into a cache;
            // useful for then-chaining.
            function putCache(space, key) {
                return function (value) {
                    addToCache(space, key, value);
                    return value;
                };
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

            // Arrayify list of spaces to cache, if necessary.
            spaces = Array.isArray(spaces) ? spaces : [ spaces ];

            // Initialize caches
            spaces.forEach(function (space) {
                cache[space] = {};
            });

            // Provide PersistenceService interface; mostly delegate to the
            // decorated service, intervene and cache where appropriate.
            return {
                listSpaces: function () {
                    return persistenceService.listSpaces();
                },
                listObjects: function (space) {
                    return persistenceService.listObjects(space);
                },
                createObject: function (space, key, value) {
                    addToCache(space, key, value);
                    return persistenceService.createObject(space, key, value);
                },
                readObject: function (space, key) {
                    return (cache[space] && cache[space][key]) ?
                            fastPromise(clone(cache[space][key].value)) :
                            persistenceService.readObject(space, key)
                                .then(putCache(space, key));
                },
                updateObject: function (space, key, value) {
                    addToCache(space, key, value);
                    return persistenceService.updateObject(space, key, value);
                },
                deleteObject: function (space, key, value) {
                    if (cache[space]) {
                        delete cache[space][key];
                    }
                    return persistenceService.deleteObject(space, key, value);
                }
            };

        }

        return CachingPersistenceDecorator;
    }
);