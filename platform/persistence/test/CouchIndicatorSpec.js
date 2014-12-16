/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/CouchIndicator"],
    function (CouchIndicator) {
        "use strict";

        describe("The CouchDB status indicator", function () {
            var mockHttp,
                mockInterval,
                testPath,
                testInterval,
                mockPromise,
                indicator;

            beforeEach(function () {
                mockHttp = jasmine.createSpyObj("$http", [ "get" ]);
                mockInterval = jasmine.createSpy("$interval");
                mockPromise = jasmine.createSpyObj("promise", [ "then" ]);
                testPath = "/test/path";
                testInterval = 12321; // Some number

                mockHttp.get.andReturn(mockPromise);

                indicator = new CouchIndicator(
                    mockHttp,
                    mockInterval,
                    testPath,
                    testInterval
                );
            });

            it("polls for changes", function () {
                expect(mockInterval).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    testInterval
                );
            });

            it("has a database icon", function () {
                expect(indicator.getGlyph()).toEqual("D");
            });

            it("consults the database at the configured path", function () {
                expect(mockHttp.get).toHaveBeenCalledWith(testPath);
            });

            it("changes when the database connection is nominal", function () {
                var initialText = indicator.getText(),
                    initialDescrption = indicator.getDescription(),
                    initialGlyphClass = indicator.getGlyphClass();

                // Nominal just means getting back an objeect, without
                // an error field.
                mockPromise.then.mostRecentCall.args[0]({ data: {} });

                // Verify that these values changed;
                // don't test for specific text.
                expect(indicator.getText()).not.toEqual(initialText);
                expect(indicator.getGlyphClass()).not.toEqual(initialGlyphClass);
                expect(indicator.getDescription()).not.toEqual(initialDescrption);

                // Do check for specific class
                expect(indicator.getGlyphClass()).toEqual("ok");
            });

            it("changes when the server reports an error", function () {
                var initialText = indicator.getText(),
                    initialDescrption = indicator.getDescription(),
                    initialGlyphClass = indicator.getGlyphClass();

                // Nominal just means getting back an objeect, with
                // an error field.
                mockPromise.then.mostRecentCall.args[0](
                    { data: { error: "Uh oh." } }
                );

                // Verify that these values changed;
                // don't test for specific text.
                expect(indicator.getText()).not.toEqual(initialText);
                expect(indicator.getGlyphClass()).not.toEqual(initialGlyphClass);
                expect(indicator.getDescription()).not.toEqual(initialDescrption);

                // Do check for specific class
                expect(indicator.getGlyphClass()).toEqual("caution");

            });

            it("changes when the server cannot be reached", function () {
                var initialText = indicator.getText(),
                    initialDescrption = indicator.getDescription(),
                    initialGlyphClass = indicator.getGlyphClass();

                // Nominal just means getting back an objeect, without
                // an error field.
                mockPromise.then.mostRecentCall.args[1]({ data: {} });

                // Verify that these values changed;
                // don't test for specific text.
                expect(indicator.getText()).not.toEqual(initialText);
                expect(indicator.getGlyphClass()).not.toEqual(initialGlyphClass);
                expect(indicator.getDescription()).not.toEqual(initialDescrption);

                // Do check for specific class
                expect(indicator.getGlyphClass()).toEqual("err");
            });


        });
    }
);