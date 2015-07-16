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
 * Module defining QueryService. Created by shale on 07/13/2015.
 */
define(
    [],
    function () {
        "use strict";
        
        // JSLint doesn't like underscore-prefixed properties,
        // so hide them here.
        var ID = "_id",
            SCORE = "_score";
        
        /**
         * The query service is responsible for searching through 
         *   objects in the filetree. There are multiple possible 
         *   implementations for querying. Currently there is 
         *   queryManual (which manually steps through the filetree)
         *   and queryElasticsearch (which passes the work on to 
         *   elasticsearch). 
         * @constructor
         */
        function QueryService($http, objectService, ROOT) {
            var DEFAULT_MAX_RESULTS = 100;
            
            /////////////// The following is for non-Elastic Search ///////////////// 
            
            // Recursive helper function for getItems()
            function itemsHelper(children, i) {
                if (i >= children.length) {
                    // Done!
                    return children;
                } else if (children[i].hasCapability('composition')) {
                    // This child has children
                    return children[i].getCapability('composition').invoke().then(function (grandchildren) {
                        // Add grandchildren to the end of the list
                        // They will also be checked for composition
                        return itemsHelper(children.concat(grandchildren), i + 1);
                    });
                } else {
                    // This child is a leaf
                    return itemsHelper(children, i + 1);
                }
            }
            
            // Converts the filetree into a list
            // Used for queryManual()
            function getItems() {
                // Aquire My Items (root folder)
                return objectService.getObjects(['mine']).then(function (objects) {
                    // Get all of its descendents
                    return itemsHelper([objects.mine], 0).then(function (c) {
                        return c;
                    });
                });
            }
            
            /**
             * Searches through the filetree for domain objects which match 
             *   the search term. This function is to be used as a fallback 
             *   in the case where other search services are not avaliable. 
             * Notes: 
             *   * The order of the results is not guarenteed.
             *   * A domain object qualifies as a match for a search term if 
             *     the object's name property contains the exact search term 
             *     as a substring. 
             *   * Folders are not included in the results.
             *   * Wildcards are not supported. 
             * 
             * @param inputID the name of the ID property of the html text 
             *   input where this funcion should find the search term 
             * @param maxResults (optional) the maximum number of results 
             *   that this function should return 
             */
            function queryManual(inputID, maxResults) {
                var term,
                    searchResults = [],
                    resultsLength,
                    itemModel,
                    itemName,
                    i;
                
                // Check to see if the user provided a maximum 
                // number of results to display
                if (!maxResults) {
                    // Else, we provide a default value. 
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                
                // Get the user input
                term = document.getElementById(inputID).value;
                
                // Make not case sensitive
                term = term.toLocaleLowerCase();

                // Get items list
                return getItems().then(function (items) {
                    // Keep track of the number of results to display
                    if (items.length < maxResults) {
                        resultsLength = items.length;
                    } else {
                        resultsLength = maxResults;
                    }

                    // Then filter through the items list
                    for (i = 0; i < resultsLength; i += 1) {
                        // Prevent errors from getModel not being defined
                        if (items[i].getModel) {
                            itemModel = items[i].getModel();
                            itemName = itemModel.name.toLocaleLowerCase();

                            // Include any matching items, except folders 
                            if (itemName.includes(term) && itemModel.type !== "folder") {
                                searchResults.push(items[i]);
                            }
                        }
                    }
                    
                    return searchResults;
                });
            }
            
            /////////////// The following is for Elastic Search /////////////////
            
            // Check to see if the input has any special options
            // Used by queryElasticsearch()
            function isDefaultFormat(searchTerm) {
                // If the input has a property option, not default
                if (searchTerm.includes('name:') || searchTerm.includes('type:')) {
                    return false;
                }
                
                return true;
            }
            
            // Add the fuzziness operator to the search term 
            // Used by queryElasticsearch()
            function addFuzziness(searchTerm, editDistance) {
                if (!editDistance) {
                    editDistance = '';
                }
                
                return searchTerm.split(' ').map(function (s) {
                    if (s.includes('"')) {
                        console.log('true');
                        return s;
                    } else {
                        return s + '~' + editDistance;
                    }
                }).join(' ');
            }
            
            // Currently specific to elasticsearch
            // Used by queryElasticsearch()
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
                
                console.log('search term ', searchTerm);
                return searchTerm;
            }
            
            // Processes results from the format that elasticsearch returns to 
            // a list of objects in the format that mct-representation can use. 
            // Used by queryElasticsearch()
            function processResults(rawResults) {
                var results = rawResults.data.hits.hits,
                    resultsLength = results.length,
                    ids = [],
                    i;
                
                if (rawResults.data.hits.total > resultsLength) {
                    // TODO: Somehow communicate this to the user 
                    console.log('Total number of results greater than displayed results');
                }
                
                // Get the result objects' IDs
                for (i = 0; i < resultsLength; i += 1) {
                    ids.push(results[i][ID]);
                }
                
                // Get the domain objects from their IDs
                return objectService.getObjects(ids).then(function (objects) {
                    var output = [],
                        id,
                        j;
                    
                    for (j = 0; j < resultsLength; j += 1) {
                        id = ids[j];
                        
                        // Include any item except folders 
                        if (objects[id].getModel) {
                            if (objects[id].getModel().type !== "folder") {
                                output.push(objects[id]);
                            }
                        }
                    }
                    
                    return output;
                });
            }
            
            /**
             * Searches through the filetree for domain objects using a search 
             *   term. This is done through querying elasticsearch. 
             * Notes:
             *   * The order of the results is from highest to lowest score, 
             *     as elsaticsearch determines them to be. 
             *   * Folders are not included in the results.
             *   * Wildcards are supported. 
             *   * Fuzziness is used to produce more results that are still
             *     relevant. (All results within a certain edit distance.)
             *   * More search details at 
             *     https://www.elastic.co/guide/en/elasticsearch/reference/current/search-uri-request.html
             * 
             * @param inputID the name of the ID property of the html text 
             *   input where this funcion should find the search term 
             * @param maxResults (optional) the maximum number of results 
             *   that this function should return 
             */
            function queryElasticsearch(inputID, maxResults) {
                var searchTerm;
                
                // Check to see if the user provided a maximum 
                // number of results to display
                if (!maxResults) {
                    // Else, we provide a default value. 
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                
                // Get the user input 
                searchTerm = document.getElementById(inputID).value;
                
                // Process search term
                searchTerm = processSearchTerm(searchTerm);
                
                // Get the data...
                return $http({
                    method: "GET",
                    url: ROOT + "/_search/?q=" + searchTerm +
                                "&size=" + maxResults
                }).then(function (rawResults) {
                    // ...then process the data 
                    return processResults(rawResults);
                });
            }
            
            return {
                query: queryElasticsearch
            };
        }

        return QueryService;
    }
);