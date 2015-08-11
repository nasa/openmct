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
 * PanGesture. Created by shivamndave on 7/7/14.
 */
define(
    ["../../src/gestures/PanGesture", "../../src/gestures/GestureConstants"],
    function (PanGesture, GestureConstants) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "unbind" ],
            LOG_FUNCTIONS = [ "error", "warn", "info", "debug"],
            DOMAIN_OBJECT_METHODS = [ "getName", "getModel",
                                     "getCapability", "hasCapability", "useCapability"],
            TEST_NAME = "Not Folder";

        describe("The pan gesture", function () {
            var mockLog,
                mockAgentService,
                mockElement,
                mockDomainObject,
                mockObject,
                gesture,
                fireStartGesture,
                fireMoveGesture,
                fireEndGesture;

            beforeEach(function () {
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);
                mockAgentService = jasmine.createSpyObj("agentService", ["isMobile"]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockObject = jasmine.createSpyObj("domainObject",
                                                        DOMAIN_OBJECT_METHODS);
                mockDomainObject = jasmine.createSpyObj("domainObject",
                                                        DOMAIN_OBJECT_METHODS);
                
                mockDomainObject.getName.andReturn(TEST_NAME);
                mockObject.getCapability.andCallFake(function (c) {
                    return c === 'type' && mockDomainObject;
                });
                mockAgentService.isMobile.andReturn(true);
                
                gesture = new PanGesture(mockLog, mockAgentService,
                                         mockElement, mockObject);
                fireStartGesture = mockElement.on.calls[0].args[1];
                fireMoveGesture = mockElement.on.calls[1].args[1];
                fireEndGesture = mockElement.on.calls[2].args[1];
            });
            
            it("pan", function () {
                
            });
        });
    }
);