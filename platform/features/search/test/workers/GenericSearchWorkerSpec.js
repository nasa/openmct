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
/*global define,describe,it,expect,runs,waitsFor,beforeEach,jasmine,Worker*/

/**
 *  SearchSpec. Created by shale on 07/31/2015.
 */
define(
    [],
    function (GenericSearchWorker) {
        "use strict";

        describe("The generic search worker ", function () {
            // If this test fails, make sure this path is correct
            var worker = new Worker('platform/features/search/src/workers/GenericSearchWorker.js'),
                numObjects = 5;
            
            beforeEach(function () {
                var i;
                for (i = 0; i < numObjects; i += 1) {
                    worker.postMessage(
                        {
                            request: "index",
                            id: i,
                            model: {
                                name: "object " + i,
                                id: i,
                                type: "something"
                            }
                        }
                    );
                }
            });
            
            it("searches can reach all objects", function () {
                var flag = false,
                    workerOutput,
                    resultsLength = 0;
                
                // Search something that should return all objects
                runs(function () {
                    worker.postMessage(
                        {
                            request: "search",
                            input: "object",
                            maxNumber: 100,
                            timestamp: Date.now(),
                            timeout: 1000
                        }
                    );
                });
                
                worker.onmessage = function (event) {
                    var id;
                    
                    workerOutput = event.data;
                    for (id in workerOutput.results) {
                        resultsLength += 1;
                    }
                    flag = true;
                };
                
                waitsFor(function () {
                    return flag;
                }, "The worker should be searching", 1000);
                
                runs(function () {
                    expect(workerOutput).toBeDefined();
                    expect(resultsLength).toEqual(numObjects);
                });
            });
            
            it("searches return only matches", function () {
                var flag = false,
                    workerOutput,
                    resultsLength = 0;
                
                // Search something that should return 1 object
                runs(function () {
                    worker.postMessage(
                        {
                            request: "search",
                            input: "2",
                            maxNumber: 100,
                            timestamp: Date.now(),
                            timeout: 1000
                        }
                    );
                });
                
                worker.onmessage = function (event) {
                    var id;
                    
                    workerOutput = event.data;
                    for (id in workerOutput.results) {
                        resultsLength += 1;
                    }
                    flag = true;
                };
                
                waitsFor(function () {
                    return flag;
                }, "The worker should be searching", 1000);
                
                runs(function () {
                    expect(workerOutput).toBeDefined();
                    expect(resultsLength).toEqual(1);
                    expect(workerOutput.results[2]).toBeDefined();
                });
            });
        });
    }
);