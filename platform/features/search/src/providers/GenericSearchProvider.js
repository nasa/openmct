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
 * Module defining GenericSearchProvider. Created by shale on 07/16/2015.
 */
define(
    [],
    function () {
        "use strict";
        
        var DEFAULT_MAX_RESULTS = 100;
        
        /**
         * A model service which reads domain object models from an external
         * persistence service.
         *
         * @constructor
         * @param {PersistenceService} persistenceService the service in which
         *        domain object models are persisted.
         * @param $q Angular's $q service, for working with promises
         * @param {string} SPACE the name of the persistence space from which
         *        models should be retrieved.
         */
        function GenericSearchProvider(objectService) {
            
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
            function getItems() {
                // Aquire My Items (root folder)
                return objectService.getObjects(['mine']).then(function (objects) {
                    // Get all of its descendents
                    return itemsHelper([objects.mine], 0).then(function (items) {
                        // Turn them into searchResult objects (object, id, and score)
                        var searchResultItems = [];
                        
                        for (var i = 0; i < items.length; i += 1) {
                            searchResultItems.push({
                                id: items[i].getId(),
                                object: items[i],
                                score: 0 // Assign actual score when filtering for term
                            });
                        }
                        
                        //console.log('searchResultItems (in Everything)', searchResultItems);
                        return searchResultItems;
                    });
                });
            }
            
            // Process the search input. Makes an array of search terms
            // by splitting up the input at spaces. 
            function process(input) {
                return input.toLocaleLowerCase().split(' ');
            }
            
            // Generate a score for an item based on its similarity to a search term.
            // The score is equal to the number of terms that are a substring of the 
            // object name.
            function score(item, terms, originalInput) {
                var name = item.object.getModel().name.toLocaleLowerCase(),
                    weight = .65,
                    score = 0;
                
                // Make the score really big if the item name and 
                // the original search input are the same
                if (name === originalInput.toLocaleLowerCase()) {
                    score = 42;
                }
                
                for (var i = 0; i < terms.length; i++) {
                    // Increase the score if the term is in the item name
                    if (name.includes(terms[i])) {
                        score++;
                        
                        // Add extra to the score if the search term exists
                        // as its own term within the items
                        if (name.split(' ').indexOf(terms[i]) !== -1) {
                            score += .5;
                        }
                    }
                }
                
                return score * weight;
            }
            
            // Filter through a list of searchResults based on a search term 
            function filterResults(results, originalInput, resultsLength, validType) {
                var terms, 
                    searchResults = [],
                    itemModel;
                
                // Split the original search input into search terms
                terms = process(originalInput);
                
                for (var i = 0; i < resultsLength; i += 1) {
                    // Prevent errors from getModel not being defined
                    if (results[i].object.getModel) {
                        results[i].score = score(results[i], terms, originalInput);
                        // Include any items that match the terms and are of valid type
                        if (results[i].score > 0 && validType(results[i].object.getModel())) {
                            // Add the result to the result list
                            searchResults.push(results[i]);
                        }
                    }
                }
                
                return searchResults;
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
             *   * Wildcards are not supported. 
             * 
             * @param inputID the name of the ID property of the html text 
             *   input where this funcion should find the search term 
             * @param validType a function which takes a model for an object
             *   and determines if it is of a valid type to include in the 
             *   final list of results
             * @param maxResults (optional) the maximum number of results 
             *   that this function should return 
             */
            function queryGeneric(inputID, validType, maxResults) {
                var input,
                    terms = [],
                    searchResults = [],
                    resultsLength;
                
                // Check to see if the user provided a maximum 
                // number of results to display
                if (!maxResults) {
                    // Else, we provide a default value. 
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                
                // Get the user input
                input = document.getElementById(inputID).value;
                
                // Get items list
                return getItems().then(function (searchResultItems) {
                    // Keep track of the number of results to display
                    if (searchResultItems.length < maxResults) {
                        resultsLength = searchResultItems.length;
                    } else {
                        resultsLength = maxResults;
                    }

                    // Then filter through the items list
                    searchResults = filterResults(searchResultItems, input, resultsLength, validType);
                    
                    //console.log('filtered searchResults (in Everything)', searchResults);
                    return searchResults;
                });
            }
            
            return {
                query: queryGeneric
            };
        }


        return GenericSearchProvider;
    }
);