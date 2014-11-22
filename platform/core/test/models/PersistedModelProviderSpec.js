/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * PersistedModelProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/PersistedModelProvider"],
    function (PersistedModelProvider) {
        "use strict";

        describe("The persisted model provider", function () {
            var mockQ,
                mockPersistenceService,
                SPACE = "some space",
                provider;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    },
                    testValue: value
                };
            }

            function mockAll(mockPromises) {
                return mockPromise(mockPromises.map(function (p) {
                    return p.testValue;
                }));
            }

            beforeEach(function () {
                mockQ = { when: mockPromise, all: mockAll };
                mockPersistenceService = {
                    readObject: function (space, id) {
                        return mockPromise({
                            space: space,
                            id: id
                        });
                    }
                };

                provider = new PersistedModelProvider(
                    mockPersistenceService,
                    mockQ,
                    SPACE
                );
            });

            it("reads object models from persistence", function () {
                var models;

                provider.getModels(["a", "x", "zz"]).then(function (m) {
                    models = m;
                });

                expect(models).toEqual({
                    a: { space: SPACE, id: "a" },
                    x: { space: SPACE, id: "x" },
                    zz: { space: SPACE, id: "zz" }
                });
            });

        });
    }
);