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
    ["../../src/controllers/PlotController"],
    function (PlotController) {
        "use strict";

        describe("The plot controller", function () {
            var mockScope,
                mockColorService,
                mockAgentService,
                mockTopLeft,
                mockBottomRight,
                mockViewport,
                mockAxes,
                controller;


            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on", "viewport", "axes" ]
                );

                mockColorService = jasmine.createSpyObj(
                    "colorService", [ "ColorPalette" ]
                );

                mockAgentService = jasmine.createSpyObj("agentService", ["isMobile"]);

                mockViewport = jasmine.createSpyObj(
                    "viewport", [ "bottomRight, topLeft" ]
                );

                mockAxes = jasmine.createSpyObj(
                    "axes", [ "domain" ]
                );

                mockTopLeft = {
                    range: 1,
                    domain: 1
                }
                mockBottomRight = {
                    range: 1,
                    domain: 1
                }

                mockViewport.topLeft = mockTopLeft;
                mockViewport.bottomRight = mockBottomRight;

                mockScope.axes = mockAxes;

                mockAgentService.isMobile.andReturn(false);

                controller = new PlotController(
                    mockScope,
                    mockColorService,
                    mockAgentService
                );

            });

            it("Performs scope call when viewport stops changing", function () {

                mockAgentService.isMobile.andReturn(true);

                // Calls end viewport with no snap-to-right opportunity and on mobile
                mockScope.$on.calls[1].args[1]("event", mockViewport);

                mockBottomRight = {
                    range: 1,
                    domain: +new Date()
                }

                mockViewport.bottomRight = mockBottomRight;

                controller = new PlotController(
                    mockScope,
                    mockColorService,
                    mockAgentService
                );

                // Calls end viewport with snap-to-right opportunity and on mobile
                mockScope.$on.calls[1].args[1]("event", mockViewport);
            });
        });
    }
);
