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
        
        function getResults(inputID) {
            
            // Later, the search result format will be different
            // Will need to compile search result list (for this 
            // result page) here, using pseudo linkedlist searchResult
            
            searchService.query(inputID).then(function (c) {
                $scope.results = c;
                $scope.index = 0;
                page($scope.index, $scope.pageLength);
            });
        }
        
        return {
            // Search the database using the user input of id "searchinput"
            search: getResults,
            
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
            
            canGoBack: function () {
                return $scope.index > 0;
            },
            
            canGoForward: function () {
                return ($scope.index + $scope.pageLength) < $scope.results.length;
            },
            
            nextPage: function(howMany) {
                if (!howMany) {
                    howMany = $scope.pageLength;
                }
                
                $scope.index = $scope.index + howMany;
                $scope.page = $scope.results.slice($scope.index, $scope.index + howMany);
            },
            
            previousPage: function(howMany) {
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
