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
    ["../../src/controllers/BottomBarController"],
    function (BottomBarController) {
        "use strict";

        describe("The bottom bar controller", function () {
            var testIndicators,
                testIndicatorA,
                testIndicatorB,
                testIndicatorC,
                mockIndicator,
                controller;

            beforeEach(function () {
                mockIndicator = jasmine.createSpyObj(
                    "indicator",
                    [ "getGlyph", "getText" ]
                );

                testIndicatorA = {};
                testIndicatorB = function () { return mockIndicator; };
                testIndicatorC = { template: "someTemplate" };

                testIndicators = [
                    testIndicatorA,
                    testIndicatorB,
                    testIndicatorC
                ];

                controller = new BottomBarController(testIndicators);
            });

            it("exposes one indicator description per extension", function () {
                expect(controller.getIndicators().length)
                    .toEqual(testIndicators.length);
            });

            it("uses template field provided, or its own default", function () {
                // "indicator" is the default;
                // only testIndicatorC overrides this.
                var indicators = controller.getIndicators();
                expect(indicators[0].template).toEqual("indicator");
                expect(indicators[1].template).toEqual("indicator");
                expect(indicators[2].template).toEqual("someTemplate");
            });

            it("instantiates indicators given as constructors", function () {
                // testIndicatorB constructs to mockIndicator
                expect(controller.getIndicators()[1].ngModel).toBe(mockIndicator);
            });
        });
    }
);