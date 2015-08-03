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
    ["../../src/controllers/SearchController"],
    function (SearchController) {
        "use strict";

        describe("The search controller", function () {
            var mockScope,
                mockSearchService,
                mockPromise,
                controller;

            function bigArray(size) {
                var array = [],
                    i;
                for (i = 0; i < size; i += 1) {
                    array.push(i);
                }
                return array;
            }
            
            
            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "" ]
                );
                mockScope.ngModel = {};
                mockScope.ngModel.input = "test input";
                
                mockSearchService = jasmine.createSpyObj(
                    "searchService",
                    [ "query" ]
                );
                mockPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then" ]
                );
                mockSearchService.query.andReturn(mockPromise);
                
                controller = new SearchController(mockScope, mockSearchService);
                controller.search();
            });
            
            it("sends queries to the search service", function () {
                expect(mockSearchService.query).toHaveBeenCalled();
            });
            
            it("populates the results with results from the search service", function () {
                expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
                mockPromise.then.mostRecentCall.args[0]({hits: []});
                
                expect(mockScope.results).toBeDefined();
            });
            
            it("is loading until the service's promise fufills", function () {
                // Send query
                controller.search();
                expect(controller.isLoading()).toBeTruthy();
                
                // Then resolve the promises
                mockPromise.then.mostRecentCall.args[0]({hits: []});
                expect(controller.isLoading()).toBeFalsy();
            });

            
            it("displays only some results when there are many", function () {
                expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
                mockPromise.then.mostRecentCall.args[0]({hits: bigArray(100)});
                
                expect(mockScope.results).toBeDefined();
                expect(mockScope.results.length).toBeLessThan(100);
            });
            
            it("can load more results", function () {
                var oldSize;
                
                expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
                mockPromise.then.mostRecentCall.args[0]({hits: bigArray(100), total: 1000});
                oldSize = mockScope.results.length;
                
                expect(controller.areMore()).toBeTruthy();
                
                controller.loadMore();
                expect(mockScope.results.length).toBeGreaterThan(oldSize);
            });
            
            it("sets the ngModel.search flag", function () {
                // Flag should be true with nonempty input
                expect(mockScope.ngModel.search).toEqual(true);
                
                // Flag should be flase with empty input
                mockScope.ngModel.input = "";
                controller.search();
                expect(mockScope.ngModel.search).toEqual(false);
            });
        });
    }
);