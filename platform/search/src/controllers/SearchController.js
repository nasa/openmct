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
    
    function SearchController($scope, searchService) {
        // numResults is the amount of results to display. Will get increased. 
        // fullResults holds the most recent complete searchService response object
        var numResults = INITIAL_LOAD_NUMBER,
            fullResults = {hits: []};
        
        // Scope variables are: 
        //  Variables used only in SearchController:
        //   results, an array of searchResult objects
        //   loading, whether search() is loading 
        //   ngModel.input, the text of the search query
        //   ngModel.search, a boolean of whether to display search or the tree
        //  Variables used also in SearchMenuController:
        //   ngModel.filter, the function filter defined below 
        //   ngModel.types, an array of type objects
        //   ngModel.checked, a dictionary of which type filter options are checked 
        //   ngModel.checkAll, a boolean of whether to search all types
        //   ngModel.filtersString, a string list of what filters on the results are active
        $scope.results = [];
        $scope.loading = false;
        
        
        // Filters searchResult objects by type. Allows types that are 
        //   checked. (ngModel.checked['typekey'] === true)
        // If hits is not provided, will use fullResults.hits
        function filter(hits) {
            var newResults = [],
                i = 0;
            
            if (!hits) {
                hits = fullResults.hits;
            }
            
            // If checkAll is checked, search everything no matter what the other
            //  checkboxes' statuses are. Otherwise filter the search by types. 
            if ($scope.ngModel.checkAll) {
                newResults = fullResults.hits.slice(0, numResults);
            } else {
                while (newResults.length < numResults && i < hits.length) {
                    // If this is of an acceptable type, add it to the list
                    if ($scope.ngModel.checked[hits[i].object.getModel().type]) {
                        newResults.push(fullResults.hits[i]);
                    }
                    i += 1;
                }
            }
            
            $scope.results = newResults;
            return newResults;
        }
        
        // Make function accessible from SearchMenuController
        $scope.ngModel.filter = filter;
        
        // For documentation, see search below
        function search(maxResults) {
            var inputText = $scope.ngModel.input;
            
            if (inputText !== '' && inputText !== undefined) {
                // We are starting to load.
                $scope.loading = true;
                
                // Update whether the file tree should be displayed 
                // Hide tree only when starting search 
                $scope.ngModel.search = true;
            }
            
            if (!maxResults) {
                // Reset 'load more'
                numResults = INITIAL_LOAD_NUMBER;
            }
            
            // Send the query
            searchService.query(inputText, maxResults).then(function (result) {
                // Store all the results before splicing off the front, so that 
                //  we can load more to display later.
                fullResults = result;
                $scope.results = filter(result.hits);
                
                // Update whether the file tree should be displayed 
                // Reveal tree only when finishing search
                if (inputText === '' || inputText === undefined) {
                    $scope.ngModel.search = false;
                }
                
                // Now we are done loading.
                $scope.loading = false;
            });
        }
        
        return {
            /**
             * Search the filetree. Assumes that any search text will 
             *   be in ngModel.input
             *
             * @param maxResults (optional) The maximum number of results 
             *   that this function should return. If not provided, search
             *   service default will be used. 
             */
            search: search,
            
            /**
             * Checks to see if there are more search results to display. If the answer is
             *   unclear, this function will err toward saying that there are more results. 
             */
            areMore: function () {
                var i;
                
                // Check to see if any of the not displayed results are of an allowed type
                for (i = numResults; i < fullResults.hits.length; i += 1) {
                    if ($scope.ngModel.checkAll || $scope.ngModel.checked[fullResults.hits[i].object.getModel().type]) {
                        return true;
                    }
                }
                
                // If none of the ones at hand are correct, there still may be more if we 
                //   re-search with a larger maxResults 
                return fullResults.hits.length < fullResults.total;
            },
            
            /**
             * Increases the number of search results to display, and then 
             *   loads them, adding to the displayed results. 
             */
            loadMore: function () {
                numResults += LOAD_INCREMENT;
                
                if (numResults > fullResults.hits.length && fullResults.hits.length < fullResults.total) {
                    // Resend the query if we are out of items to display, but there are more to get
                    search(numResults);
                } else {
                    // Otherwise just take from what we already have
                    $scope.results = filter(fullResults.hits);
                }
            }
        };
    }
    return SearchController;
});
