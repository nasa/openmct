/*global define,Promise,describe,it,expect,beforeEach*/

/**
 * ExtensionSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/load/Extension", "../../src/load/Bundle"],
    function (Extension, Bundle) {
        "use strict";

        describe("An extension", function () {
            var bundle;

            beforeEach(function () {
                bundle = new Bundle("test/bundle", {});
            });

            it("reports its key", function () {
                expect(new Extension(bundle, "tests", { key: "testKey"}).getKey())
                    .toEqual("testKey");
            });

            it("reports some key, even if non is defined", function () {
                expect(new Extension(bundle, "tests", {}).getKey()).toBeDefined();
            });

            it("allows retrieval of its declaring bundle", function () {
                expect(new Extension(bundle, "tests", {}).getBundle()).toBe(bundle);
            });

            it("reports its category", function () {
                expect(new Extension(bundle, "tests", {}).getCategory())
                    .toEqual("tests");
                expect(new Extension(bundle, "otherThings", {}).getCategory())
                    .toEqual("otherThings");
            });

            it("provides a check to see if an implementation is associated with the extension", function () {
                expect(new Extension(bundle, "tests", {}).hasImplementation())
                    .toBeFalsy();
                expect(new Extension(bundle, "tests", { implementation: "Something.js" }).hasImplementation())
                    .toBeTruthy();
            });

            it("provides a full path to an implementation, if present", function () {
                expect(new Extension(bundle, "tests", { implementation: "Something.js" }).getImplementationPath())
                    .toEqual("test/bundle/src/Something.js");
            });

            it("does not define an implementation path if there is no implementation", function () {
                expect(new Extension(bundle, "tests", {}).getImplementationPath())
                    .toBeUndefined();
            });

            it("provides a log-friendly name which contains the extension key", function () {
                var logName =
                        new Extension(bundle, "tests", { key: "testKey"}).getLogName();
                expect(logName.indexOf("testKey")).not.toEqual(-1);
            });

            it("allows its definition to be retrieved", function () {
                var definition = {
                        key: "someKey",
                        implementation: "SomeImplementation.js"
                    },
                    reported = new Extension(bundle, "tests", definition).getDefinition();

                // Bundle is added, so we can't do a normal toEqual; check that
                // all keys are still there, though.
                Object.keys(definition).forEach(function (k) {
                    expect(reported[k]).toEqual(definition[k]);
                });
            });

            it("includes the bundle in its definition", function () {
                // Bundle is needed by some registrars in the the registration phase,
                // so make sure it gets attached to the definition.
                var definition = {
                        key: "someKey",
                        implementation: "SomeImplementation.js"
                    },
                    reported = new Extension(bundle, "tests", definition).getDefinition();

                expect(reported.bundle).toEqual(bundle.getDefinition());
            });
        });
    }
);