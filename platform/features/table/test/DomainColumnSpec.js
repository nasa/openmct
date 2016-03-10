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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,xit*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/DomainColumn"],
    function (DomainColumn) {
        "use strict";

        var TEST_DOMAIN_VALUE = "some formatted domain value";

        describe("A domain column", function () {
            var mockDataSet,
                testMetadata,
                mockFormatter,
                column;

            beforeEach(function () {
                mockDataSet = jasmine.createSpyObj(
                    "data",
                    [ "getDomainValue" ]
                );
                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    [ "formatDomainValue", "formatRangeValue" ]
                );
                testMetadata = {
                    key: "testKey",
                    name: "Test Name"
                };
                mockFormatter.formatDomainValue.andReturn(TEST_DOMAIN_VALUE);

                column = new DomainColumn(testMetadata, mockFormatter);
            });

            it("reports a column header from domain metadata", function () {
                expect(column.getTitle()).toEqual("Test Name");
            });

            xit("looks up data from a data set", function () {
                column.getValue(undefined, mockDataSet, 42);
                expect(mockDataSet.getDomainValue)
                    .toHaveBeenCalledWith(42, "testKey");
            });

            xit("formats domain values as time", function () {
                mockDataSet.getDomainValue.andReturn(402513731000);

                // Should have just given the value the formatter gave
                expect(column.getValue(undefined, mockDataSet, 42).text)
                    .toEqual(TEST_DOMAIN_VALUE);

                // Make sure that service interactions were as expected
                expect(mockFormatter.formatDomainValue)
                    .toHaveBeenCalledWith(402513731000);
                expect(mockFormatter.formatRangeValue)
                    .not.toHaveBeenCalled();
            });

        });
    }
);
