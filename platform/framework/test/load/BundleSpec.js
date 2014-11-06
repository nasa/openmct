/*global define,Promise,describe,it,expect,beforeEach*/

/**
 * BundleSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/load/Bundle", "../../src/Constants"],
    function (Bundle, Constants) { // Verify against constants, too
        "use strict";

        describe("A bundle", function () {
            var PATH = "some/path",
                KEY = "someKey";

            it("reports its path", function () {
                expect(new Bundle(PATH, {}).getPath()).toEqual(PATH);
            });

            it("reports its source path", function () {
                expect(new Bundle(PATH, { "sources": "test-src" }).getSourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + "test-src"
                );
            });

            it("reports the default source path if none is configured", function () {
                expect(new Bundle(PATH, {}).getSourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + Constants.DEFAULT_BUNDLE.sources
                );
            });

            it("reports its resource path", function () {
                expect(new Bundle(PATH, { "resources": "test-res" }).getResourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + "test-res"
                );
            });

            it("reports the default resource path if none is configured", function () {
                expect(new Bundle(PATH, {}).getResourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + Constants.DEFAULT_BUNDLE.resources
                );
            });

            it("has a log-friendly name for the bundle which includes its key and path", function () {
                // Use indexof to look for the bundle's key
                var logName = new Bundle(PATH, { key: KEY }).getLogName();
                expect(logName.indexOf(KEY)).not.toEqual(-1);
                expect(logName.indexOf(PATH)).not.toEqual(-1);
            });

            it("reports all declared extension categories", function () {
                var bundle = new Bundle(PATH, {
                    extensions: { things: [], tests: [], foos: [] }
                });

                expect(bundle.getExtensionCategories().sort()).toEqual(
                    ["foos", "tests", "things"]
                );
            });

            it("reports all extensions that have been declared", function () {
                var bundle = new Bundle(PATH, {
                    extensions: { things: [ {}, {}, {} ] }
                });
                expect(bundle.getExtensions("things").length).toEqual(3);
            });

            it("reports an empty list for extensions that have not been declared", function () {
                var bundle = new Bundle(PATH, {
                    extensions: { things: [ {}, {}, {} ] }
                });
                expect(bundle.getExtensions("stuffs").length).toEqual(0);
            });
        });
    }
);