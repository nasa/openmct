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

        // These should be the same as the ones on the top of the search controller
        var INITIAL_LOAD_NUMBER = 20,
            LOAD_INCREMENT = 20;
        
        describe("The search controller", function () {
            var mockScope,
                mockSearchService,
                mockPromise,
                mockSearchResult,
                mockDomainObject,
                mockTypes,
                controller;

            function bigArray(size) {
                var array = [],
                    i;
                for (i = 0; i < size; i += 1) {
                    array.push(mockSearchResult);
                }
                return array;
            }
            
            
            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch" ]
                );
                mockScope.ngModel = {};
                mockScope.ngModel.input = "test input";
                mockScope.ngModel.checked = {};
                mockScope.ngModel.checked['mock.type'] = true;
                mockScope.ngModel.checkAll = true;
                
                mockSearchService = jasmine.createSpyObj(
                    "searchService",
                    [ "query" ]
                );
                mockPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then" ]
                );
                mockSearchService.query.andReturn(mockPromise);
                
                mockTypes = [{key: 'mock.type', name: 'Mock Type', glyph: '?'}];
                
                mockSearchResult = jasmine.createSpyObj(
                    "searchResult",
                    [ "" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getModel" ]
                );
                mockSearchResult.object = mockDomainObject;
                mockDomainObject.getModel.andReturn({name: 'Mock Object', type: 'mock.type'});
                
                controller = new SearchController(mockScope, mockSearchService, mockTypes);
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
                expect(mockScope.loading).toBeTruthy();
                
                // Then resolve the promises
                mockPromise.then.mostRecentCall.args[0]({hits: []});
                expect(mockScope.loading).toBeFalsy();
            });

            
            it("displays only some results when there are many", function () {
                expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
                mockPromise.then.mostRecentCall.args[0]({hits: bigArray(100)});
                
                expect(mockScope.results).toBeDefined();
                expect(mockScope.results.length).toBeLessThan(100);
            });
            
            it("detects when there are more results", function () {
                mockScope.ngModel.checkAll = false;
                
                expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
                mockPromise.then.mostRecentCall.args[0]({
                    hits: bigArray(INITIAL_LOAD_NUMBER + 5),
                    total: INITIAL_LOAD_NUMBER + 5
                });
                // bigArray gives searchResults of type 'mock.type'
                mockScope.ngModel.checked['mock.type'] = false;
                mockScope.ngModel.checked['mock.type.2'] = true;
                
                expect(controller.areMore()).toBeFalsy();
                
                mockScope.ngModel.checked['mock.type'] = true;
                
                expect(controller.areMore()).toBeTruthy();
            });
            
            it("can load more results", function () {
                var oldSize;
                
                expect(mockPromise.then).toHaveBeenCalled();
                mockPromise.then.mostRecentCall.args[0]({
                    hits: bigArray(INITIAL_LOAD_NUMBER + LOAD_INCREMENT + 1),
                    total: INITIAL_LOAD_NUMBER + LOAD_INCREMENT + 1
                });
                // These hits and total lengths are the case where the controller 
                //   DOES NOT have to re-search to load more results
                oldSize = mockScope.results.length;
                
                expect(controller.areMore()).toBeTruthy();
                
                controller.loadMore();
                expect(mockScope.results.length).toBeGreaterThan(oldSize);
            });
            
            it("can re-search to load more results", function () {
                var oldSize,
                    oldCallCount;
                
                expect(mockPromise.then).toHaveBeenCalled();
                mockPromise.then.mostRecentCall.args[0]({
                    hits: bigArray(INITIAL_LOAD_NUMBER + LOAD_INCREMENT - 1),
                    total: INITIAL_LOAD_NUMBER + LOAD_INCREMENT + 1
                });
                // These hits and total lengths are the case where the controller 
                //   DOES have to re-search to load more results
                oldSize = mockScope.results.length;
                oldCallCount = mockPromise.then.callCount;
                expect(controller.areMore()).toBeTruthy();
                
                controller.loadMore();
                expect(mockPromise.then).toHaveBeenCalled();
                // Make sure that a NEW call to search has been made 
                expect(oldCallCount).toBeLessThan(mockPromise.then.callCount);
                mockPromise.then.mostRecentCall.args[0]({
                    hits: bigArray(INITIAL_LOAD_NUMBER + LOAD_INCREMENT + 1),
                    total: INITIAL_LOAD_NUMBER + LOAD_INCREMENT + 1
                });
                expect(mockScope.results.length).toBeGreaterThan(oldSize);
            });
            
            it("sets the ngModel.search flag", function () {
                // Flag should be true with nonempty input
                expect(mockScope.ngModel.search).toEqual(true);
                
                // Flag should be flase with empty input
                mockScope.ngModel.input = "";
                controller.search();
                mockPromise.then.mostRecentCall.args[0]({hits: [], total: 0});
                expect(mockScope.ngModel.search).toEqual(false);
                
                // Both the empty string and undefined should be 'empty input'
                mockScope.ngModel.input = undefined;
                controller.search();
                mockPromise.then.mostRecentCall.args[0]({hits: [], total: 0});
                expect(mockScope.ngModel.search).toEqual(false);
            });
        });
    }
);