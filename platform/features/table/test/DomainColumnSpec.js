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

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/DomainColumn"],
    function (DomainColumn) {

        var TEST_DOMAIN_VALUE = "some formatted domain value";

        describe("A domain column", function () {
            var mockDatum,
                testMetadata,
                mockFormatter,
                column;

            beforeEach(function () {

                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    ["formatDomainValue", "formatRangeValue"]
                );
                testMetadata = {
                    key: "testKey",
                    name: "Test Name",
                    format: "Test Format"
                };
                mockFormatter.formatDomainValue.andReturn(TEST_DOMAIN_VALUE);

                column = new DomainColumn(testMetadata, mockFormatter);
            });

            it("reports a column header from domain metadata", function () {
                expect(column.getTitle()).toEqual("Test Name");
            });

            describe("when given a datum", function () {
                beforeEach(function () {
                    mockDatum = {
                        testKey: "testKeyValue"
                    };
                });

                it("looks up data from the given datum", function () {
                    expect(column.getValue(undefined, mockDatum))
                        .toEqual({ text: TEST_DOMAIN_VALUE });
                });

                it("uses formatter to format domain values as requested", function () {
                    column.getValue(undefined, mockDatum);
                    expect(mockFormatter.formatDomainValue)
                        .toHaveBeenCalledWith("testKeyValue", "Test Format");
                });

            });

        });
    }
);
