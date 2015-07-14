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
 * Module defining SearchController. Created by shale on 07/08/2015.
 */
define(function () {
    "use strict";
    
    // JSLint doesn't like underscore-prefixed properties,
    // so hide them here.
    var ID = "_id",
        SOURCE = "_source"; // TODO: Do we need this one? 
    
    function SearchController($scope, $http, objectService, queryService, ROOT) {
        
        // Search through items for items manually 
        // This is a fallback if other search services aren't avaliable
        // ... currently only searches 1 layer down (TODO)
        function searchFallback() {
            var term,
                searchResults = [],
                itemsLength,
                itemModel,
                itemName,
                i;
            
            // Search for user input by element id
            term = document.getElementById("searchinput").value;
            
            // Make not case sensitive
            term = term.toLocaleLowerCase();
            
            // Get items list
            return queryService.getItems().then(function (items) {
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
        
        // Use elasticsearch's search to search through all the objects
        function searchElastic(inputID, maxResults) {
            var searchTerm;
            
            // Check to see if the user provided a maximum 
            // number of results to display
            if (!maxResults) {
                // Else, we provide a default value 
                maxResults = 25;
            }
            
            // Get the user input 
            if (inputID) {
                searchTerm = document.getElementById(inputID).value;
            } else {
                // Backward compatibility? 
                // TODO: May be unnecsisary 
                searchTerm = document.getElementById("searchinput").value;
            }
            
            // Process search term
            // Put wildcards on front and end to allow substring behavior
            searchTerm = '*' + searchTerm + '*';
            
            // Get the data...
            return $http({
                method: "GET",
                url: ROOT + "/_search/?q=name:" + searchTerm + 
                            "&size=" + maxResults
            }).then(function (rawResults) {
                // ...then process the data 
                var results = rawResults.data.hits.hits,
                    resultsLength = results.length,
                    ids = [],
                    i;
                
                console.log('raw results', rawResults);
                
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
                    
                    console.log('final output', output);
                    return output;
                });
            });
        }

        return {
            // Search the database using the user input of id "searchinput"
            search: function (inputID) {
                searchElastic(inputID).then(function (c) {
                    $scope.results = c;
                });
            },
            
            // Check to see if there are any search results to display.
            areResults: function () {
                if ($scope.results) {
                    return $scope.results.length > 0;
                } else {
                    return false;
                }
            }
        };
    }
    return SearchController;
});
