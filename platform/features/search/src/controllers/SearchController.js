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
        LOAD_INCREMENT = 5;
    
    function SearchController($scope, searchService) {
        // Starting amount of results to load. Will get increased. 
        var numResults = INITIAL_LOAD_NUMBER;
        
        // Function to be passed to the search service which allows it to set the 
        //   search template's results list 
        function setControllerResults(results) {
            $scope.results = results.slice(0, numResults);
        }
        
        function search() {
            var inputText = $scope.ngModel.input;
            
            // Update whether the file tree should be displayed 
            if (inputText === '' || inputText === undefined) {
                $scope.ngModel.search = false;
            } else {
                $scope.ngModel.search = true;
            }
            
            // Reset 'load more'
            numResults = INITIAL_LOAD_NUMBER;
            
            // Send the query
            searchService.sendQuery(inputText, setControllerResults);
        }
        
        return {
            /**
             * Search the filetree.
             * Assumes that any search text will be in ngModel.input
             */
            search: search,
            
            /**
             * Checks to see if there are any search results to display.
             */
            areResults: function () {
                if ($scope.results) {
                    return $scope.results.length > 0;
                } else {
                    return false;
                }
            },
            
            /**
             * Checks to see if we are still waiting for the results to be 
             *   fully updated. 
             */
            isLoading: function () {
                return searchService.isLoading();
            },
            
            /**
             * Checks to see if there are more search results to display.
             */
            areMore: function () {
                return numResults < searchService.getNumResults();
            },
            
            /**
             * Increases the number of search results to display, and then 
             *   load them. 
             */
            loadMore: function () {
                numResults += LOAD_INCREMENT;
                searchService.refresh(setControllerResults);
            }
        };
    }
    return SearchController;
});
