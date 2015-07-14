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
        SOURCE = "_source";
    
    function SearchController($scope, $http, objectService, queryService, ROOT) {
        
        /*
        // Search through items for items which contain the search term in the name
        function search() {
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
                for (i = 0; i < itemsLength; i++) {
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
                
                $scope.results = searchResults; // Some redundancy
                return searchResults;
            });
        }
        */
        
        function search2() {
            var term = document.getElementById("searchinput").value;
            
            // Get the data...
            return $http({
                method: "GET",
                url: ROOT + "/_search",
                data: {
                    query: {
                        term: {
                            name: term
                        }
                    }
                }
            }).then(function (rawResults) {
                // ...then process the data 
                var results = rawResults.data.hits.hits,
                    resultsLength = results.length,
                    ids = [],
                    i;
                
                // Get the result objects' IDs
                for (i = 0; i < resultsLength; i++) {
                    ids.push(results[i][ID]);
                }
                
                // Get the objects themselves from their IDs
                return objectService.getObjects(ids).then(function (objects) {
                    var output = [],
                        id, 
                        j;
                    
                    for (j = 0; j < resultsLength; j++) {
                        id = ids[j];
                        output.push(objects[id]);
                    }
                    
                    console.log('final output', output);
                    return output;
                });
            });
        }

        return {
            search: function () {
                search2().then( function (c) {
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
            },
            
            getObjectByID: function (id) {
                console.log('getObjectByID called');
                objectService.getObjects([id]).then(function (out) {
                    console.log('object gotten by id', out[id]);
                    return out[id];
                });
            }
        };
    }
    return SearchController;
});


 ///// Old stuff to look at later 

                // Recursive search 
                /*
                var subList = [current],
                    i;
                console.log('children ', children);
                for (i = 0; i < children.length; i += 1) {
                    console.log('children[', i, ']', children[i]); 
                    subList.push(listHelper(children[i]));
                    console.log('subList', subList, 'index', i);
                }
                console.log('sublist ', subList);
                return subList;
                */
                /*
                var array = [current].concat(children.forEach(listHelper));
                console.log('array ', array);
                return array;
                */
                /*
                var subList = [];//= Promise.all([]);
                subList.push(current);
                for (var i = 0, len = children.length; i < len; i++) {
                    listHelper(children[i]).then(function (c) {
                        subList.concat(c);
                    });
                }
                return subList;//.then(function (c) {
                //    return c;
                //});
                */
