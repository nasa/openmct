/*global define*/

/**
 * Stubbed implementation of a persistence provider,
 * to permit objects to be created, saved, etc.
 */
define(
    [],
    function () {
        'use strict';



        function BrowserPersistenceProvider($q, SPACE) {
            var spaces = SPACE ? [SPACE] : [],
                caches = {},
                promises = {
                    as: function (value) {
                        return $q.when(value);
                    }
                };

            spaces.forEach(function (space) {
                caches[space] = {};
            });

            return {
                listSpaces: function () {
                    return promises.as(spaces);
                },
                listObjects: function (space) {
                    var cache = caches[space];
                    return promises.as(
                        cache ? Object.keys(cache) : null
                    );
                },
                createObject: function (space, key, value) {
                    var cache = caches[space];

                    if (!cache || cache[key]) {
                        return promises.as(null);
                    }

                    cache[key] = value;

                    return promises.as(true);
                },
                readObject: function (space, key) {
                    var cache = caches[space];
                    return promises.as(
                        cache ? cache[key] : null
                    );
                },
                updateObject: function (space, key, value) {
                    var cache = caches[space];

                    if (!cache || !cache[key]) {
                        return promises.as(null);
                    }

                    cache[key] = value;

                    return promises.as(true);
                },
                deleteObject: function (space, key, value) {
                    var cache = caches[space];

                    if (!cache || !cache[key]) {
                        return promises.as(null);
                    }

                    delete cache[key];

                    return promises.as(true);
                }
            };

        }

        return BrowserPersistenceProvider;
    }
);