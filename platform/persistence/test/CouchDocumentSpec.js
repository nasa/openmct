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