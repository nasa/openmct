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
/*global self*/

/**
 * Module defining GenericSearchWorker. Created by shale on 07/21/2015.
 */
(function () {
    "use strict";
    
    // An array of objects composed of domain object IDs and models
    // {id: domainObject's ID, model: domainObject's model}
    var indexedItems = [];
    
    // Helper function for index()
    function conainsItem(id) {
        var i;
        for (i = 0; i < indexedItems.length; i += 1) {
            if (indexedItems[i].id === id) {
                return true;
            }
        }
        return false;
    }
    
    /** 
     * Indexes an item to indexedItems.
     * 
     * @param data An object which contains:
     *             * model: The model of the domain object
     *             * id: The ID of the domain object
     */
    function index(data) {
        var message;
        
        if (!conainsItem(data.id)) {
            indexedItems.push({
                id: data.id,
                model: data.model
            });
        }
    }
    
    // Helper function for serach()
    function convertToTerms(input) {
        var terms = input;
        // Shave any spaces off of the ends of the input
        while (terms.substr(0, 1) === ' ') {
            terms = terms.substring(1, terms.length);
        }
        while (terms.substr(terms.length - 1, 1) === ' ') {
            terms = terms.substring(0, terms.length - 1);
        }
        
        // Then split it at spaces and asterisks
        terms = terms.split(/ |\*/);
        
        // Remove any empty strings from the terms
        while (terms.indexOf('') !== -1) {
            terms.splice(terms.indexOf(''), 1);
        }
        
        return terms;
    }
    
    // Helper function for search()
    function scoreItem(item, input, terms) {
        var name = item.model.name.toLocaleLowerCase(),
            weight = 0.65,
            score = 0.0,
            i;

        // Make the score really big if the item name and 
        // the original search input are the same
        if (name === input) {
            score = 42;
        }

        for (i = 0; i < terms.length; i += 1) {
            // Increase the score if the term is in the item name
            if (name.indexOf(terms[i]) !== -1) {
                score += 1;

                // Add extra to the score if the search term exists
                // as its own term within the items
                if (name.split(' ').indexOf(terms[i]) !== -1) {
                    score += 0.5;
                }
            }
        }

        return score * weight;
    }
    
    /** 
     * Gets search results from the indexedItems based on provided search
     *   input. Returns matching results from indexedItems, as well as the
     *   timestamp that was passed to it.
     * 
     * @param data An object which contains:
     *           * input: The original string which we are searching with
     *           * maxNumber: The maximum number of search results desired
     *           * timestamp: The time identifier from when the query was made
     */
    function search(data) {
        // This results dictionary will have domain object ID keys which 
        // point to the domain object's score. 
        var results = {},
            input = data.input.toLocaleLowerCase(),
            terms = convertToTerms(input),
            message = {
                request: 'search',
                results: {},
                total: 0,
                timestamp: data.timestamp,
                timedOut: false
            },
            score,
            i,
            id;
        
        // If the user input is empty, we want to have no search results.
        if (input !== '') {
            for (i = 0; i < indexedItems.length; i += 1) {
                // If this is taking too long, then stop
                if (Date.now() > data.timestamp + data.timeout) {
                    message.timedOut = true;
                    break;
                }
                
                // Score and add items
                score = scoreItem(indexedItems[i], input, terms);
                if (score > 0) {
                    results[indexedItems[i].id] = score;
                    message.total += 1;
                }
            }
        }
        
        // Truncate results if there are more than maxResults
        if (message.total > data.maxResults) {
            i = 0;
            for (id in results) {
                message.results[id] = results[id];
                i += 1;
                if (i >= data.maxResults) {
                    break;
                }
            }
            // TODO: This seems inefficient.
        } else {
            message.results = results;
        }
        
        return message;
    }
    
    self.onmessage = function (event) {
        if (event.data.request === 'index') {
            index(event.data);
        } else if (event.data.request === 'search') {
            self.postMessage(search(event.data));
        }
    };
}());