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
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotAxis"],
    function (PlotAxis) {
        "use strict";

        describe("A plot axis", function () {
            var testMetadatas = [
                    {
                        tests: [
                            { key: "t0", name: "T0" },
                            { key: "t1", name: "T1" }
                        ],
                        someKey: "some value"
                    },
                    {
                        tests: [
                            { key: "t0", name: "T0" },
                            { key: "t2", name: "T2" }
                        ]
                    },
                    {
                        tests: [
                            { key: "t3", name: "T3" },
                            { key: "t4", name: "T4" },
                            { key: "t5", name: "T5" },
                            { key: "t6", name: "T6" }
                        ]
                    }
                ],
                testDefault = { key: "test", name: "Test" },
                controller = new PlotAxis("tests", testMetadatas, testDefault);

            it("pulls out a list of domain or range options", function () {
                // Should have filtered out duplicates, etc
                expect(controller.options).toEqual([
                    { key: "t0", name: "T0" },
                    { key: "t1", name: "T1" },
                    { key: "t2", name: "T2" },
                    { key: "t3", name: "T3" },
                    { key: "t4", name: "T4" },
                    { key: "t5", name: "T5" },
                    { key: "t6", name: "T6" }
                ]);
            });

            it("chooses the first option as a default", function () {
                expect(controller.active).toEqual({ key: "t0", name: "T0" });
            });

            it("falls back to a provided default if no options are present", function () {
                expect(new PlotAxis("tests", [{}], testDefault).active)
                    .toEqual(testDefault);
            });

        });
    }
);
