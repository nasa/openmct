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
 * Module defining SearchAggregator. Created by shale on 07/16/2015.
 */
define(
    [],
    function () {
        "use strict";

        var DEFUALT_TIMEOUT =  1000,
            DEFAULT_MAX_RESULTS = 100;
        
        /**
         * Allows multiple services which provide search functionality 
         * to be treated as one.
         *
         * @constructor
         * @param {SearchProvider[]} providers the search providers to be
         *        aggregated
         */
        function SearchAggregator(providers) {
            var compiledResults = [];
            
            
            // Determines if a searchResult object is a valid type 
            // to be displayed as a final result. Is passed to the 
            // search providers as an argument.
            function validType(model) {
                // Nothing is currently disallowed
                return true;
            }
            
            // Remove extra objects that have the same ID 
            function filterRepeats(results) {
                var ids = [];
                
                for (var i = 0; i < results.length; i += 1) {
                    if (ids.indexOf(results[i].id) !== -1) {
                        // If this result's ID is already there, remove the object
                        results.splice(i, 1);
                        // Reduce loop index because we shortened the array 
                        i -= 1;
                    } else {
                        // Otherwise add the ID to the list of the ones we have seen 
                        ids.push(results[i].id);
                    }
                }
                
                return results;
            }
            
            // Order the objects from highest to lowest score in the array
            function orderByScore(results) {
                
                results = results.sort(function (a, b) {
                    if (a.score > b.score) {
                        return -1;
                    } else if (b.score > a.score) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                
                for (var i = 0; i < results.length; i++) {
                    console.log('score', results[i].score, 'for', results[i].object.getModel().name);
                }
                
                return results;
            }
            
            // 'Loop' over the promises using recursion so that the promises are fufilled by the
            // time that we are done
            function getPromisedResults(resultsPromises, promiseIndex, finalResults) {
                if (promiseIndex >= resultsPromises.length) {
                    return finalResults;
                } else {
                    return resultsPromises[promiseIndex].then(function (results) {
                        finalResults = finalResults.concat(results);
                        return getPromisedResults(resultsPromises, promiseIndex + 1, finalResults);
                    });
                }
            }
            
            function getPromisedItems(promises, index, fufilledPromises) {
                if (index >= promises.length) {
                    return fufilledPromises;
                } else {
                    return promises[index].then(function (results) {
                        fufilledPromises = fufilledPromises.concat(results);
                        return getPromisedItems(promises, index + 1, fufilledPromises);
                    });
                }
            }
            
            // Add more results to compiledResults
            // (As if the user presed 'load more results')
            function loadMore() {
                
            }
            
            // Add x number of items to the compiledResults as the initial number of results that 
            // we display 
            function initialLoad(firstPromises) {
                return getPromisedItems(firstPromises, 0, []).then(function (current) {
                    // Push the firsts onto the compiledResults
                    for (var i = 0; i < current.length; i++) {
                        if (current[i]) {
                            compiledResults.push(current[i]);
                        }
                    }
                    // Look for more results n times and add them to compiledResults
                    var outOfResults = [];
                    for (var i = 0; i < DEFAULT_MAX_RESULTS; i++) {
                        // If all of the providers are returning undefined, there are 
                        // no more results to load
                        if (current.every(function (c) {
                                        return c === undefined;
                                    })) {
                            break;
                        }
                        
                        // For each provider, load the next result and add it to compiledResults
                        for (var j = 0; j < current.length; j++) {
                            if (current[j]) {
                                var nextResult = current[j].next();
                                if (nextResult) {
                                    compiledResults.push(nextResult);
                                }
                                current[j] = nextResult;
                            }
                        }
                    }
                    
                    return compiledResults;
                });
            }
            
            // Recieves results in the format of a serachResult object. It 
            // has the members id, object, and score. It has a function 
            // next() which returns the next highest score search result 
            // for that search. 
            
            // Calls the searches of each of the providers, then 
            // merges the results lists so that there are not redundant 
            // results 
            function mergeResults(inputID) {
                //var resultsPromises = [];
                
                // The first result from each provider. Each should have a next() function.
                var firstPromises = [];
                
                // Get the initial result promises
                for (var i = 0; i < providers.length; i += 1) {
                    //resultsPromises.push(
                    firstPromises.push(
                        providers[i].query(
                            inputID, validType, DEFAULT_MAX_RESULTS, DEFUALT_TIMEOUT
                        )
                    );
                }
                
                // Wait for the promises to fufill
                return initialLoad(firstPromises).then(function (c) {
                    // Get rid of the repeated objects and put in correct order
                    c = filterRepeats(c);
                    c = orderByScore(c);
                    return c;
                });
                /*
                return getPromisedResults(resultsPromises, 0, []).then(function (c) {
                    // Get rid of the repeated objects and put in correct order
                    c = filterRepeats(c);
                    c = orderByScore(c);
                    return c;
                });
                */
            }
            
            return {
                query: mergeResults
            };
        }

        return SearchAggregator;
    }
);