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
    ["../../src/providers/ElasticsearchSearchProvider"],
    function (ElasticsearchSearchProvider) {
        "use strict";

        describe("The ElasticSearch search provider ", function () {
            var mockHttp,
                mockHttpPromise,
                mockObjectPromise,
                mockObjectService,
                mockDomainObject,
                provider,
                mockProviderResults;

            beforeEach(function () {
                mockHttp = jasmine.createSpy("$http");
                mockHttpPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then", "catch" ]
                );
                mockHttp.andReturn(mockHttpPromise);
                // allow chaining of promise.then().catch();
                mockHttpPromise.then.andReturn(mockHttpPromise);
                
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );
                mockObjectPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then", "catch" ]
                );
                mockObjectService.getObjects.andReturn(mockObjectPromise);
                
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel" ]
                );
                
                provider = new ElasticsearchSearchProvider(mockHttp, mockObjectService, "");
                provider.query(' test  "query" ', 0, undefined, 1000);
            });
            
            it("sends a query to ElasticSearch", function () {
                expect(mockHttp).toHaveBeenCalled();
            });
            
            it("gets data from ElasticSearch", function () {
                mockProviderResults = mockHttpPromise.then.mostRecentCall.args[0](
                    {
                    data: {
                        hits: {
                            hits: [
                                {
                                    _id: 1,
                                    _score: 1
                                },
                                {
                                    _id: 2,
                                    _score: 2
                                }
                            ],
                            total: 0
                        },
                        timed_out: false
                    }
                });
                
                expect(
                    mockObjectPromise.then.mostRecentCall.args[0]({
                        1: mockDomainObject,
                        2: mockDomainObject
                    }).hits.length
                ).toEqual(2);
            });
            
            it("returns nothing for an empty string query", function () {
                expect(provider.query("").hits).toEqual([]);
            });
            
            it("returns something when there is an ElasticSearch error", function () {
                mockProviderResults = mockHttpPromise.catch.mostRecentCall.args[0]();
                expect(mockProviderResults).toBeDefined();
            });
        });
    }
);