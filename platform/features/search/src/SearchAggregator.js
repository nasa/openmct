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
            var latestMergedResults = [];
            
            // Remove extra objects that have the same ID 
            function filterRepeats(results) {
                var ids = [],
                    idToIndicies = {}, // 'dictionary' mapping IDs to a list of indicies 
                    filteredResults = [];
                
                // Create a list of indicies of objects that correspond to any object ID
                for (var i = 0; i < results.length; i++) {
                    var id = results[i].id;
                    
                    if (idToIndicies[id]) {
                        // If the ID already exists in the dictionary, push this index to 
                        // the end of the array it points to
                        idToIndicies[id].push(i);
                    } else {
                        // Else make a new entry in the dictionary with this ID, pointing 
                        // to this index
                        idToIndicies[id] = [i];
                        // And also add this ID to the list of IDs that we have seen
                        ids.push(id);
                    }
                }
                
                // Now for each ID in the dictionary, we want to use the version of  
                // the object that has a higher score
                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i],
                        indicies = idToIndicies[id],
                        highestScoringObject;
                    
                    highestScoringObject = results[ indicies[0] ];
                    for (var j = 0; j < indicies.length; j++) {
                        // If the score of the object corresponding to this index of the results 
                        // list has a higher score than the one we have, choose it instead
                        if (results[indicies[j]].score > highestScoringObject.score) {
                            highestScoringObject = results[indicies[j]];
                        }
                    }
                    filteredResults.push(highestScoringObject);
                }

                return filteredResults;
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
                
                return results;
            }
            
            function updateResults() {
                var newerResults = [];
                
                // For each provider, get its most recent results
                for (var i = 0; i < providers.length; i += 1) {
                    newerResults = newerResults.concat(providers[i].getLatest());
                }
                
                // Clean up 
                newerResults = filterRepeats(newerResults);
                newerResults = orderByScore(newerResults);
                
                // After all that is done, now replace latestMergedResults with this
                latestMergedResults = newerResults;
            }
            
            // Calls the searches of each of the providers, then 
            // merges the results lists so that there are not redundant 
            // results 
            /** 
             * 
             */
            function queryAll(inputID) {
                var promises = [],
                    date = new Date(),
                    timestamp = date.getTime();
                
                // Send the query to all the providers
                for (var i = 0; i < providers.length; i += 1) {
                    promises.push(
                        providers[i].query(
                            inputID, timestamp, DEFAULT_MAX_RESULTS, DEFUALT_TIMEOUT
                        )
                    );
                }
                // TODO: Then we want to 'Get the latest results from all the providers'
                //       And then we might also want to check to see if the timestamp 
                //       is correct. 
                
                // Update the merged results list 
                updateResults();
            }
            
            return {
                sendQuery: queryAll,
                getLatestResults: function (start, stop) {
                    // TODO: Make sure that slice handles out of bounds 
                    return latestMergedResults.slice(start, stop);
                }
            };
        }

        return SearchAggregator;
    }
);