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
    ["../../src/services/GenericSearchProvider"],
    function (GenericSearchProvider) {
        "use strict";

        describe("The generic search provider ", function () {
            var mockQ,
                mockTimeout,
                mockDeferred,
                mockObjectService,
                mockObjectPromise,
                mockDomainObjects,
                mockCapability,
                mockCapabilityPromise,
                mockWorkerService,
                mockWorker,
                mockRoots = ['root1', 'root2'],
                provider,
                mockProviderResults;

            beforeEach(function () {
                var i;
                
                mockQ = jasmine.createSpyObj(
                    "$q",
                    [ "defer" ]
                );
                mockDeferred = jasmine.createSpyObj(
                    "deferred",
                    [ "resolve", "reject"]
                );
                mockDeferred.promise = "mock promise";
                mockQ.defer.andReturn(mockDeferred);
                
                mockTimeout = jasmine.createSpy("$timeout");
                
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );
                mockObjectPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then", "catch" ]
                );
                mockObjectService.getObjects.andReturn(mockObjectPromise);
                
                
                mockWorkerService = jasmine.createSpyObj(
                    "workerService",
                    [ "run" ]
                );
                mockWorker = jasmine.createSpyObj(
                    "worker",
                    [ "postMessage" ]
                );
                mockWorkerService.run.andReturn(mockWorker);
                
                mockCapabilityPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then", "catch" ]
                );
                
                mockDomainObjects = {};
                for (i = 0; i < 4; i += 1) {
                    mockDomainObjects[i] = (
                        jasmine.createSpyObj(
                            "domainObject",
                            [ "getId", "getModel", "hasCapability", "getCapability", "useCapability" ]
                        )
                    );
                    mockDomainObjects[i].getId.andReturn(i);
                    mockDomainObjects[i].getCapability.andReturn(mockCapability);
                    mockDomainObjects[i].useCapability.andReturn(mockCapabilityPromise);
                }
                // Give the first object children
                mockDomainObjects[0].hasCapability.andReturn(true);
                mockCapability = jasmine.createSpyObj(
                    "capability",
                    [ "invoke", "listen" ]
                );
                mockCapability.invoke.andReturn(mockCapabilityPromise);
                mockDomainObjects[0].getCapability.andReturn(mockCapability);
                
                provider = new GenericSearchProvider(mockQ, mockTimeout, mockObjectService, mockWorkerService, mockRoots);
            });
            
            it("indexes tree on initialization", function () {
                expect(mockObjectService.getObjects).toHaveBeenCalled();
                expect(mockObjectPromise.then).toHaveBeenCalled();
                
                // Call through the root-getting part 
                mockObjectPromise.then.mostRecentCall.args[0](mockDomainObjects);
                
                // Call through the children-getting part 
                mockTimeout.mostRecentCall.args[0]();
                mockCapabilityPromise.then.mostRecentCall.args[0]([]);
                mockTimeout.mostRecentCall.args[0]();
                
                expect(mockWorker.postMessage).toHaveBeenCalled();
            });
            
            it("when indexing, listens for composition changes", function () {
                var mockListener = {composition: {}};
                
                // Call indexItems
                mockObjectPromise.then.mostRecentCall.args[0](mockDomainObjects);
                
                // Call through listening for changes
                expect(mockCapability.listen).toHaveBeenCalled();
                mockCapability.listen.mostRecentCall.args[0](mockListener);
                expect(mockObjectService.getObjects).toHaveBeenCalled();
                mockObjectPromise.then.mostRecentCall.args[0](mockDomainObjects);
            });
            
            it("sends search queries to the worker", function () {
                var timestamp = Date.now();
                provider.query(' test  "query" ', timestamp, 1, 2);
                expect(mockWorker.postMessage).toHaveBeenCalledWith({
                    request: "search",
                    input: ' test  "query" ',
                    timestamp: timestamp,
                    maxNumber: 1,
                    timeout: 2
                });
            });
            
            it("handles responses from the worker", function () {
                var timestamp = Date.now(),
                    event = {
                        data: {
                            request: "search",
                            results: {
                                1: 1,
                                2: 2
                            },
                            total: 2,
                            timedOut: false,
                            timestamp: timestamp
                        }
                    };
                
                provider.query(' test  "query" ', timestamp);
                mockWorker.onmessage(event);
                mockObjectPromise.then.mostRecentCall.args[0](mockDomainObjects);
                expect(mockDeferred.resolve).toHaveBeenCalled();
            });
            
        });
    }
);