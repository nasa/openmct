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
                mockLog,
                mockThrottle,
                mockDeferred,
                mockObjectService,
                mockObjectPromise,
                mockChainedPromise,
                mockDomainObjects,
                mockCapability,
                mockCapabilityPromise,
                mockWorkerService,
                mockWorker,
                mockTopic,
                mockMutationTopic,
                mockRoots = ['root1', 'root2'],
                provider,
                mockProviderResults;

            function resolveObjectPromises() {
                var i;
                for (i = 0; i < mockObjectPromise.then.calls.length; i += 1) {
                    mockChainedPromise.then.calls[i].args[0](
                        mockObjectPromise.then.calls[i]
                            .args[0](mockDomainObjects)
                    );
                }
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj(
                    "$q",
                    [ "defer" ]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "error", "warn", "info", "debug" ]
                );
                mockDeferred = jasmine.createSpyObj(
                    "deferred",
                    [ "resolve", "reject"]
                );
                mockDeferred.promise = "mock promise";
                mockQ.defer.andReturn(mockDeferred);

                mockThrottle = jasmine.createSpy("throttle");

                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );
                mockObjectPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then", "catch" ]
                );
                mockChainedPromise = jasmine.createSpyObj(
                    "chainedPromise",
                    [ "then" ]
                );
                mockObjectService.getObjects.andReturn(mockObjectPromise);

                mockTopic = jasmine.createSpy('topic');

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
                ['a', 'root1', 'root2'].forEach(function (id) {
                    mockDomainObjects[id] = (
                        jasmine.createSpyObj(
                            "domainObject",
                            [ "getId", "getModel", "hasCapability", "getCapability", "useCapability" ]
                        )
                    );
                    mockDomainObjects[id].getId.andReturn(id);
                    mockDomainObjects[id].getCapability.andReturn(mockCapability);
                    mockDomainObjects[id].useCapability.andReturn(mockCapabilityPromise);
                    mockDomainObjects[id].getModel.andReturn({});
                });

                mockCapability = jasmine.createSpyObj(
                    "capability",
                    [ "invoke", "listen" ]
                );
                mockCapability.invoke.andReturn(mockCapabilityPromise);
                mockDomainObjects.a.getCapability.andReturn(mockCapability);
                mockMutationTopic = jasmine.createSpyObj(
                    'mutationTopic',
                    [ 'listen' ]
                );
                mockTopic.andCallFake(function (key) {
                    return key === 'mutation' && mockMutationTopic;
                });
                mockThrottle.andCallFake(function (fn) {
                    return fn;
                });
                mockObjectPromise.then.andReturn(mockChainedPromise);


                provider = new GenericSearchProvider(
                    mockQ,
                    mockLog,
                    mockThrottle,
                    mockObjectService,
                    mockWorkerService,
                    mockTopic,
                    mockRoots
                );
            });

            it("indexes tree on initialization", function () {
                var i;

                expect(mockObjectService.getObjects).toHaveBeenCalled();
                expect(mockObjectPromise.then).toHaveBeenCalled();

                // Call through the root-getting part
                resolveObjectPromises();

                mockRoots.forEach(function (id) {
                    expect(mockWorker.postMessage).toHaveBeenCalledWith({
                        request: 'index',
                        model: mockDomainObjects[id].getModel(),
                        id: id
                    });
                });
            });

            it("indexes members of composition", function () {
                mockDomainObjects.root1.getModel.andReturn({
                    composition: ['a']
                });

                resolveObjectPromises();
                resolveObjectPromises();

                expect(mockWorker.postMessage).toHaveBeenCalledWith({
                    request: 'index',
                    model: mockDomainObjects.a.getModel(),
                    id: 'a'
                });
            });

            it("listens for changes to mutation", function () {
                expect(mockMutationTopic.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
                mockMutationTopic.listen.mostRecentCall
                    .args[0](mockDomainObjects.a);

                resolveObjectPromises();

                expect(mockWorker.postMessage).toHaveBeenCalledWith({
                    request: 'index',
                    model: mockDomainObjects.a.getModel(),
                    id: mockDomainObjects.a.getId()
                });
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

            it("gives an empty result for an empty query", function () {
                var timestamp = Date.now(),
                    queryOutput;

                queryOutput = provider.query('', timestamp, 1, 2);
                expect(queryOutput.hits).toEqual([]);
                expect(queryOutput.total).toEqual(0);

                queryOutput = provider.query();
                expect(queryOutput.hits).toEqual([]);
                expect(queryOutput.total).toEqual(0);
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

            it("warns when objects are unavailable", function () {
                resolveObjectPromises();
                expect(mockLog.warn).not.toHaveBeenCalled();
                mockChainedPromise.then.mostRecentCall.args[0](
                    mockObjectPromise.then.mostRecentCall.args[1]()
                );
                expect(mockLog.warn).toHaveBeenCalled();
            });

        });
    }
);
