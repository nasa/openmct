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
