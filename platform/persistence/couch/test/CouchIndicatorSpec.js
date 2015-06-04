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