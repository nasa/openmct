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
         * @param $q 
         * @param {ObjectService} objectService the service from which
         *        domain objects can be gotten.
         * @param {WorkerService} workerService the service which allows
         *        more easy creation of web workers.
         * @param {roots[]} roots an array of all the root domain objects.
         */
        function GenericSearchProvider($q, objectService, workerService, roots) {
            var worker = workerService.run('genericSearchWorker'),
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
                        
                        // Reset and repopulate the latest results
                        for (id in objects) {
                            searchResults.push({
                                object: objects[id],
                                id: id,
                                score: event.data.results[id]
                            });
                        }
                        
                        // Resove the promise corresponding to this 
                        pendingQueries[event.data.timestamp].resolve(
                            {
                                hits: searchResults,
                                total: event.data.total
                            }
                        );
                    });
                }
            }
            
            worker.onmessage = handleResponse;
            
            // Recursive helper function for getItems()
            function itemsHelper(children, i) {
                // Index the current node
                indexItem(children[i]);
                
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
            function getItems(timeout) {
                var rootIds = [],
                    i;
                for (i = 0; i < roots.length; i += 1) {
                    rootIds.push(roots[i].id);
                }
                
                // Aquire root objects
                objectService.getObjects(rootIds).then(function (objectsById) {
                    var objects = [],
                        id;
                    
                    // Get each of the objects in objectsById
                    for (id in objectsById) {
                        objects.push(objectsById[id]);
                    }
                    
                    // Index all of the roots' descendents
                    itemsHelper(objects, 0);
                });
            }
            
            
            // For documentation, see query below.
            function query(input, timestamp, maxResults/*, timeout*/) {
                var terms = [],
                    searchResults = [],
                    defer = $q.defer();
                
                pendingQueries[timestamp] = defer;
                
                // Check to see if the user provided a maximum 
                //   number of results to display
                if (!maxResults) {
                    // Else, we provide a default value. 
                    maxResults = DEFAULT_MAX_RESULTS;
                }
                
                // Instead, assume that the items have already been indexed, and 
                //   just send the query to the worker.
                workerSearch(input, maxResults, timestamp);
                
                return defer.promise;
            }
            
            // Index the tree's contents once at the beginning 
            getItems();
            // TODO: Is this a good assumption that the tree's contents will not 
            //       change often enough? 
            // TODO: This makes the timeout parameter that query takes 
            //       useless. See if timing out worker is an idea that works. 
            
            
            return {
                /**
                 * Searches through the filetree for domain objects which match 
                 *   the search term. This function is to be used as a fallback 
                 *   in the case where other search services are not avaliable.
                 *   Returns a promise for a result object that has the format
                 *   {hits: searchResult[], total: number}
                 *   where a searchResult has the format
                 *   {id: domainObject ID, object: domainObject, score: number}
                 * 
                 * Notes: 
                 *   * The order of the results is not guarenteed.
                 *   * A domain object qualifies as a match for a search input if 
                 *     the object's name property contains any of the search terms
                 *     (which are generated by splitting the input at spaces).
                 *   * Scores are higher for matches that have more than one of 
                 *     the terms as substrings.
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