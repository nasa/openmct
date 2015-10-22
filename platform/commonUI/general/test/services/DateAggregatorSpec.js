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
    ["../../src/services/DateAggregator"],
    function (DateAggregator) {
        'use strict';

        var DATE_SERVICE_METHODS = [ "format", "validate", "parse" ];

        describe("DateAggregator", function () {
            var mockProviders,
                dateAggregator;

            beforeEach(function () {
                mockProviders = [ 'a', 'b', 'c', undefined ].map(function (k, i) {
                    var mockProvider = jasmine.createSpyObj(
                        'provider-' + k,
                        DATE_SERVICE_METHODS
                    );

                    mockProvider.format.andCallFake(function (value, key) {
                        return key === k ?
                                ("Formatted " + value + " for " + k) :
                                undefined;
                    });

                    mockProvider.parse.andCallFake(function (text, key) {
                        return key === k ? i : undefined;
                    });

                    mockProvider.validate.andCallFake(function (text, key) {
                        return key === k;
                    });

                    return mockProvider;
                });

                dateAggregator = new DateAggregator(mockProviders);
            });

            it("formats dates using the first provider which gives a result", function () {
                expect(dateAggregator.format(42, "a"))
                    .toEqual("Formatted 42 for a");
                expect(dateAggregator.format(12321, "b"))
                    .toEqual("Formatted 12321 for b");
                expect(dateAggregator.format(1977, "c"))
                    .toEqual("Formatted 1977 for c");
                expect(dateAggregator.format(0))
                    .toEqual("Formatted 0 for undefined");
            });

            it("parses dates using the first provider which validates", function () {
                expect(dateAggregator.parse("x", "a")).toEqual(0);
                expect(dateAggregator.parse("x", "b")).toEqual(1);
                expect(dateAggregator.parse("x", "c")).toEqual(2);
                expect(dateAggregator.parse("x")).toEqual(3);
            });

            it("validates across all providers", function () {
                expect(dateAggregator.validate("x", "a")).toBeTruthy();
                expect(dateAggregator.validate("x", "b")).toBeTruthy();
                expect(dateAggregator.validate("x", "c")).toBeTruthy();
                expect(dateAggregator.validate("x")).toBeTruthy();
                expect(dateAggregator.validate("x", "z")).toBeFalsy();

                mockProviders[3].validate.andReturn(false);
                expect(dateAggregator.validate("x")).toBeFalsy();
            });

        });
    }
);
