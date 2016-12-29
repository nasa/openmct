/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ["../../src/controllers/BottomBarController"],
    (BottomBarController) => {

        describe("The bottom bar controller", () => {
            let testIndicators,
                testIndicatorA,
                testIndicatorB,
                testIndicatorC,
                mockIndicator,
                controller;

            beforeEach( () => {
                mockIndicator = jasmine.createSpyObj(
                    "indicator",
                    ["getGlyph", "getCssClass", "getText"]
                );

                testIndicatorA = {};
                testIndicatorB = () => {
                    return mockIndicator;
                };
                testIndicatorC = { template: "someTemplate" };

                testIndicators = [
                    testIndicatorA,
                    testIndicatorB,
                    testIndicatorC
                ];

                controller = new BottomBarController(testIndicators);
            });

            it("exposes one indicator description per extension", () => {
                expect(controller.getIndicators().length)
                    .toEqual(testIndicators.length);
            });

            it("uses template field provided, or its own default", () => {
                // "indicator" is the default;
                // only testIndicatorC overrides this.
                let indicators = controller.getIndicators();
                expect(indicators[0].template).toEqual("indicator");
                expect(indicators[1].template).toEqual("indicator");
                expect(indicators[2].template).toEqual("someTemplate");
            });

            it("instantiates indicators given as constructors", () => {
                // testIndicatorB constructs to mockIndicator
                expect(controller.getIndicators()[1].ngModel).toBe(mockIndicator);
            });
        });
    }
);
