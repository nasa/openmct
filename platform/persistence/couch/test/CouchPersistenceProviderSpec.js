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
 * DomainObjectProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/CouchPersistenceProvider"],
    function (CouchPersistenceProvider) {
        "use strict";

        describe("The couch persistence provider", function () {
            var mockHttp,
                mockQ,
                testSpace = "testSpace",
                testPath = "/test/db",
                capture,
                provider;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockHttp = jasmine.createSpy("$http");
                mockQ = jasmine.createSpyObj("$q", ["when"]);

                mockQ.when.andCallFake(mockPromise);

                // Capture promise results
                capture = jasmine.createSpy("capture");

                provider = new CouchPersistenceProvider(
                    mockHttp,
                    mockQ,
                    testSpace,
                    testPath
                );
            });

            it("reports available spaces", function () {
                provider.listSpaces().then(capture);
                expect(capture).toHaveBeenCalledWith([testSpace]);
            });

            // General pattern of tests below is to simulate CouchDB's
            // response, verify that request looks like what CouchDB
            // would expect, and finally verify that CouchPersistenceProvider's
            // return values match what is expected.
            it("lists all available documents", function () {
                mockHttp.andReturn(mockPromise({
                    data: { rows: [ { id: "a" }, { id: "b" }, { id: "c" } ] }
                }));
                provider.listObjects().then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/_all_docs", // couch document listing
                    method: "GET"
                });
                expect(capture).toHaveBeenCalledWith(["a", "b", "c"]);
            });

            it("allows object creation", function () {
                var model = { someKey: "some value" };
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "xyz", "ok": true }
                }));
                provider.createObject("testSpace", "abc", model).then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "PUT",
                    data: {
                        "_id": "abc",
                        metadata: jasmine.any(Object),
                        model: model
                    }
                });
                expect(capture).toHaveBeenCalledWith(true);
            });

            it("allows object models to be read back", function () {
                var model = { someKey: "some value" };
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "xyz", "model": model }
                }));
                provider.readObject("testSpace", "abc").then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "GET"
                });
                expect(capture).toHaveBeenCalledWith(model);
            });

            it("allows object update", function () {
                var model = { someKey: "some value" };

                // First do a read to populate rev tags...
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "xyz", "model": {} }
                }));
                provider.readObject("testSpace", "abc");

                // Now perform an update
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "uvw", "ok": true }
                }));
                provider.updateObject("testSpace", "abc", model).then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "PUT",
                    data: {
                        "_id": "abc",
                        "_rev": "xyz",
                        metadata: jasmine.any(Object),
                        model: model
                    }
                });
                expect(capture).toHaveBeenCalledWith(true);
            });

            it("allows object deletion", function () {
                // First do a read to populate rev tags...
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "xyz", "model": {} }
                }));
                provider.readObject("testSpace", "abc");

                // Now perform an update
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "uvw", "ok": true }
                }));
                provider.deleteObject("testSpace", "abc", {}).then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "PUT",
                    data: {
                        "_id": "abc",
                        "_rev": "xyz",
                        "_deleted": true,
                        metadata: jasmine.any(Object),
                        model: {}
                    }
                });
                expect(capture).toHaveBeenCalledWith(true);
            });

            it("reports failure to create objects", function () {
                var model = { someKey: "some value" };
                mockHttp.andReturn(mockPromise({
                    data: { "_id": "abc", "_rev": "xyz", "ok": false }
                }));
                provider.createObject("testSpace", "abc", model).then(capture);
                expect(capture).toHaveBeenCalledWith(false);
            });

            it("returns undefined when objects are not found", function () {
                // Act like a 404
                mockHttp.andReturn({
                    then: function (success, fail) {
                        return mockPromise(fail());
                    }
                });
                provider.readObject("testSpace", "abc").then(capture);
                expect(capture).toHaveBeenCalledWith(undefined);
            });

        });
    }
);