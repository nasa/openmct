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
        var ID = "_id";
        
        /**
         * The query service is responsible for creating an index 
         * of objects in the filetree which is searchable. 
         * @constructor
         */
        function QueryService($http, objectService, ROOT) {
            
            // Recursive helper function for getItems
            function listHelper(current) {
                var composition;
                if (current.hasCapability('composition')) {
                    composition = current.getCapability('composition');
                } else {
                    // Base case.
                    return current;
                }
                
                // Recursive case. Is asynchronous.
                return composition.invoke().then(function (children) {
                    var subList = [current],
                        i;
                    for (i = 0; i < children.length; i += 1) {
                        subList.push(listHelper(children[i]));
                    }
                    return subList;
                });
            }
            
            // Converts the filetree into a list
            // Used for the fallback 
            function getItems() {
                // Aquire My Items (root folder)
                return objectService.getObjects(['mine']).then(function (objects) {
                    return listHelper(objects.mine).then(function (c) {
                        return c;
                    });
                });
            }
            
            // Search through items for items manually 
            // This is a fallback if other search services aren't avaliable
            // ... currently only searches 1 layer down (TODO)
            function queryFallback(inputID) {
                var term,
                    searchResults = [],
                    itemsLength,
                    itemModel,
                    itemName,
                    i;

                // Get the user input 
                if (inputID) {
                    term = document.getElementById(inputID).value;
                } else {
                    // Backward compatibility? 
                    // TODO: May be unnecsisary 
                    term = document.getElementById("searchinput").value;
                }
                
                // Make not case sensitive
                term = term.toLocaleLowerCase();

                // Get items list
                return getItems().then(function (items) {
                    // (slight time optimization)
                    itemsLength = items.length;

                    // Then filter through the items list
                    for (i = 0; i < itemsLength; i += 1) {
                        // Prevent errors from getModel not being defined
                        if (items[i].getModel) {
                            itemModel = items[i].getModel();
                            itemName = itemModel.name.toLocaleLowerCase();

                            // Include any matching items, except folders 
                            // TODO: Should have a policy for this 
                            if (itemName.includes(term) && itemModel.type !== "folder") {
                                searchResults.push(items[i]);
                            }
                        }
                    }

                    //$scope.results = searchResults; // Some redundancy
                    return searchResults;
                });
            }
            
            // Currently specific to elasticsearch
            function processSearchTerm(searchTerm) {
                // Allow exact searches by checking to see if the first and last 
                // chars are quotes. 
                if ((searchTerm.substr(0, 1) === '"' && searchTerm.substr(searchTerm.length - 1, 1) === '"') ||
                        (searchTerm.substr(0, 1) === "'" && searchTerm.substr(searchTerm.length - 1, 1) === "'")) {
                    // Remove the quotes, because of how elasticsearch processses.
                    // This will mean that elasticsearch will return any object that has
                    // that searchTerm as a part of the name _separated by spaces_.
                    searchTerm = searchTerm.substring(1, searchTerm.length - 1);
                }
                // If the search starts with 'type:', then search for domain object type, rather 
                // than the domain object name.
                else if (searchTerm.includes('type:')) {
                    // Do nothing for now 
                } else if (searchTerm.includes('name:')) {
                    // Do nothing for now 
                } else {
                    // Put wildcards on front and end to allow substring behavior.
                    // This works when options like AND and OR are not used, which is 
                    // the case most of the time. 
                    // e.g. The input 'sine' become '*sine*', but the input 
                    //      'sine OR telemetry' becomes '*sine OR telemetry*' instead of 
                    //      '*sine* OR *telemetry*'
                    searchTerm = '*' + searchTerm + '*';
                    
                    // Assume that the search term is for the name by default
                    searchTerm = "name:" + searchTerm;
                }
                
                return searchTerm;
            }
            
            // Processes results from the format that elasticsearch resturns to 
            // a list of objects in the format that mct-representation can use. 
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
                        // TODO: Should have a policy for this 
                        if (objects[id].getModel) {
                            if (objects[id].getModel().type !== "folder") {
                                output.push(objects[id]);
                            }
                        }
                    }
                    
                    return output;
                });
            }
            
            // Use elasticsearch's search to search through all the objects
            function queryElasticsearch(inputID, maxResults) {
                var searchTerm;

                // Check to see if the user provided a maximum 
                // number of results to display
                if (!maxResults) {
                    // Else, we provide a default value 
                    maxResults = 25;
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
                // Takes a serach term and (optionally) the max number of results.
                query: queryElasticsearch
            };
        }

        return QueryService;
    }
);