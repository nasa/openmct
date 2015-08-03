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
/*global define,describe,it,expect,beforeEach,jasmine*/

/**
 *  SearchSpec. Created by shale on 07/31/2015.
 */
define(
    ["../src/SearchAggregator"],
    function (SearchAggregator) {
        "use strict";

        describe("The search aggregator ", function () {
            var mockQ,
                mockPromise,
                mockProviders = [],
                aggregator,
                mockProviderResults = [],
                mockAggregatorResults,
                i;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj(
                    "$q",
                    [ "all" ]
                );
                mockPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then" ]
                );
                for (i = 0; i < 3; i += 1) {
                    mockProviders.push(
                        jasmine.createSpyObj(
                            "mockProvider" + i,
                            [ "query" ]
                        )
                    );
                    mockProviders[i].query.andReturn(mockPromise);
                }
                mockQ.all.andReturn(mockPromise);
                
                aggregator = new SearchAggregator(mockQ, mockProviders);
                aggregator.query();
                
                for (i = 0; i < mockProviders.length; i += 1) {
                    mockProviderResults.push({
                        hits: [
                            {
                                id: i,
                                score: 42 - i
                            },
                            {
                                id: i + 1,
                                score: 42 - (2 * i)
                            }
                        ]
                    });
                }
                mockAggregatorResults = mockPromise.then.mostRecentCall.args[0](mockProviderResults);
            });
            
            it("sends queries to all providers", function () {
                for (i = 0; i < mockProviders.length; i += 1) {
                    expect(mockProviders[i].query).toHaveBeenCalled();
                }
            });
            
            it("filters out duplicate objects", function () {
                expect(mockAggregatorResults.hits.length).toEqual(mockProviders.length + 1);
                expect(mockAggregatorResults.total).not.toBeLessThan(mockAggregatorResults.hits.length);
            });
            
            it("orders results by score", function () {
                for (i = 1; i < mockAggregatorResults.hits.length; i += 1) {
                    expect(mockAggregatorResults.hits[i].score)
                        .not.toBeGreaterThan(mockAggregatorResults.hits[i - 1].score);
                }
            });
            
            it("is loading until all the providers' promises fufill", function () {
                expect(aggregator.isLoading()).toBeFalsy();
                
                // Send query
                aggregator.query();
                expect(aggregator.isLoading()).toBeTruthy();
                
                // Then resolve the promises
                mockAggregatorResults = mockPromise.then.mostRecentCall.args[0]([]);
                expect(aggregator.isLoading()).toBeFalsy();
            });

        });
    }
);