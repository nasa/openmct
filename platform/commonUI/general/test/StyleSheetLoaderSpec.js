/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/StyleSheetLoader"],
    function (StyleSheetLoader) {
        "use strict";

        describe("The style sheet loader", function () {
            var testStyleSheets,
                mockDocument,
                mockPlainDocument,
                mockHead,
                mockElement,
                loader;

            beforeEach(function () {
                var testBundle = {
                    path: "a/b",
                    resources: "c"
                };

                testStyleSheets = [
                    { stylesheetUrl: "d.css", bundle: testBundle },
                    { stylesheetUrl: "e.css", bundle: testBundle },
                    { stylesheetUrl: "f.css", bundle: testBundle }
                ];

                mockPlainDocument =
                    jasmine.createSpyObj("document", ["createElement"]);
                mockDocument = [ mockPlainDocument ];
                mockDocument.find = jasmine.createSpy("$document.find");
                mockHead = jasmine.createSpyObj("head", ["append"]);
                mockElement = jasmine.createSpyObj("link", ["setAttribute"]);

                mockDocument.find.andReturn(mockHead);
                mockPlainDocument.createElement.andReturn(mockElement);

                loader = new StyleSheetLoader(testStyleSheets, mockDocument);
            });

            it("appends one link per stylesheet extension", function () {
                expect(mockHead.append.calls.length)
                    .toEqual(testStyleSheets.length);
            });

            it("appends links to the head", function () {
                expect(mockDocument.find).toHaveBeenCalledWith('head');
            });

            it("adjusts link locations", function () {
                expect(mockElement.setAttribute)
                    .toHaveBeenCalledWith('href', "a/b/c/d.css");
            });
        });
    }
);

