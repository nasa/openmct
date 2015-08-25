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
    ["../../src/services/AgentService"],
    function (AgentService) {
        "use strict";

        describe("The url service", function () {
            var agentService,
                mockWindow,
                mockNavigator;

            beforeEach(function () {
                // Creates a mockLocation, used to 
                // do the view search
                mockWindow = jasmine.createSpyObj(
                    "window",
                    [ "innerWidth", "innerHeight" ]
                );
                
                mockNavigator = jasmine.createSpyObj(
                    "navigator",
                    [ "userAgent" ]
                );
                
                agentService = new AgentService();
            });
            
            it("get current device user agent", function () {
                mockNavigator.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36";
                agentService.isMobile(mockNavigator.userAgent);
                agentService.isPhone(mockNavigator.userAgent);
                mockNavigator.userAgent = "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53";
                agentService.isMobile(mockNavigator.userAgent);
                mockNavigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53";
                agentService.isPhone(mockNavigator.userAgent);
            });
            
            it("get orientation of the current device", function () {
                agentService.getOrientation(1024, 768);
                agentService.getOrientation(768, 1024);
            });
        });
    }
);