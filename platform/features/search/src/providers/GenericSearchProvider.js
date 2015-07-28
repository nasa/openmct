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
        
        var DEFAULT_MAX_RESULTS = 100,
            DEFAULT_TIMEOUT = 1000,
            stopTime;
        
        /**
         * A search service which searches through domain objects in 
         * the filetree without using external search implementations.
         *
         * @constructor
         * @param {ObjectService} objectService the service from which
         *        domain objects can be gotten.
         * @param {WorkerService} workerService the service which allows
         *        more easy creation of web workers.
         */
        function GenericSearchProvider($rootScope, objectService, workerService, roots) {
            var worker = workerService.run('genericSearchWorker'),
                latestResults = [],
                lastSearchTimestamp = 0;

            // Tell the web worker to add a new item's model to its list of items.
            function indexItem(domainObject) {
                var message = {
                    request: 'index',
                    model: domainObject.getModel(),
                    id: domainObject.getId()
                };
                // Note that getModel() by definition returns a JavaScript object
                // that can be losslesly converted to a JSON object.
                worker.postMessage(message);
            }
            
            // Tell the worker to search for items it has that match this searchInput.
            // Takes the searchInput, as well as a max number of results (will return 
            // less than that if there are fewer matches).
            function workerSearch(searchInput, maxResults, timestamp) {
                var message = {
                    request: 'search',
                    input: searchInput,
                    maxNumber: maxResults,
                    timestamp: timestamp
                };
                worker.postMessage(message);
            }
            
            function handleResponse(event) {
                var ids,
                    id;
                
                if (event.data.request === 'search') {
                    // Convert the ids given from the web worker into domain objects
                    ids = [];
                    for (id in event.data.results) {
                        ids.push(id);
                    }
                    objectService.getObjects(ids).then(function (objects) {
                        var id;
                        
                        latestResults = [];
                        for (id in objects) {
                            latestResults.push({
                                object: objects[id],
                                id: id,
                                score: event.data.results[id].score
                            });
                        }
                        lastSearchTimestamp = event.data.timestamp;
                    });
                }
            }
            
            worker.onmessage = handleResponse;
            
            // Recursive helper function for getItems()
            function itemsHelper(children, i) {
                var date = new Date();
                if (stopTime && date.getTime() >= stopTime) {
                    // This indexing of items has timed out 
                    return children;
                } else if (i >= children.length) {
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
            function getItems(timeout) {
                var rootIds = [],
                    i;
                
                for (i = 0; i < roots.length; i += 1) {
                    rootIds.push(roots[i].id);
                }
                
                // Aquire root objects
                return objectService.getObjects(rootIds).then(function (objectsById) {
                    var objects = [],
                        date,
                        id;
                    
                    if (timeout) {
                        // Set a timeout for itemsHelper
                        date = new Date();
                        stopTime = date.getTime() + timeout;
                    }
                    // If there was no timeout provided, leave undefined
                    // itemsHelper should just treat this as having no timeout
                    
                    // Convert to the format itemsHelper takes
                    for (id in objectsById) {
                        objects.push(objectsById[id]);
                    }
                    
                    // Get all of its descendents
                    return itemsHelper(objects, 0).then(function (items) {
                        var i;
                        
                        // Add each item that itemsHelper found to the web worker index
                        // TODO: Try to do this within itemsHelper. Perhaps just 
                        //       need to add this to the last two if statements? 
                        for (i = 0; i < items.length; i += 1) {
                            indexItem(items[i]);
                        }
                        return; // We don't need to return anything anymore
                        // TODO: Fix return statements. Do we need them still?
                    });
                });
            }
            
            // For documentation, see query below.
            function queryGeneric(input, timestamp, maxResults, timeout) {
                var terms = [],
                    searchResults = [],
                    resultsLength;
                
                // Check to see if the user provided a maximum 
                // number of results to display
                if (!maxResults) {
                    // Else, we provide a default value. 
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                
                // Get items list
                return getItems(timeout).then(function () {
                    // Then get the worker to search through it
                    workerSearch(input, maxResults, timestamp);
                    return; // There's nothing we need to return here 
                });
            }
            
            return {
                /**
                 * Searches through the filetree for domain objects which match 
                 *   the search term. This function is to be used as a fallback 
                 *   in the case where other search services are not avaliable. 
                 * Notes: 
                 *   * The order of the results is not guarenteed.
                 *   * A domain object qualifies as a match for a search input if 
                 *     the object's name property contains any of the search terms
                 *     (which are generated by splitting the input at spaces).
                 *   * Scores are higher for matches that have more than one of 
                 *     the terms as substrings.
                 * 
                 * @param input The text input that is the query.
                 * @param timestamp the time at which this function was called,
                 *   this timestamp will be associated with the latest results
                 *   list, which allows the aggregator to see if it has been 
                 *   updated 
                 * @param maxResults (optional) the maximum number of results 
                 *   that this function should return 
                 * @param timeout (optional) the time after which the search should 
                 *   stop calculations and return partial results
                 */
                query: queryGeneric,
                
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


        return GenericSearchProvider;
    }
);