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
 * Module defining QueryService.
 */

var phoMaxWidth = 514,
    phoMaxHeight = 740,

    tabMinWidth = 515,
    tabMaxWidth = 799,

    tabMinHeight = 741,
    tabMaxHeight = 1024,

    compMinWidth = 800,
    compMinHeight = 1025;

define(
    [],
    function () {
        "use strict";

        /**
         * The url service handles calls for url paths
         * using domain objects.
         */
        function QueryService($window) {
            
            
            
            function getDeviceUA() {
                var ua = navigator.userAgent;
                return ua.match(/iPad|iPhone|Android/i) ?
                        ua.match(/iPad|iPhone|Android/i) : "";
            }
            
            function isMobile() {
                if (getDeviceUA()) {
                    return true;
                } else {
                    return false;
                }
            }

            
            function getOrientation(screenWidth, screenHeight) {
                if ($window.screen.width > $window.screen.height) {
                    return "landscape";
                } else if ($window.screen.width < $window.screen.height) {
                    return "portrait";
                }
            }
         
            return {
                getOrientation: getOrientation,
                
                isMobile: isMobile
            };
        }

        return QueryService;
    }
);