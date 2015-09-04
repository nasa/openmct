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
    ["../../src/directives/MCTPlot"],
    function (MCTPlot) {
        "use strict";

        describe("The MCT Pinch directive", function () {
            var mockScope,
                mockElement,
                mockCanvas,
                mctPlot;


            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", [
                    "axes", "viewport", "rectangles", "mouseCoordinates",
                    "$broadcast", "displayableRange", "displayableDomain",
                    "$emit", "$on", "$watchCollection" ]);
                mockElement = jasmine.createSpyObj("$element", [ "find" ]);
                mockCanvas = jasmine.createSpyObj("canvas", [ "on", "off", "removeClass", "addClass" ]);

                mockElement.find.andReturn(mockCanvas);

                mctPlot = new MCTPlot();

                mctPlot.link(mockScope, mockElement);
            });

            it("Start Pinch", function() {
                console.log(mockScope.$on.calls[0]);
                //mockScope.$on.calls[0].args[1]();
            });

            it("Change Pinch", function() {
                console.log(mockScope.$on.calls[1]);
                //mockScope.$on.calls[1].args[1]();
            });

            it("Start Pan", function() {
                console.log(mockScope.$on.calls[2]);
                //mockScope.$on.calls[2].args[1]();
            });

            it("Change Pan", function() {
                console.log(mockScope.$on.calls[3]);
                //mockScope.$on.calls[3].args[1]();
            });

            it("Touch End", function() {
                console.log(mockScope.$on.calls[4]);
                //mockScope.$on.calls[4].args[1]();
            });

        });
    }
);
