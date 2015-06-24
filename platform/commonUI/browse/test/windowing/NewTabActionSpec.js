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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,afterEach,window*/

define(
    ["../../src/windowing/NewTabAction"],
    function (NewTabAction) {
        "use strict";
        
        describe("The new tab action", function () {
            var action,
                action2,
                mockWindow,
                mockDomainObject,
                mockContext,
                mock2Context,
                mockUrlService;

            beforeEach(function () {
                // Creates a mockWindow from $window, then
                // the mockWindow's location.href is set
                // to a mock Url
                mockWindow = jasmine.createSpyObj("$window", ["open", "location"]);

                mockContext = jasmine.createSpyObj("context", ["selectedObject",
                                                               "domainObject"]);
                
                mock2Context = jasmine.createSpyObj("context", ["domainObject"]);
                
                mockUrlService = jasmine.createSpyObj("urlService", ["urlFor"]);
                
                
                action = new NewTabAction(mockUrlService, mockWindow, mockContext);
                action2 = new NewTabAction(mockUrlService, mockWindow, mock2Context);
                
            });
                        
            it("New tab with current url is opened", function () {
                // The expection is that the mockWindow
                // will be called with it's location.href
                action.perform();
                action2.perform();
            });
            
        });
    }
);