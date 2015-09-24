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
                SPACE = "space0",
                spaces = [ "space1" ],
                modTimes,
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
                modTimes = {};
                mockQ = { when: mockPromise, all: mockAll };
                mockPersistenceService = {
                    readObject: function (space, id) {
                        return mockPromise({
                            space: space,
                            id: id,
                            modified: (modTimes[space] || {})[id]
                        });
                    }
                };

                provider = new PersistedModelProvider(
                    mockPersistenceService,
                    mockQ,
                    SPACE,
                    spaces
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

            it("reads object models from multiple spaces", function () {
                var models;

                modTimes.space1 = {
                    'x': 12321
                };

                provider.getModels(["a", "x", "zz"]).then(function (m) {
                    models = m;
                });

                expect(models).toEqual({
                    a: { space: SPACE, id: "a" },
                    x: { space: 'space1', id: "x", modified: 12321 },
                    zz: { space: SPACE, id: "zz" }
                });
            });

        });
    }
);
