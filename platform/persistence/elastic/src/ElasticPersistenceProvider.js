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
        'use strict';

        // JSLint doesn't like underscore-prefixed properties,
        // so hide them here.
        var SRC = "_source",
            REV = "_version",
            ID = "_id",
            CONFLICT = 409;

        /**
         * The ElasticPersistenceProvider reads and writes JSON documents
         * (more specifically, domain object models) to/from an ElasticSearch
         * instance.
         * @memberof platform/persistence/elastic
         * @constructor
         */
        function ElasticPersistenceProvider($http, $q, SPACE, ROOT, PATH) {
            var spaces = [ SPACE ],
                revs = {};

            // Convert a subpath to a full path, suitable to pass
            // to $http.
            function url(subpath) {
                return ROOT + '/' + PATH + '/' + subpath;
            }

            // Issue a request using $http; get back the plain JS object
            // from the expected JSON response
            function request(subpath, method, value, params) {
                return $http({
                    method: method,
                    url: url(subpath),
                    params: params,
                    data: value
                }).then(function (response) {
                    return response.data;
                }, function (response) {
                    return (response || {}).data;
                });
            }

            // Shorthand methods for GET/PUT methods
            function get(subpath) {
                return request(subpath, "GET");
            }
            function put(subpath, value, params) {
                return request(subpath, "PUT", value, params);
            }
            function del(subpath) {
                return request(subpath, "DELETE");
            }

            // Get a domain object model out of CouchDB's response
            function getModel(response) {
                if (response && response[SRC]) {
                    revs[response[ID]] = response[REV];
                    return response[SRC];
                } else {
                    return undefined;
                }
            }

            // Handle an update error
            function handleError(response, key) {
                var error = new Error("Persistence error.");
                if ((response || {}).status === CONFLICT) {
                    error.key = "revision";
                    // Load the updated model, then reject the promise
                    return get(key).then(function (response) {
                        error.model = response[SRC];
                        return $q.reject(error);
                    });
                }
                // Reject the promise
                return $q.reject(error);
            }

            // Check the response to a create/update/delete request;
            // track the rev if it's valid, otherwise return false to
            // indicate that the request failed.
            function checkResponse(response, key) {
                var error;
                if (response && !response.error) {
                    revs[key] = response[REV];
                    return response;
                } else {
                    return handleError(response, key);
                }
            }

            return {
                /**
                 * List all persistence spaces which this provider
                 * recognizes.
                 *
                 * @returns {Promise.<string[]>} a promise for a list of
                 *          spaces supported by this provider
                 * @memberof platform/persistence/elastic.ElasticPersistenceProvider#
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
                 * @memberof platform/persistence/elastic.ElasticPersistenceProvider#
                 */
                listObjects: function (space) {
                    return $q.when([]);
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
                 * @memberof platform/persistence/elastic.ElasticPersistenceProvider#
                 */
                createObject: function (space, key, value) {
                    return put(key, value).then(checkResponse);
                },

                /**
                 * Read an existing object back from persistence.
                 * @param {string} space the space in which to look for
                 *        the object
                 * @param {string} key the identifier for the persisted object
                 * @returns {Promise.<object>} a promise for the stored
                 *          object; this will resolve to undefined if no such
                 *          object is found.
                 * @memberof platform/persistence/elastic.ElasticPersistenceProvider#
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
                 * @memberof platform/persistence/elastic.ElasticPersistenceProvider#
                 */
                updateObject: function (space, key, value) {
                    function checkUpdate(response) {
                        return checkResponse(response, key);
                    }
                    return put(key, value, { version: revs[key] })
                        .then(checkUpdate);
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
                 * @memberof platform/persistence/elastic.ElasticPersistenceProvider#
                 */
                deleteObject: function (space, key, value) {
                    return del(key).then(checkResponse);
                }
            };

        }

        return ElasticPersistenceProvider;
    }
);
