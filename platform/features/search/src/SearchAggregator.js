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
         * @param $timeout Angular's $timeout service, a replacement for 
         *        JavaScript's setTimeout function.
         * @param {SearchProvider[]} providers the search providers to be
         *        aggregated
         */
        function SearchAggregator($timeout, providers) {
            var latestMergedResults = [],
                lastMergeTimestamps = [],
                lastQueryTimestamp = 0,
                loading;
            
            // Remove duplicate objects that have the same ID 
            function filterRepeats(results) {
                var ids = [],
                    idToIndicies = {}, // 'dictionary' mapping IDs to a list of indicies 
                    filteredResults = [],
                    i,
                    id,
                    indicies,
                    highestScoringObject,
                    j;
                
                // Create a list of indicies of objects that correspond to any object ID
                for (i = 0; i < results.length; i += 1) {
                    id = results[i].id;
                    
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
                for (i = 0; i < ids.length; i += 1) {
                    id = ids[i];
                    indicies = idToIndicies[id];
                    
                    highestScoringObject = results[indicies[0]];
                    for (j = 0; j < indicies.length; j += 1) {
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
            
            // For documentation, see updateResults below.
            function updateResults() {
                var newerResults = [],
                    providerTimestamps = [],
                    i;
                
                // For each provider, get its most recent results
                for (i = 0; i < providers.length; i += 1) {
                    newerResults = newerResults.concat(providers[i].getLatestResults());
                    providerTimestamps.push(providers[i].getLatestTimestamp());
                }
                
                // Clean up 
                newerResults = filterRepeats(newerResults);
                newerResults = orderByScore(newerResults);
                
                // Now replace latestMergedResults 
                latestMergedResults = newerResults;
                lastMergeTimestamps = providerTimestamps;
            }
            
            // For documentation, see refresh below.
            function refresh(callback) {
                // We are loading results
                loading = true;
                
                // Get the results 
                callback(latestMergedResults);

                // Check to make sure that these results are the latest ones
                function waitForLatest() {
                    var areOld = lastMergeTimestamps.some(function (c) {return c < lastQueryTimestamp; });
                    
                    // If any of the timestamps are older than the one we made the query with
                    if (areOld) {
                        // Then wait and try to update again
                        updateResults();
                        $timeout(waitForLatest, 50);
                    } else {
                        // We got the latest results now (and done loading)
                        loading = false;
                        callback(latestMergedResults);
                    }
                }
                waitForLatest();
            }
            
            // For documentation, see sendQuery below.
            function queryAll(inputText, callback, timestamp) {
                var date,
                    i;
                
                // If there's not a timestamp, make this time the timestamp
                if (!timestamp) {
                    date = new Date();
                    timestamp = date.getTime();
                }
                
                // Update globals 
                lastQueryTimestamp = timestamp;
                
                // Send the query to all the providers
                for (i = 0; i < providers.length; i += 1) {
                    providers[i].query(inputText, timestamp, DEFAULT_MAX_RESULTS, DEFUALT_TIMEOUT);
                }
                
                // Update the merged results list 
                updateResults();
                
                // Start refresh loop
                refresh(callback);
            }
            
            return {
                /** 
                 * Sends a query to each of the providers, then updates the global
                 *   latestMergedResults accordingly. 
                 *
                 * @param inputText The text input that is the query.
                 * @param callback A callback funtion which is a setter for the 
                 *   results list, setting something for the user of this service.
                 * @param timestamp (optional) The time at which this function
                 *   was called. This timestamp will be associated with the 
                 *   latest results list, which allows us to see if it has been 
                 *   updated. If not provided, this aggregator will. 
                 */
                sendQuery: queryAll,
                
                /** 
                 * Repeatedly updates the latest results until those results are 
                 *   recent enough to correspond to the most recent query made. 
                 * 
                 * @param callback A callback funtion which is a setter for the 
                 *   results list, originally passed by the user of this service.
                 */
                refresh: refresh,
                
                /** 
                 * Get the latest search results that have been calculated. The 
                 *   format of the returned objects are searchResult objects, which
                 *   have the members id, object, and score. 
                 *
                 * @param start (optional) The index of latestMergedResults at
                 *   which to start getting results. 
                 * @param stop (optional) The index of latestMergedResults at
                 *   which to stop getting results. 
                 */
                getLatestResults: function (start, stop) {
                    return latestMergedResults.slice(start, stop);
                },
                
                /** 
                 * Get the number of search results that have been calculated most 
                 *   recently. 
                 */
                getNumResults: function () {
                    return latestMergedResults.length;
                },
                
                /**
                 * Checks to see if we are still waiting for the results to be 
                 *   fully updated. 
                 */
                isLoading: function () {
                    return loading;
                }
            };
        }

        return SearchAggregator;
    }
);