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
            fullResults = {hits: []};
        
        // Scope variables are: 
        // results, types, loading, filtersString, 
        //  ngModel.input, ngModel.search, ngModel.checked
        $scope.types = [];
        $scope.ngModel.checked = {};
        $scope.filtersString = "";
        $scope.loading = false;
        
        function filter(hits) {
            var newResults = [],
                i = 0;
            
            while (newResults.length < numResults && i < hits.length) {
                // If this is of an acceptable type, add it to the list
                if ($scope.ngModel.checked[hits[i].object.getModel().type] === true) {
                    newResults.push(fullResults.hits[i]);
                }
                i += 1;
            }
            
            return newResults;
        }
        
        function search(maxResults) {
            var inputText = $scope.ngModel.input;
            
            // We are starting to load.
            if (inputText !== '' && inputText !== undefined) {
                $scope.loading = true;
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
                //$scope.results = result.hits.slice(0, numResults);
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
        
        function updateOptions() {
            var type,
                i;

            // Update all-checked status
            $scope.ngModel.checkAll = true;
            for (type in $scope.ngModel.checked) {
                if (!$scope.ngModel.checked[type]) {
                    $scope.ngModel.checkAll = false;
                } else {
                    if ($scope.filtersString === '') {
                        $scope.filtersString += type;
                    } else {
                        $scope.filtersString += ', ' + type;
                    }
                }
            }

            // Update the current filters string
            $scope.filtersString = '';
            if ($scope.ngModel.checkAll !== true) {
                for (i = 0; i < types.length; i += 1) {
                    // If the type key corresponds to a checked option...
                    if ($scope.ngModel.checked[types[i].key]) {
                        // ... add it to the string list of current filter options
                        if ($scope.filtersString === '') {
                            $scope.filtersString += types[i].name;
                        } else {
                            $scope.filtersString += ', ' + types[i].name;
                        }
                    }
                }
                // If there's still nothing in the filters string, there are no 
                //   filters selected
                if ($scope.filtersString === '') {
                    $scope.filtersString = 'NONE';
                }
            }

            // Re-filter results
            $scope.results = filter(fullResults.hits);
        }
        
        // On initialization, fill the scope's types with type keys
        types.forEach(function (type) {
            // We only want some types, the ones that are probably human readable
            if (type.key && type.name) {
                $scope.types.push(type);
                $scope.ngModel.checked[type.key] = true;
            }
        });
        $scope.ngModel.checkAll = true;
        
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
             * Checks to see if there are more search results to display. If the answer
             *   is unclear, this function will err on there being more results. 
             */
            areMore: function () {
                var i;
                
                // Check to see if any of the not displayed results are of an allowed type
                for (i = numResults; i < fullResults.hits.length; i += 1) {
                    if ($scope.ngModel.checked[fullResults.hits[i].object.getModel().type.key]) {
                        return true;
                    }
                }
                
                // If none of the ones at hand are correct, there still may be more if we 
                //   re-search with a larger maxResults 
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
                    $scope.results = filter(fullResults.hits);//fullResults.hits.slice(0, numResults);
                }
            },
            
            /**
             * Re-filters the search restuls. Called when ngModel.checked changes. 
             */
            updateOptions: updateOptions,
            
            /**
             * Resets options. 
             */
            checkAll: function () {
                var type;
                for (type in $scope.ngModel.checked) {
                    $scope.ngModel.checked[type] = $scope.ngModel.checkAll;
                }
                
                updateOptions();
            }
        };
    }
    return SearchController;
});
