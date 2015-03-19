/*global define*/

define(
    ["./CouchDocument"],
    function (CouchDocument) {
        'use strict';

        // JSLint doesn't like dangling _'s, but CouchDB uses these, so
        // hide this behind variables.
        var REV = "_rev",
            ID = "_id";

        /**
         * The CouchPersistenceProvider reads and writes JSON documents
         * (more specifically, domain object models) to/from a CouchDB
         * instance.
         * @constructor
         */
        function ElasticPersistenceProvider($http, $q, SPACE, PATH) {
            var spaces = [ SPACE ],
                revs = {};

            // Convert a subpath to a full path, suitable to pass
            // to $http.
            function url(subpath) {
                return PATH + '/' + subpath;
            }

            // Issue a request using $http; get back the plain JS object
            // from the expected JSON response
            function request(subpath, method, value) {
                return $http({
                    method: method,
                    url: url(subpath),
                    data: value
                }).then(function (response) {
                    return response.data;
                }, function () {
                    return undefined;
                });
            }

            // Shorthand methods for GET/PUT methods
            function get(subpath) {
                return request(subpath, "GET");
            }
            function put(subpath, value) {
                return request(subpath, "PUT", value);
            }

            // Pull out a list of document IDs from CouchDB's
            // _all_docs response
            function getIdsFromAllDocs(allDocs) {
                return allDocs.rows.map(function (r) { return r.id; });
            }

            // Get a domain object model out of CouchDB's response
            function getModel(response) {
                if (response && response.model) {
                    revs[response[ID]] = response[REV];
                    return response.model;
                } else {
                    return undefined;
                }
            }

            // Check the response to a create/update/delete request;
            // track the rev if it's valid, otherwise return false to
            // indicate that the request failed.
            function checkResponse(response) {
                if (response && response.ok) {
                    revs[response.id] = response.rev;
                    return response.ok;
                } else {
                    return false;
                }
            }

            return {
                /**
                 * List all persistence spaces which this provider
                 * recognizes.
                 *
                 * @returns {Promise.<string[]>} a promise for a list of
                 *          spaces supported by this provider
                 */
                listSpaces: function () {
                    return $q.when(spaces);
                },
                /**
                 * List all objects (by their identifiers) that are stored
                 * in the given persistence space, per this provider.
                 * @param {string} space the space to check
                 * @returns {Promise.<string[]>} a promise for the list of
                 *          identifiers
                 */
                listObjects: function (space) {
                    return get("_all_docs").then(getIdsFromAllDocs);
                },
                /**
                 * Create a new object in the specified persistence space.
                 * @param {string} space the space in which to store the object
                 * @param {string} key the identifier for the persisted object
                 * @param {object} value a JSONifiable object that should be
                 *        stored and associated with the provided identifier
                 * @returns {Promise.<boolean>} a promise for an indication
                 *          of the success (true) or failure (false) of this
                 *          operation
                 */
                createObject: function (space, key, value) {
                    return put(key, new CouchDocument(key, value))
                        .then(checkResponse);
                },

                /**
                 * Read an existing object back from persistence.
                 * @param {string} space the space in which to look for
                 *        the object
                 * @param {string} key the identifier for the persisted object
                 * @returns {Promise.<object>} a promise for the stored
                 *          object; this will resolve to undefined if no such
                 *          object is found.
                 */
                readObject: function (space, key) {
                    return get(key).then(getModel);
                },
                /**
                 * Update an existing object in the specified persistence space.
                 * @param {string} space the space in which to store the object
                 * @param {string} key the identifier for the persisted object
                 * @param {object} value a JSONifiable object that should be
                 *        stored and associated with the provided identifier
                 * @returns {Promise.<boolean>} a promise for an indication
                 *          of the success (true) or failure (false) of this
                 *          operation
                 */
                updateObject: function (space, key, value) {
                    return put(key, new CouchDocument(key, value, revs[key]))
                        .then(checkResponse);
                },
                /**
                 * Delete an object in the specified persistence space.
                 * @param {string} space the space from which to delete this
                 *        object
                 * @param {string} key the identifier of the persisted object
                 * @param {object} value a JSONifiable object that should be
                 *        deleted
                 * @returns {Promise.<boolean>} a promise for an indication
                 *          of the success (true) or failure (false) of this
                 *          operation
                 */
                deleteObject: function (space, key, value) {
                    return put(key, new CouchDocument(key, value, revs[key], true))
                        .then(checkResponse);
                }
            };

        }

        return ElasticPersistenceProvider;
    }
);