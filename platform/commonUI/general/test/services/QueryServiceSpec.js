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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/services/QueryService"],
    function (QueryService) {
        "use strict";

        describe("The url service", function () {
            var queryService,
                mockWindow,
                mockNavigator;

            beforeEach(function () {
                // Creates a mockLocation, used to 
                // do the view search
                mockWindow = jasmine.createSpyObj(
                    "$window",
                    [ "outerWidth", "outerHeight" ]
                );
                
                mockNavigator = jasmine.createSpyObj(
                    "navigator",
                    [ "userAgent" ]
                );
                
                queryService = new QueryService(mockWindow);
            });
            
            it("get current device user agent", function () {
                queryService.isMobile();
                mockNavigator.userAgent = "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53";
                queryService.isMobile();
            });
            
            it("get orientation of the current device", function () {
                mockWindow.outerWidth = 768;
                mockWindow.outerHeight = 1024;
                queryService.getOrientation();
                mockWindow.outerWidth = 1024;
                mockWindow.outerHeight = 768;
                queryService.getOrientation();
            });
        });
    }
);