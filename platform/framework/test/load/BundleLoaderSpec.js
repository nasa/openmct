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
                loader = new BundleLoader(mockHttp, mockLog);
            });

            it("accepts a JSON file name and loads all bundles", function () {
                // Set up; return named bundles
                mockHttp.get.andReturn(Promise.resolve({ data: [] }));

                // Call load bundles
                loader.loadBundles("test-filename.json").then(mockCallback);

                waitsFor(mockCallbackResolved, "then-chain resolution", 500);

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

                waitsFor(mockCallbackResolved, "then-chain resolution", 500);

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


        });
    }
);