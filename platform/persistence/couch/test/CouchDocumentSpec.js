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
    ["../src/CouchDocument"],
    function (CouchDocument) {
        "use strict";

        // JSLint doesn't like dangling _'s, but CouchDB uses these, so
        // hide this behind variables.
        var REV = "_rev",
            ID = "_id",
            DELETED = "_deleted";

        describe("A couch document", function () {
            it("includes an id", function () {
                expect(new CouchDocument("testId", {})[ID])
                    .toEqual("testId");
            });

            it("includes a rev only when one is provided", function () {
                expect(new CouchDocument("testId", {})[REV])
                    .not.toBeDefined();
                expect(new CouchDocument("testId", {}, "testRev")[REV])
                    .toEqual("testRev");
            });

            it("includes the provided model", function () {
                var model = { someKey: "some value" };
                expect(new CouchDocument("testId", model).model)
                    .toEqual(model);
            });

            it("marks documents as deleted only on request", function () {
                expect(new CouchDocument("testId", {}, "testRev")[DELETED])
                    .not.toBeDefined();
                expect(new CouchDocument("testId", {}, "testRev", true)[DELETED])
                    .toBe(true);
            });
        });
    }
);