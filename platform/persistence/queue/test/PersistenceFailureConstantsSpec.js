/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceFailureConstants"],
    function (PersistenceFailureConstants) {
        "use strict";

        describe("Persistence failure constants", function () {
            it("defines an overwrite key", function () {
                expect(PersistenceFailureConstants.OVERWRITE_KEY)
                    .toEqual(jasmine.any(String));
            });
        });
    }
);