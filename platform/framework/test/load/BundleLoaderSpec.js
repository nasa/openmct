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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,runs,jasmine*/

/**
 * BundleLoaderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/load/BundleLoader"],
    function (BundleLoader) {
        "use strict";

        describe("The bundle loader", function () {
            var loader,
                mockCallback,
                mockHttp,
                mockLog,
                mockRegistry,
                testBundles;

            // Used to wait for then-chain resolution;
            // native promises may not resolve synchronously,
            // even when values are immediately available.
            function mockCallbackResolved() {
                return mockCallback.calls.length > 0;
            }

            beforeEach(function () {
                testBundles = {
                    "bundles.json": [ "bundle/a", "bundle/b"],
                    "bundle/a/bundle.json": {"someValue": 6},
                    "bundle/b/bundle.json": {"someValue": 7}
                };

                mockCallback = jasmine.createSpy("callback");
                mockHttp = jasmine.createSpyObj("$http", ["get"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                mockRegistry = jasmine.createSpyObj(
                    'legacyRegistry',
                    [ 'list', 'contains', 'get' ]
                );
                mockRegistry.list.andReturn([]);
                mockRegistry.contains.andReturn(false);
                loader = new BundleLoader(mockHttp, mockLog, mockRegistry);
            });

            it("accepts a JSON file name and loads all bundles", function () {
                // Set up; return named bundles
                mockHttp.get.andReturn(Promise.resolve({ data: [] }));

                // Call load bundles
                loader.loadBundles("test-filename.json").then(mockCallback);

                waitsFor(mockCallbackResolved, "then-chain resolution", 100);

                runs(function () {
                    // Should have loaded the file via $http
                    expect(mockHttp.get).toHaveBeenCalledWith("test-filename.json");

                    // Should have gotten an empty bundle list
                    expect(mockCallback).toHaveBeenCalledWith([]);
                });
            });

            it("accepts a list of bundle paths", function () {
                // Set up; return named bundles
                mockHttp.get.andCallFake(function (name) {
                    return Promise.resolve({data: testBundles[name]});
                });

                // Call load bundles
                loader.loadBundles(["bundle/a", "bundle/b"]).then(mockCallback);

                waitsFor(mockCallbackResolved, "then-chain resolution", 100);

                runs(function () {
                    // Should have gotten back two bundles
                    expect(mockCallback.mostRecentCall.args[0].length).toEqual(2);

                    // They should have the values we expect; don't care about order,
                    // some map/reduce the summation.
                    expect(mockCallback.mostRecentCall.args[0].map(function (call) {
                        return call.getDefinition().someValue;
                    }).reduce(function (a, b) {
                        return a + b;
                    }, 0)).toEqual(13);
                });
            });

            it("warns about, then ignores, missing bundle declarations", function () {
                // File-not-found
                mockHttp.get.andReturn(Promise.reject(new Error("test error")));

                // Try and load
                loader.loadBundles(["some/bundle"]).then(mockCallback);

                waitsFor(mockCallbackResolved, "then-chain resolution", 100);

                runs(function () {
                    // Should have gotten zero bundle
                    expect(mockCallback.mostRecentCall.args[0].length).toEqual(0);

                    // They should have the values we expect; don't care about order,
                    // some map/reduce the summation.
                    expect(mockLog.warn).toHaveBeenCalled();
                });
            });


            it("warns about, then ignores, malformed bundle declarations", function () {
                // File-not-found
                mockHttp.get.andReturn(Promise.resolve(["I am not a valid bundle."]));

                // Try and load
                loader.loadBundles(["some/bundle"]).then(mockCallback);

                waitsFor(mockCallbackResolved, "then-chain resolution", 100);

                runs(function () {
                    // Should have gotten zero bundle
                    expect(mockCallback.mostRecentCall.args[0].length).toEqual(0);

                    // They should have the values we expect; don't care about order,
                    // some map/reduce the summation.
                    expect(mockLog.warn).toHaveBeenCalled();
                });
            });

        });
    }
);