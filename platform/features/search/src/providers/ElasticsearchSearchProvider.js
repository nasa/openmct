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
 * Module defining ElasticsearchSearchProvider. Created by shale on 07/16/2015.
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
         * @param ROOT the constant ELASTIC_ROOT which allows us to 
         *        interact with ElasticSearch.
         */
        function ElasticsearchSearchProvider($http, objectService, ROOT) {
            var latestResults = [],
                lastSearchTimestamp = 0;
            
            // Check to see if the input has any special options
            function isDefaultFormat(searchTerm) {
                // If the input has a property option, not default
                if (searchTerm.includes('name:') || searchTerm.includes('type:')) {
                    return false;
                }
                
                return true;
            }
            
            // Add the fuzziness operator to the search term 
            function addFuzziness(searchTerm, editDistance) {
                if (!editDistance) {
                    editDistance = '';
                }
                
                return searchTerm.split(' ').map(function (s) {
                    if (s.includes('"')) {
                        return s;
                    } else {
                        return s + '~' + editDistance;
                    }
                }).join(' ');
            }
            
            // Currently specific to elasticsearch
            function processSearchTerm(searchTerm) {
                // Shave any spaces off of the ends of the input
                while (searchTerm.substr(0, 1) === ' ') {
                    searchTerm = searchTerm.substring(1, searchTerm.length);
                }
                while (searchTerm.substr(searchTerm.length - 1, 1) === ' ') {
                    searchTerm = searchTerm.substring(0, searchTerm.length - 1);
                }
                
                if (isDefaultFormat(searchTerm)) {
                    // Add fuzziness for completeness
                    searchTerm = addFuzziness(searchTerm);
                    
                    // Searching 'name' by default
                    searchTerm = 'name:' + searchTerm;
                }
                
                //console.log('search term ', searchTerm);
                return searchTerm;
            }
            
            // Processes results from the format that elasticsearch returns to 
            // a list of objects in the format that mct-representation can use
            function processResults(rawResults, timestamp) {
                var results = rawResults.data.hits.hits,
                    resultsLength = results.length,
                    ids = [],
                    scores = {},
                    searchResults = [],
                    i;
                
                /*
                if (rawResults.data.hits.total > resultsLength) {
                    // TODO: Somehow communicate this to the user 
                    //console.log('Total number of results greater than displayed results');
                }
                */
                
                // Get the result objects' IDs
                for (i = 0; i < resultsLength; i += 1) {
                    ids.push(results[i][ID]);
                }
                
                // Get the result objects' scores
                for (i = 0; i < resultsLength; i += 1) {
                    //scores.push(results[i][SCORE]);
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
                    
                    latestResults = searchResults;
                    lastSearchTimestamp = timestamp;
                    return searchResults;
                });
            }
            
            // For documentation, see query below.
            function queryElasticsearch(searchTerm, timestamp, maxResults, timeout) {
                var esQuery;
                
                // Check to see if the user provided a maximum 
                // number of results to display
                if (!maxResults) {
                    // Else, we provide a default value. 
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                
                // If the user input is empty, we want to have no search results.
                if (searchTerm !== '') {
                    // Process search term
                    searchTerm = processSearchTerm(searchTerm);

                    // Create the query to elasticsearch
                    esQuery = ROOT + "/_search/?q=" + searchTerm +
                                     "&size=" + maxResults;
                    if (timeout) {
                        esQuery += "&timeout=" + timeout;
                    }

                    // Get the data...
                    return $http({
                        method: "GET",
                        url: esQuery
                    }).then(function (rawResults) {
                        // ...then process the data 
                        return processResults(rawResults, timestamp);
                    });
                } else {
                    latestResults = [];
                    lastSearchTimestamp = timestamp;
                    return latestResults;
                }
            }
            
            return {
                /**
                 * Searches through the filetree for domain objects using a search 
                 *   term. This is done through querying elasticsearch. 
                 * Notes:
                 *   * The order of the results is from highest to lowest score, 
                 *     as elsaticsearch determines them to be. 
                 *   * Fuzziness is used to produce more results that are still
                 *     relevant. (All results within a certain edit distance.)
                 *   * More search details at 
                 *     https://www.elastic.co/guide/en/elasticsearch/reference/current/search-uri-request.html
                 * 
                 * @param searchTerm The text input that is the query. 
                 *   input where this funcion should find the search term 
                 * @param timestamp the time at which this function was called,
                 *   this timestamp will be associated with the latest results
                 *   list, which allows the aggregator to see if it has been 
                 *   updated 
                 * @param maxResults (optional) the maximum number of results 
                 *   that this function should return 
                 * @param timeout (optional) the time after which the search should 
                 *   stop calculations and return partial results
                 */
                query: queryElasticsearch,
                
                /** 
                 * Get the latest search results that have been calculated. The 
                 *   format of the returned objects are searchResult objects, which
                 *   have the members id, object, and score. 
                 */
                getLatestResults: function () {
                    return latestResults;
                },
                
                /** 
                 * Get the timestamp for the last update of latestResults.
                 */
                getLatestTimestamp: function () {
                    return lastSearchTimestamp;
                }
            };
        }


        return ElasticsearchSearchProvider;
    }
);