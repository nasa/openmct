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
 * Module defining SearchController. Created by shale on 07/15/2015.
 */
define(function () {
    "use strict";
    
    var INITIAL_LOAD_NUMBER = 20,
        LOAD_INCREMENT = 20;
    
    function SearchController($scope, searchService, types) {
        // Starting amount of results to load. Will get increased. 
        var numResults = INITIAL_LOAD_NUMBER,
            loading = false,
            fullResults = {hits: []};
        
        console.log('types', types);
        
        function search(maxResults) {
            var inputText = $scope.ngModel.input;
            
            // We are starting to load.
            if (inputText !== '' && inputText !== undefined) {
                loading = true;
            }
            
            // Update whether the file tree should be displayed 
            // Hide tree only when starting search 
            if (inputText !== '' && inputText !== undefined) {
                $scope.ngModel.search = true;
            }
            
            if (!maxResults) {
                // Reset 'load more'
                numResults = INITIAL_LOAD_NUMBER;
            }
            
            // Send the query
            searchService.query(inputText, maxResults).then(function (result) {
                fullResults = result;
                $scope.results = result.hits.slice(0, numResults);
                
                // Update whether the file tree should be displayed 
                // Reveal tree only when finishing search
                if (inputText === '' || inputText === undefined) {
                    $scope.ngModel.search = false;
                }
                
                // Now we are done loading.
                loading = false;
            });
        }
        
        function filter(types) {
            var newResults = [],
                i = 0;
            
            while (newResults.length < numResults && newResults.length < fullResults.hits.length) {
                // If this is of an acceptable type, add it to the list
                if (types.indexOf(fullResults.hits[i].getModel().type) !== -1) {
                    newResults.push(fullResults.hits[i]);
                }
                i += 1;
            }
            
            $scope.results = newResults;
        }
        
        $scope.types = [];
        // On initialization, fill the scope's types with type keys
        types.forEach(function (type) {
            // We only want some types: the ones that have keys and 
            // descriptions are probably human user usable types
            if (type.key && type.description) {
                $scope.types.push(type);
            }
        });
        
        return {
            /**
             * Search the filetree.
             * Assumes that any search text will be in ngModel.input
             *
             * @param maxResults (optional) The maximum number of results 
             *   that this function should return. If not provided, search
             *   service default will be used. 
             */
            search: search,
            
            /**
             * Checks to see if we are still waiting for the results to be 
             *   fully updated. 
             */
            isLoading: function () {
                return loading;
            },
            
            /**
             * Checks to see if there are more search results to display.
             */
            areMore: function () {
                return numResults < fullResults.total;
            },
            
            /**
             * Increases the number of search results to display, and then 
             *   load them. 
             */
            loadMore: function () {
                numResults += LOAD_INCREMENT;
                
                if (numResults > fullResults.hits.length && fullResults.hits.length < fullResults.total) {
                    // Resend the query if we are out of items to display, but there are more to get
                    search(numResults);
                } else {
                    $scope.results = fullResults.hits.slice(0, numResults);
                }
            },
            
            /**
             * Determines if the search bar has any text inputted into it. 
             *   Used as a helper for CSS styling. 
             */
            hasInput: function () {
                return !($scope.ngModel.input === "" || $scope.ngModel.input === undefined);
            },
            
            /**
             * Clears the input text. 
             */
            clear: function () {
                // Clear input field
                $scope.ngModel.input = '';
                // Call search to clear the results list too
                search();
            },
            
            /**
             * Opens a menu for more search options.
             */
            menu: function () {
                console.log('open menu');
            }
        };
    }
    return SearchController;
});
