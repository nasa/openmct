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
                testBundles = [
                    {

                    },
                    {

                    }

                ];

                mockCallback = jasmine.createSpy("callback");
                mockHttp = jasmine.createSpyObj("$http", ["get"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                loader = new BundleLoader(mockHttp, mockLog);
            });

            it("accepts a JSON file name and loads all bundles", function () {
                // Set up; just return an empty set of bundles for this test
                mockHttp.get.andReturn(Promise.resolve({data: []}));

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



        });
    }
);