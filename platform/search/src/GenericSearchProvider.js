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
         * @param $q Angular's $q, for promise consolidation.
         * @param {ObjectService} objectService The service from which
         *        domain objects can be gotten.
         * @param {WorkerService} workerService The service which allows
         *        more easy creation of web workers.
         * @param {GENERIC_SEARCH_ROOTS[]} ROOTS An array of the root 
         *        domain objects.
         */
        function GenericSearchProvider($q, objectService, workerService, ROOTS) {
            var worker = workerService.run('genericSearchWorker'),
                indexed = {},
                pendingQueries = {};
            // pendingQueries is a dictionary with the key value pairs st 
            // the key is the timestamp and the value is the promise
            
            // Tell the web worker to add a domain object's model to its list of items.
            function indexItem(domainObject) {
                var message;
                
                // undefined check
                if (domainObject && domainObject.getModel) {
                    // Using model instead of whole domain object because
                    //   it's a JSON object.
                    message = {
                        request: 'index',
                        model: domainObject.getModel(),
                        id: domainObject.getId()
                    };
                    worker.postMessage(message);
                }
            }
            
            // Tell the worker to search for items it has that match this searchInput.
            // Takes the searchInput, as well as a max number of results (will return 
            //   less than that if there are fewer matches).
            function workerSearch(searchInput, maxResults, timestamp, timeout) {
                var message = {
                    request: 'search',
                    input: searchInput,
                    maxNumber: maxResults,
                    timestamp: timestamp,
                    timeout: timeout
                };
                worker.postMessage(message);
            }
            
            // Handles responses from the web worker. Namely, the results of 
            // a search request. 
            function handleResponse(event) {
                var ids = [],
                    id;
                
                // If we have the results from a search 
                if (event.data.request === 'search') {
                    // Convert the ids given from the web worker into domain objects
                    for (id in event.data.results) {
                        ids.push(id);
                    }
                    objectService.getObjects(ids).then(function (objects) {
                        var searchResults = [],
                            id;
                        
                        // Create searchResult objects
                        for (id in objects) {
                            searchResults.push({
                                object: objects[id],
                                id: id,
                                score: event.data.results[id]
                            });
                        }
                        
                        // Resove the promise corresponding to this 
                        pendingQueries[event.data.timestamp].resolve({
                            hits: searchResults,
                            total: event.data.total,
                            timedOut: event.data.timedOut
                        });
                    });
                }
            }
            
            worker.onmessage = handleResponse;
            
            // Helper function for getItems(). Indexes the tree.
            function indexItems(nodes) {
                nodes.forEach(function (node) {
                    var id = node.getId();
                    
                    if (!indexed[id]) {
                        // Index each item with the web worker
                        indexItem(node);
                        indexed[id] = true;

                        if (node.hasCapability('composition')) {
                            // This node has children
                            node.getCapability('composition').invoke().then(function (children) {
                                // Index the children
                                if (children.constructor === Array) {
                                    indexItems(children);
                                } else {
                                    indexItems([children]);
                                }
                            });
                        }
                    }
                });
            }
            
            // Converts the filetree into a list
            function getItems() {
                // Aquire root objects
                objectService.getObjects(ROOTS).then(function (objectsById) {
                    var objects = [],
                        id;
                    
                    // Get each of the domain objects in objectsById
                    for (id in objectsById) {
                        objects.push(objectsById[id]);
                    }
                    
                    // Index all of the roots' descendents
                    indexItems(objects);
                });
            }
            
            
            // For documentation, see query below
            function query(input, timestamp, maxResults, timeout) {
                var terms = [],
                    searchResults = [],
                    defer = $q.defer();
                
                // Allow us to access this promise later to resolve it later
                pendingQueries[timestamp] = defer;
                
                // Check to see if the user provided a maximum 
                //   number of results to display
                if (!maxResults) {
                    // Else, we provide a default value
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                // Similarly, check if timeout was provided
                if (!timeout) {
                    timeout = DEFAULT_TIMEOUT;
                }
                
                // Send the query to the worker
                workerSearch(input, maxResults, timestamp, timeout);
                
                return defer.promise;
            }
            
            // Index the tree's contents once at the beginning 
            getItems();
            
            return {
                /**
                 * Searches through the filetree for domain objects which match 
                 *   the search term. This function is to be used as a fallback 
                 *   in the case where other search services are not avaliable.
                 *   Returns a promise for a result object that has the format
                 *   {hits: searchResult[], total: number, timedOut: boolean}
                 *   where a searchResult has the format
                 *   {id: string, object: domainObject, score: number}
                 * 
                 * Notes: 
                 *   * The order of the results is not guarenteed.
                 *   * A domain object qualifies as a match for a search input if 
                 *     the object's name property contains any of the search terms
                 *     (which are generated by splitting the input at spaces).
                 *   * Scores are higher for matches that have more of the terms 
                 *     as substrings.
                 * 
                 * @param input The text input that is the query.
                 * @param timestamp The time at which this function was called.
                 *   This timestamp is used as a unique identifier for this 
                 *   query and the corresponding results. 
                 * @param maxResults (optional) The maximum number of results 
                 *   that this function should return. 
                 * @param timeout (optional) The time after which the search should 
                 *   stop calculations and return partial results.
                 */
                query: query

            };
        }


        return GenericSearchProvider;
    }
);