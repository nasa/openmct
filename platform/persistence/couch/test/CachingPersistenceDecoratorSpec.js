/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/CachingPersistenceDecorator"],
    function (CachingPersistenceDecorator) {
        "use strict";

        var PERSISTENCE_METHODS = [
                "listSpaces",
                "listObjects",
                "createObject",
                "readObject",
                "updateObject",
                "deleteObject"
            ];

        describe("The caching persistence decorator", function () {
            var testSpace,
                mockPersistence,
                mockCallback,
                decorator;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {


                testSpace = "TEST";
                mockPersistence = jasmine.createSpyObj(
                    "persistenceService",
                    PERSISTENCE_METHODS
                );
                mockCallback = jasmine.createSpy("callback");

                PERSISTENCE_METHODS.forEach(function (m) {
                    mockPersistence[m].andReturn(mockPromise({
                        method: m
                    }));
                });

                decorator = new CachingPersistenceDecorator(
                    testSpace,
                    mockPersistence
                );
            });

            it("delegates all methods", function () {
                PERSISTENCE_METHODS.forEach(function (m) {
                    // Reset the callback
                    mockCallback = jasmine.createSpy("callback");
                    // Invoke the method; avoid using a key that will be cached
                    decorator[m](testSpace, "testKey" + m, "testValue")
                        .then(mockCallback);
                    // Should have gotten that method's plain response
                    expect(mockCallback).toHaveBeenCalledWith({ method: m });
                });
            });

            it("does not repeat reads of cached objects", function () {
                // Perform two reads
                decorator.readObject(testSpace, "someKey", "someValue")
                    .then(mockCallback);
                decorator.readObject(testSpace, "someKey", "someValue")
                    .then(mockCallback);

                // Should have only delegated once
                expect(mockPersistence.readObject.calls.length).toEqual(1);

                // But both promises should have resolved
                expect(mockCallback.calls.length).toEqual(2);

            });

        });
    }
);