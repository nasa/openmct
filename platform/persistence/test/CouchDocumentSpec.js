/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * DomainObjectProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/CouchDocument"],
    function (CouchDocument) {
        "use strict";

        // Don't complain about _id or _rev; these are the CouchDB
        // fields that must be used.
        /*jslint nomen: true */
        describe("A couch document", function () {
            it("includes an id", function () {
                expect(new CouchDocument("testId", {})._id)
                    .toEqual("testId");
            });

            it("includes a rev only when one is provided", function () {
                expect(new CouchDocument("testId", {})._rev)
                    .not.toBeDefined();
                expect(new CouchDocument("testId", {}, "testRev")._rev)
                    .toEqual("testRev");
            });

            it("includes the provided model", function () {
                var model = { someKey: "some value" };
                expect(new CouchDocument("testId", model).model)
                    .toEqual(model);
            });

            it("marks documents as deleted only on request", function () {
                expect(new CouchDocument("testId", {}, "testRev")._deleted)
                    .not.toBeDefined();
                expect(new CouchDocument("testId", {}, "testRev", true)._deleted)
                    .toBe(true);
            });
        });
    }
);