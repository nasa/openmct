/*global define*/

define(
    ["./CouchDocument"],
    function (CouchDocument) {
        'use strict';

        function CouchPersistenceProvider($http, $q, SPACE, PATH) {
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

            // Shorthand methods for various HTTP methods
            function get(subpath) {
                return request(subpath, "GET");
            }

            function put(subpath, value) {
                return request(subpath, "PUT", value);
            }

            function del(subpath, value) {
                return request(subpath, "DELETE", value);
            }

            function getIdsFromAllDocs(allDocs) {
                return allDocs.rows.map(function (r) { return r.id; });
            }

            /*jslint nomen: true */ // Allow the _id and _rev that couch provides
            function getModel(response) {
                if (response && response.model) {
                    revs[response._id] = response._rev;
                    return response.model;
                } else {
                    return undefined;
                }
            }

            function checkResponse(response) {
                if (response && response.ok) {
                    revs[response.id] = response.rev;
                    return response.ok;
                } else {
                    return undefined;
                }
            }

            return {
                listSpaces: function () {
                    return $q.when(spaces);
                },
                listObjects: function (space) {
                    return get("_all_docs").then(getIdsFromAllDocs);
                },
                createObject: function (space, key, value) {
                    return put(key, new CouchDocument(key, value))
                        .then(checkResponse);
                },
                readObject: function (space, key) {
                    return get(key).then(getModel);
                },
                updateObject: function (space, key, value) {
                    return put(key, new CouchDocument(key, value, revs[key]))
                        .then(checkResponse);
                },
                deleteObject: function (space, key, value) {
                    return put(key, new CouchDocument(key, value, revs[key], true))
                        .then(checkResponse);
                }
            };

        }

        return CouchPersistenceProvider;
    }
);