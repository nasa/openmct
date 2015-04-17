/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceFailureDialog", "../src/PersistenceFailureConstants"],
    function (PersistenceFailureDialog, Constants) {
        "use strict";

        describe("The persistence failure dialog", function () {
            var testFailures,
                dialog;

            beforeEach(function () {
                testFailures = [
                    { error: { key: Constants.REVISION_ERROR_KEY }, someKey: "abc" },
                    { error: { key: "..." }, someKey: "def" },
                    { error: { key: Constants.REVISION_ERROR_KEY }, someKey: "ghi" },
                    { error: { key: Constants.REVISION_ERROR_KEY }, someKey: "jkl" },
                    { error: { key: "..." }, someKey: "mno" }
                ];
                dialog = new PersistenceFailureDialog(testFailures);
            });

            it("categorizes failures", function () {
                expect(dialog.model.revised).toEqual([
                    testFailures[0], testFailures[2], testFailures[3]
                ]);
                expect(dialog.model.unrecoverable).toEqual([
                    testFailures[1], testFailures[4]
                ]);
            });

            it("provides an overwrite option", function () {
                expect(dialog.options[0].key).toEqual(Constants.OVERWRITE_KEY);
            });
        });
    }
);