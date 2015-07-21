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
    
    
    function SearchController($scope, $timeout, searchService) {
        
        function search(inputID) {
            var date = new Date(),
                timestamp = date.getTime(),
                numResults = 20;
            
            // Send the query
            searchService.sendQuery(inputID, timestamp);
            
            // Get the results 
            $scope.results = searchService.getLatestResults(0, numResults);
            
            // Check to make sure that these results are the latest ones
            function waitForLatest() {
                var timestamps = searchService.getLatestTimestamps(),
                    areOld = timestamps.some(function(c) {return c < timestamp;});
                // If any of the timestamps are older than the one we made the query with
                if (areOld) {
                    // Then wait and try to update again
                    searchService.updateResults();
                    var latest = searchService.getLatestResults(0, numResults);
                    $timeout(waitForLatest, 100);
                } else {
                    // We got the latest results now 
                    $scope.results = searchService.getLatestResults(0, numResults);
                }
            }
            waitForLatest();
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
            }
        };
    }
    return SearchController;
});
