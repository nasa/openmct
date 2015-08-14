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
 * This bundle implements a persistence service which uses CouchDB to
 * store documents.
 * @namespace platform/persistence/cache
 */
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
         * @memberof platform/persistence/couch
         * @constructor
         * @implements {PersistenceService}
         * @param $http Angular's $http service
         * @param $interval Angular's $interval service
         * @param {string} space the name of the persistence space being served
         * @param {string} path the path to the CouchDB instance
         */
        function CouchPersistenceProvider($http, $q, space, path) {
            this.spaces = [ space ];
            this.revs = {};
            this.$q = $q;
            this.$http = $http;
            this.path = path;
        }

        function bind(fn, thisArg) {
            return function () {
                return fn.apply(thisArg, arguments);
            };
        }

        // Pull out a list of document IDs from CouchDB's
        // _all_docs response
        function getIdsFromAllDocs(allDocs) {
            return allDocs.rows.map(function (r) { return r.id; });
        }

        // Check the response to a create/update/delete request;
        // track the rev if it's valid, otherwise return false to
        // indicate that the request failed.
        function checkResponse(response) {
            if (response && response.ok) {
                this.revs[response.id] = response.rev;
                return response.ok;
            } else {
                return false;
            }
        }

        // Get a domain object model out of CouchDB's response
        function getModel(response) {
            if (response && response.model) {
                this.revs[response[ID]] = response[REV];
                return response.model;
            } else {
                return undefined;
            }
        }

        // Issue a request using $http; get back the plain JS object
        // from the expected JSON response
        CouchPersistenceProvider.prototype.request = function (subpath, method, value) {
            return this.$http({
                method: method,
                url: this.path + '/' + subpath,
                data: value
            }).then(function (response) {
                return response.data;
            }, function () {
                return undefined;
            });
        };

        // Shorthand methods for GET/PUT methods
        CouchPersistenceProvider.prototype.get = function (subpath) {
            return this.request(subpath, "GET");
        };

        CouchPersistenceProvider.prototype.put = function (subpath, value) {
            return this.request(subpath, "PUT", value);
        };


        CouchPersistenceProvider.prototype.listSpaces = function () {
            return this.$q.when(this.spaces);
        };

        CouchPersistenceProvider.prototype.listObjects = function (space) {
            return this.get("_all_docs").then(bind(getIdsFromAllDocs, this));
        };

        CouchPersistenceProvider.prototype.createObject = function (space, key, value) {
            return this.put(key, new CouchDocument(key, value))
                .then(bind(checkResponse, this));
        };


        CouchPersistenceProvider.prototype.readObject = function (space, key) {
            return this.get(key).then(bind(getModel, this));
        };

        CouchPersistenceProvider.prototype.updateObject = function (space, key, value) {
            var rev = this.revs[key];
            return this.put(key, new CouchDocument(key, value, rev))
                .then(bind(checkResponse, this));
        };

        CouchPersistenceProvider.prototype.deleteObject = function (space, key, value) {
            var rev = this.revs[key];
            return this.put(key, new CouchDocument(key, value, rev, true))
                .then(bind(checkResponse, this));
        };

        return CouchPersistenceProvider;
    }
);
