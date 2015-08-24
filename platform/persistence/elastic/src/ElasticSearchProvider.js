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
 * Module defining ElasticSearchProvider. Created by shale on 07/16/2015.
 */
define(
    [],
    function () {
        "use strict";

        // JSLint doesn't like underscore-prefixed properties,
        // so hide them here.
        var ID = "_id",
            SCORE = "_score",
            DEFAULT_MAX_RESULTS = 100;
        
        /**
         * A search service which searches through domain objects in 
         * the filetree using ElasticSearch.
         *
         * @constructor
         * @param $http Angular's $http service, for working with urls.
         * @param {ObjectService} objectService the service from which
         *        domain objects can be gotten.
         * @param ROOT the constant `ELASTIC_ROOT` which allows us to
         *        interact with ElasticSearch.
         */
        function ElasticSearchProvider($http, objectService, ROOT) {
            this.$http = $http;
            this.objectService = objectService;
            this.root = ROOT;
        }

        /**
         * Searches through the filetree for domain objects using a search
         *   term. This is done through querying elasticsearch. Returns a
         *   promise for a result object that has the format
         *   {hits: searchResult[], total: number, timedOut: boolean}
         *   where a searchResult has the format
         *   {id: string, object: domainObject, score: number}
         *
         * Notes:
         *   * The order of the results is from highest to lowest score,
         *     as elsaticsearch determines them to be.
         *   * Uses the fuzziness operator to get more results.
         *   * More about this search's behavior at
         *     https://www.elastic.co/guide/en/elasticsearch/reference/current/search-uri-request.html
         *
         * @param searchTerm The text input that is the query.
         * @param timestamp The time at which this function was called.
         *   This timestamp is used as a unique identifier for this
         *   query and the corresponding results.
         * @param maxResults (optional) The maximum number of results
         *   that this function should return.
         * @param timeout (optional) The time after which the search should
         *   stop calculations and return partial results. Elasticsearch
         *   does not guarentee that this timeout will be strictly followed.
         */
        ElasticSearchProvider.prototype.query = function query(searchTerm, timestamp, maxResults, timeout) {
            var $http = this.$http,
                objectService = this.objectService,
                root = this.root,
                esQuery;
            
            function addFuzziness(searchTerm, editDistance) {
                if (!editDistance) {
                    editDistance = '';
                }

                return searchTerm.split(' ').map(function (s) {
                    // Don't add fuzziness for quoted strings
                    if (s.indexOf('"') !== -1) {
                        return s;
                    } else {
                        return s + '~' + editDistance;
                    }
                }).join(' ');
            }

            // Currently specific to elasticsearch
            function processSearchTerm(searchTerm) {
                var spaceIndex;

                // Cut out any extra spaces
                while (searchTerm.substr(0, 1) === ' ') {
                    searchTerm = searchTerm.substring(1, searchTerm.length);
                }
                while (searchTerm.substr(searchTerm.length - 1, 1) === ' ') {
                    searchTerm = searchTerm.substring(0, searchTerm.length - 1);
                }
                spaceIndex = searchTerm.indexOf('  ');
                while (spaceIndex !== -1) {
                    searchTerm = searchTerm.substring(0, spaceIndex) +
                    searchTerm.substring(spaceIndex + 1, searchTerm.length);
                    spaceIndex = searchTerm.indexOf('  ');
                }

                // Add fuzziness for completeness
                searchTerm = addFuzziness(searchTerm);

                return searchTerm;
            }

            // Processes results from the format that elasticsearch returns to
            // a list of searchResult objects, then returns a result object
            // (See documentation for query for object descriptions)
            function processResults(rawResults, timestamp) {
                var results = rawResults.data.hits.hits,
                    resultsLength = results.length,
                    ids = [],
                    scores = {},
                    searchResults = [],
                    i;

                // Get the result objects' IDs
                for (i = 0; i < resultsLength; i += 1) {
                    ids.push(results[i][ID]);
                }

                // Get the result objects' scores
                for (i = 0; i < resultsLength; i += 1) {
                    scores[ids[i]] = results[i][SCORE];
                }

                // Get the domain objects from their IDs
                return objectService.getObjects(ids).then(function (objects) {
                    var j,
                        id;

                    for (j = 0; j < resultsLength; j += 1) {
                        id = ids[j];

                        // Include items we can get models for
                        if (objects[id].getModel) {
                            // Format the results as searchResult objects
                            searchResults.push({
                                id: id,
                                object: objects[id],
                                score: scores[id]
                            });
                        }
                    }

                    return {
                        hits: searchResults,
                        total: rawResults.data.hits.total,
                        timedOut: rawResults.data.timed_out
                    };
                });
            }


            // Check to see if the user provided a maximum
            // number of results to display
            if (!maxResults) {
                // Else, we provide a default value.
                maxResults = DEFAULT_MAX_RESULTS;
            }

            // If the user input is empty, we want to have no search results.
            if (searchTerm !== '' && searchTerm !== undefined) {
                // Process the search term
                searchTerm = processSearchTerm(searchTerm);

                // Create the query to elasticsearch
                esQuery = root + "/_search/?q=" + searchTerm +
                "&size=" + maxResults;
                if (timeout) {
                    esQuery += "&timeout=" + timeout;
                }

                // Get the data...
                return this.$http({
                    method: "GET",
                    url: esQuery
                }).then(function (rawResults) {
                    // ...then process the data
                    return processResults(rawResults, timestamp);
                }, function (err) {
                    // In case of error, return nothing. (To prevent
                    //   infinite loading time.)
                    return {hits: [], total: 0};
                });
            } else {
                return {hits: [], total: 0};
            }
        };


        return ElasticSearchProvider;
    }
);