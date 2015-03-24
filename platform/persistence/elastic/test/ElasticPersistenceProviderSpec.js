/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/ElasticPersistenceProvider"],
    function (ElasticPersistenceProvider) {
        "use strict";

        describe("The ElasticSearch persistence provider", function () {
            var mockHttp,
                mockQ,
                testSpace = "testSpace",
                testPath = "/test/db",
                capture,
                provider;

            function mockPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

        });
    }
);