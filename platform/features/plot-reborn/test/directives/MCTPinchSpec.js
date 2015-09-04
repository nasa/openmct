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
/*global define,Promise,describe,it,expect,xit,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/directives/MCTPinch"],
    function (MCTPinch) {
        "use strict";

        describe("The MCT Pinch directive", function () {
            var mockScope,
                mockElement,
                mockAgentService,
                mctPinch,
                mockEvent,
                mockTouches,
                mockChangedTouches,
                mockTarget,
                mockTouchEvent;


            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", [ "$emit", "$on" ]);
                mockElement = jasmine.createSpyObj("element", [ "on", "off" ]);
                mockAgentService = jasmine.createSpyObj("agentService", ["isMobile"]);
                mockEvent = jasmine.createSpyObj("event", [ "touches", "changedTouches", "preventDefault", "target" ]);
                mockTouchEvent = jasmine.createSpyObj("event",
                    [ "clientX", "clientY" ]);
                mockTarget = jasmine.createSpyObj("event.target", ["getBoundingClientRect"])

                mockAgentService.isMobile.andReturn(true);

                mctPinch = new MCTPinch(mockAgentService);
                mctPinch.link(mockScope, mockElement);

                mockTouches = [mockTouchEvent];
                mockChangedTouches = [mockTouchEvent];

                mockEvent.touches = mockTouches;
                mockEvent.changedTouches = mockChangedTouches;
                mockEvent.target = mockTarget;
            });

            it("Start touch", function() {
                // Touch Start
                mockElement.on.calls[0].args[1](mockEvent);
                // Touch Move
                mockElement.on.calls[1].args[1](mockEvent);
                // Touch End
                mockElement.on.calls[2].args[1](mockEvent);
                // Touch Cancel
                mockElement.on.calls[3].args[1](mockEvent);

                mockTouches = [mockTouchEvent, mockTouchEvent];
                mockChangedTouches = [mockTouchEvent, mockTouchEvent];

                mockEvent.touches = mockTouches;
                mockEvent.changedTouches = mockChangedTouches;
                mockEvent.target = mockTarget;

                // Touch Start
                mockElement.on.calls[0].args[1](mockEvent);
                // Touch Move
                mockElement.on.calls[1].args[1](mockEvent);
                // Touch End
                mockElement.on.calls[2].args[1](mockEvent);
                // Touch Cancel
                mockElement.on.calls[3].args[1](mockEvent);

                // Check destroy
                mockScope.$on.calls[0].args[1]();
            });
        });
    }
);
