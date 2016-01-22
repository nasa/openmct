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

define(
    ["../src/UnsupportedBrowserWarning"],
    function (UnsupportedBrowserWarning) {
        "use strict";

        var MOBILE_BROWSER = "Safari",
            DESKTOP_BROWSER = "Chrome",
            UNSUPPORTED_BROWSERS = [
                "Firefox",
                "IE",
                "Opera",
                "Iceweasel"
            ];

        describe("The unsupported browser warning", function () {
            var mockNotificationService,
                mockAgentService,
                testAgent;

            function instantiateWith(browser) {
                testAgent = "Mozilla/5.0 " + browser + "/12.34.56";
                return new UnsupportedBrowserWarning(
                    mockNotificationService,
                    mockAgentService
                );
            }

            beforeEach(function () {
                testAgent = "chrome";
                mockNotificationService = jasmine.createSpyObj(
                    "notificationService",
                    [ "alert" ]
                );
                mockAgentService = jasmine.createSpyObj(
                    "agentService",
                    [ "isMobile", "isBrowser" ]
                );
                mockAgentService.isBrowser.andCallFake(function (substr) {
                    substr = substr.toLowerCase();
                    return testAgent.toLowerCase().indexOf(substr) !== -1;
                });
            });

            [ false, true ].forEach(function (isMobile) {
                var deviceType = isMobile ? "mobile" : "desktop",
                    goodBrowser = isMobile ? MOBILE_BROWSER : DESKTOP_BROWSER,
                    badBrowsers = UNSUPPORTED_BROWSERS.concat([
                        isMobile ? DESKTOP_BROWSER : MOBILE_BROWSER
                    ]);

                describe("on " + deviceType + " devices", function () {
                    beforeEach(function () {
                        mockAgentService.isMobile.andReturn(isMobile);
                    });

                    it("is not shown for " + goodBrowser, function () {
                        instantiateWith(goodBrowser);
                        expect(mockNotificationService.alert)
                            .not.toHaveBeenCalled();
                    });

                    badBrowsers.forEach(function (badBrowser) {
                        it("is shown for " + badBrowser, function () {
                            instantiateWith(badBrowser);
                            expect(mockNotificationService.alert)
                                .toHaveBeenCalled();
                        });
                    });
                });
            });

        });
    }
);

