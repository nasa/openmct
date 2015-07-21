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
 * Module defining SearchController. Created by shale on 07/08/2015.
 */
define(function () {
    "use strict";
    
    
    function SearchController($scope, searchService, objectService) {
        $scope.pageLength = 16;
        
        function page(start, howMany) {
            if (!howMany) {
                howMany = $scope.pageLength;
            }

            $scope.index = start;
            $scope.page = $scope.results.slice(start, start + howMany);
        }
        
        function search(inputID) {
            
            // Later, the search result format will be different
            // Will need to compile search result list (for this 
            // result page) here, using pseudo linkedlist searchResult
            
            searchService.sendQuery(inputID).then(function (c) {
                $scope.results = c;
                $scope.index = 0;
                page($scope.index, $scope.pageLength);
            });
        }
        
        return {
            // Search the database using the user input of id "searchinput"
            search: search,
            
            // Check to see if there are any search results to display.
            areResults: function () {
                if ($scope.results) {
                    return $scope.results.length > 0;
                } else {
                    return false;
                }
            },
            
            // Check to see if there are enough results to be paging them
            arePaging: function () {
                return $scope.results.length > $scope.page.length;
            },
            
            // Check to see if are items such that we can go back a page 
            canGoBack: function () {
                return $scope.index > 0;
            },
            
            // Check to see if are items such that we can go forward a page 
            canGoForward: function () {
                return ($scope.index + $scope.pageLength) < $scope.results.length;
            },
            
            // Change the items in scope to be the ones in the next page
            nextPage: function (howMany) {
                if (!howMany) {
                    howMany = $scope.pageLength;
                }
                
                $scope.index = $scope.index + howMany;
                $scope.page = $scope.results.slice($scope.index, $scope.index + howMany);
            },
            
            // Change the items in scope to be the ones in the previous page
            previousPage: function (howMany) {
                if (!howMany) {
                    howMany = $scope.pageLength;
                }
                
                $scope.index = $scope.index - howMany;
                $scope.page = $scope.results.slice($scope.index, $scope.index + howMany);
            }
        };
    }
    return SearchController;
});
