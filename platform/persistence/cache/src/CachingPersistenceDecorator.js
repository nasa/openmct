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
            function addToCache(space, key, value) {
                if (cache[space]) {
                    if (cache[space][key]) {
                        replaceValue(cache[space][key], value);
                    } else {
                        cache[space][key] = { value: value };
                    }
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
                /**
                 * List all persistence spaces that are supported by the
                 * decorated service.
                 * @memberof CachingPersistenceDecorator#
                 * @returns {Promise.<string[]>} spaces supported
                 */
                listSpaces: function () {
                    return persistenceService.listSpaces();
                },
                /**
                 * List all objects in a specific space.
                 * @memberof CachingPersistenceDecorator#
                 * @param {string} space the space in which to list objects
                 * @returns {Promise.<string[]>} keys for objects in this space
                 */
                listObjects: function (space) {
                    return persistenceService.listObjects(space);
                },
                /**
                 * Create an object in a specific space. This will
                 * be cached to expedite subsequent retrieval.
                 * @memberof CachingPersistenceDecorator#
                 * @param {string} space the space in which to create the object
                 * @param {string} key the key associate with the object for
                 *        subsequent lookup
                 * @param {object} value a JSONifiable object to store
                 * @returns {Promise.<boolean>} an indicator of the success or
                 *          failure of this request
                 */
                createObject: function (space, key, value) {
                    addToCache(space, key, value);
                    return persistenceService.createObject(space, key, value);
                },
                /**
                 * Read an object from a specific space. This will read from a
                 * cache if the object is available.
                 * @memberof CachingPersistenceDecorator#
                 * @param {string} space the space in which to create the object
                 * @param {string} key the key which identifies the object
                 * @param {*} options optional parameters
                 * @returns {Promise.<object>} a promise for the object; may
                 *          resolve to undefined (if the object does not exist
                 *          in this space)
                 */
                readObject: function (space, key, options) {
                    var force = (options || {}).cache === false;
                    return (cache[space] && cache[space][key] && !force) ?
                            fastPromise(cache[space][key].value) :
                            persistenceService.readObject(space, key)
                                .then(putCache(space, key));
                },
                /**
                 * Update an object in a specific space. This will
                 * be cached to expedite subsequent retrieval.
                 * @memberof CachingPersistenceDecorator#
                 * @param {string} space the space in which to create the object
                 * @param {string} key the key associate with the object for
                 *        subsequent lookup
                 * @param {object} value a JSONifiable object to store
                 * @returns {Promise.<boolean>} an indicator of the success or
                 *          failure of this request
                 */
                updateObject: function (space, key, value) {
                    addToCache(space, key, value);
                    return persistenceService.updateObject(space, key, value);
                },
                /**
                 * Delete an object in a specific space. This will
                 * additionally be cleared from the cache.
                 * @memberof CachingPersistenceDecorator#
                 * @param {string} space the space in which to create the object
                 * @param {string} key the key associate with the object for
                 *        subsequent lookup
                 * @param {object} value a JSONifiable object to delete
                 * @returns {Promise.<boolean>} an indicator of the success or
                 *          failure of this request
                 */
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