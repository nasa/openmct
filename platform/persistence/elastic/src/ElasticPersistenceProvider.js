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
 * This bundle implements a persistence service which uses ElasticSearch to
 * store documents.
 * @namespace platform/persistence/elastic
 */
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
         * @implements {PersistenceService}
         * @param $http Angular's $http service
         * @param $interval Angular's $interval service
         * @param {string} space the name of the persistence space being served
         * @param {string} root the root of the path to ElasticSearch
         * @param {stirng} path the path to domain objects within ElasticSearch
         */
        function ElasticPersistenceProvider($http, $q, space, root, path) {
            this.spaces = [ space ];
            this.revs = {};
            this.$http = $http;
            this.$q = $q;
            this.root = root;
            this.path = path;
        }

        function bind(fn, thisArg) {
            return function () {
                return fn.apply(thisArg, arguments);
            };
        }

        // Issue a request using $http; get back the plain JS object
        // from the expected JSON response
        ElasticPersistenceProvider.prototype.request = function (subpath, method, value, params) {
            return this.$http({
                method: method,
                url: this.root + '/' + this.path + '/' + subpath,
                params: params,
                data: value
            }).then(function (response) {
                return response.data;
            }, function (response) {
                return (response || {}).data;
            });
        };

        // Shorthand methods for GET/PUT methods
        ElasticPersistenceProvider.prototype.get = function (subpath) {
            return this.request(subpath, "GET");
        };
        ElasticPersistenceProvider.prototype.put = function (subpath, value, params) {
            return this.request(subpath, "PUT", value, params);
        };
        ElasticPersistenceProvider.prototype.del = function (subpath) {
            return this.request(subpath, "DELETE");
        };


        // Handle an update error
        ElasticPersistenceProvider.prototype.handleError = function (response, key) {
            var error = new Error("Persistence error."),
                $q = this.$q;
            if ((response || {}).status === CONFLICT) {
                error.key = "revision";
                // Load the updated model, then reject the promise
                return this.get(key).then(function (response) {
                    error.model = response[SRC];
                    return $q.reject(error);
                });
            }
            // Reject the promise
            return this.$q.reject(error);
        };

        // Get a domain object model out of ElasticSearch's response
        function getModel(response) {
            if (response && response[SRC]) {
                this.revs[response[ID]] = response[REV];
                return response[SRC];
            } else {
                return undefined;
            }
        }

        // Check the response to a create/update/delete request;
        // track the rev if it's valid, otherwise return false to
        // indicate that the request failed.
        ElasticPersistenceProvider.prototype.checkResponse = function (response, key) {
            if (response && !response.error) {
                this.revs[key] = response[REV];
                return response;
            } else {
                return this.handleError(response, key);
            }
        };

        // Public API
        ElasticPersistenceProvider.prototype.listSpaces = function () {
            return this.$q.when(this.spaces);
        };

        ElasticPersistenceProvider.prototype.listObjects = function () {
            // Not yet implemented
            return this.$q.when([]);
        };


        ElasticPersistenceProvider.prototype.createObject = function (space, key, value) {
            return this.put(key, value).then(bind(this.checkResponse, this));
        };

        ElasticPersistenceProvider.prototype.readObject = function (space, key) {
            return this.get(key).then(bind(getModel, this));
        };

        ElasticPersistenceProvider.prototype.updateObject = function (space, key, value) {
            function checkUpdate(response) {
                return this.checkResponse(response, key);
            }
            return this.put(key, value, { version: this.revs[key] })
                .then(bind(checkUpdate, this));
        };

        ElasticPersistenceProvider.prototype.deleteObject = function (space, key, value) {
            return this.del(key).then(bind(this.checkResponse, this));
        };

        return ElasticPersistenceProvider;
    }
);
