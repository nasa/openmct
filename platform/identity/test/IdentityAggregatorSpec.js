/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/IdentityAggregator"],
    function (IdentityAggregator) {
        "use strict";

        describe("The identity aggregator", function () {
            var mockProviders,
                mockQ,
                resolves,
                mockPromise,
                mockCallback,
                testUsers,
                aggregator;

            function callbackCalled() {
                return mockCallback.calls.length > 0;
            }

            function resolveProviderPromises() {
                ['a', 'b', 'c'].forEach(function (id, i) {
                    resolves[id](testUsers[i]);
                });
            }

            beforeEach(function () {
                testUsers = [
                    { key: "user0", name: "User Zero" },
                    { key: "user1", name: "User One" },
                    { key: "user2", name: "User Two" }
                ];

                resolves = {};

                mockProviders = ['a', 'b', 'c'].map(function (id) {
                    var mockProvider = jasmine.createSpyObj(
                        'provider-' + id,
                        [ 'getUser' ]
                    );

                    mockProvider.getUser.andReturn(new Promise(function (r) {
                        resolves[id] = r;
                    }));

                    return mockProvider;
                });

                mockQ = jasmine.createSpyObj('$q', ['all']);
                mockQ.all.andCallFake(function (promises) {
                    return Promise.all(promises);
                });

                mockCallback = jasmine.createSpy('callback');

                aggregator = new IdentityAggregator(
                    mockQ,
                    mockProviders
                );
            });

            it("delegates to the aggregated providers", function () {
                // Verify precondition
                mockProviders.forEach(function (p) {
                    expect(p.getUser).not.toHaveBeenCalled();
                });

                aggregator.getUser();

                mockProviders.forEach(function (p) {
                    expect(p.getUser).toHaveBeenCalled();
                });
            });

            it("returns the first result when it is defined", function () {
                aggregator.getUser().then(mockCallback);

                resolveProviderPromises();

                waitsFor(callbackCalled);
                runs(function () {
                    expect(mockCallback).toHaveBeenCalledWith(testUsers[0]);
                });
            });

            it("returns a later result when earlier results are undefined", function () {
                testUsers[0] = undefined;

                aggregator.getUser().then(mockCallback);

                resolveProviderPromises();

                waitsFor(callbackCalled);
                runs(function () {
                    expect(mockCallback).toHaveBeenCalledWith(testUsers[1]);
                });
            });

            it("returns undefined when no providers expose users", function () {
                testUsers = [ undefined, undefined, undefined ];

                aggregator.getUser().then(mockCallback);

                resolveProviderPromises();

                waitsFor(callbackCalled);
                runs(function () {
                    expect(mockCallback).toHaveBeenCalledWith(undefined);
                });
            });

            it("returns undefined when there are no providers", function () {
                new IdentityAggregator(mockQ, []).getUser().then(mockCallback);
                waitsFor(callbackCalled);
                runs(function () {
                    expect(mockCallback).toHaveBeenCalledWith(undefined);
                });
            });

        });
    }
);
