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

(function () {
    "use strict";
    
    // An array of objects composed of domain object IDs and models
    // {id: domainObject's ID, model: domainObject's model}
    var indexedItems = [];
    
    // Helper function for index()
    function conainsItem(id) {
        for (var i = 0; i < indexedItems.length; i++) {
            if (indexedItems[i].id === id) {
                return true;
            }
        }
        return false;
    }
    
    /** 
     * 
     */
    function index(data) {
        // Takes an object model
        // Add to indexedItems
        console.log('webworker index', data);
        
        // TODO: Since this is only within genericsearch, do 
        //       we really need to check if the index already holds it? 
        //       This might depend on how often/when we clear indexedItems.
        if (!conainsItem(data.id)) {
            indexedItems.push({
                id: data.id,
                model: data.model
            });
        }
    }
    
    // Helper function for serach()
    function convertToTerms(input) {
        return input.split(' ');
    }
    
    // Helper function for search()
    function scoreItem(item, input, terms) {
        var name = item.model.name.toLocaleLowerCase(),
            weight = 0.65,
            score = 0.0;

        // Make the score really big if the item name and 
        // the original search input are the same
        if (name === input) {
            score = 42;
        }

        for (var i = 0; i < terms.length; i++) {
            // Increase the score if the term is in the item name
            if (name.includes(terms[i])) {
                score++;

                // Add extra to the score if the search term exists
                // as its own term within the items
                // TODO: This may be undesired
                if (name.split(' ').indexOf(terms[i]) !== -1) {
                    score += .5;
                }
            }
        }

        return score * weight;
    }
    
    /** 
     * 
     */
    function search(data) {
        // Takes a search input and the number of items to find
        // Converts it into search terms
        // Gets matches from indexedItems
        console.log('webworker search', data);
        console.log('webworker indexedItems', indexedItems);
        
        // This results array will hold objects which are composed of 
        // the object's id, model, and score. (The score is wrt only this 
        // specific search input.)
        // TODO: It may be unnecissary for results to have models in it.
        var results = [],
            input = data.input.toLocaleLowerCase(),
            terms = convertToTerms(input), 
            timesToLoop = Math.min(indexedItems.length, data.maxNumber);
        
        for (var i = 0; i < timesToLoop; i++) {
            var score = scoreItem(indexedItems[i], input, terms);
            if (score > 0) {
                results.push({
                    id: indexedItems[i].id,
                    model: indexedItems[i].model,
                    score: score
                });
            }
        }
        
        console.log('webworker results', results);
        
        return results;
        
        // TODO: After a search is completed, do we need to 
        //       clear out indexedItems? 
        //       When do we need to clear out inedxedItems?
    }
    
    self.onmessage = function (event) {
        console.log('webworker onmessage');
        if (event.data.request === 'index') {
            self.postMessage(index(event.data));
        } else if (event.data.request === 'search') {
            self.postMessage(search(event.data));
        }
    };
}());