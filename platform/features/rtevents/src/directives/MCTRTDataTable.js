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
/*global define,Promise*/

/**
 * Module defining MCTRTDataTable. Created by shale on 06/25/2015.
 */
define(
    ['text!../../res/templates/mct-rt-data-table.html'],
    function (dataTableTemplate) {
        "use strict";
        
        function MCTRTDataTable($window) {
            return {
                restrict: "E",
                template: dataTableTemplate,
                scope: {
                    headers: "=",
                    rows: "=",
                    ascendingScroll: "="
                },
                link: function ($scope, $element) {
                    var currentHeight,
                        previousHeight,
                        scrollParent;
                    
                    // If the scroll is set to ascending, we want to 
                    // check when elements are added to the table, and move the scroll
                    // bar accordingly. 
                    // (When viewing at the bottom of the page, the scroll bar will 
                    // stay at the bottom despite additions to the table)
                    if ($scope.ascendingScroll) {
                        $scope.$watchCollection("rows", function () {
                            // Wait until the page as been repainted (otherwise the 
                            // height will always be zero)
                            $window.requestAnimationFrame(function () {
                                previousHeight = currentHeight;
                                // The height of the table body 
                                currentHeight = $element[0].firstElementChild.firstElementChild.nextElementSibling.clientHeight;
                                
                                // One of the parents is a div that has vscroll
                                scrollParent = $element[0].parentElement.parentElement.parentElement.parentElement.parentElement;
                                
                                // Move the scrollbar down the amount that the height has changed
                                scrollParent.scrollTop = scrollParent.scrollTop + (currentHeight - previousHeight);
                            });
                        });
                    }
                }
            };
        }
        
        return MCTRTDataTable;
    }
);
