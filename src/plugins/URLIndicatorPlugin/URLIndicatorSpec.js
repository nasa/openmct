/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ["./URLIndicator"],
    function (URLIndicator) {

        describe("The URLIndicator", function () {
            var mockHttp,
                mockInterval,
                mockPromise,
                opts,
                Indicator,
                indicatorWrapper;

            beforeEach(function () {
                mockHttp = jasmine.createSpyObj("$http", ["get"]);
                mockInterval = jasmine.createSpy("$interval");
                mockPromise = jasmine.createSpyObj("promise", ["then"]);
                opts = {
                    url: "http://localhost:8080",
                    interval: 1337 //some number
                };
                mockHttp.get.andReturn(mockPromise);
                Indicator = function () {
                    this.options = opts;
                    URLIndicator.call(this, mockHttp, mockInterval);
                };
                Indicator.prototype = Object.create(URLIndicator.prototype);
                indicatorWrapper = new Indicator();
            });
            it("polls for changes", function () {
                expect(mockInterval).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    opts.interval,
                    0,
                    false
                );
            });

            it("has a database cssClass as default", function () {
                expect(indicatorWrapper.getCssClass()).toEqual("icon-database");
            });

            it("consults the url with the path supplied", function () {
                expect(mockHttp.get).toHaveBeenCalledWith(opts.url);
            });

            it("changes when the database connection is nominal", function () {
                var initialText = indicatorWrapper.getText(),
                    initialDescrption = indicatorWrapper.getDescription(),
                    initialGlyphClass = indicatorWrapper.getGlyphClass();

                // Nominal just means getting back an object, without
                // an error field.
                mockPromise.then.mostRecentCall.args[0]({ data: {} });

                // Verify that these values changed;
                // don't test for specific text.
                expect(indicatorWrapper.getText()).not.toEqual(initialText);
                expect(indicatorWrapper.getGlyphClass()).not.toEqual(initialGlyphClass);
                expect(indicatorWrapper.getDescription()).not.toEqual(initialDescrption);

                // Do check for specific class
                expect(indicatorWrapper.getGlyphClass()).toEqual("ok");
            });

            it("changes when the server cannot be reached", function () {
                var initialText = indicatorWrapper.getText(),
                    initialDescrption = indicatorWrapper.getDescription(),
                    initialGlyphClass = indicatorWrapper.getGlyphClass();

                // Nominal just means getting back an object, without
                // an error field.
                mockPromise.then.mostRecentCall.args[1]({ data: {} });

                // Verify that these values changed;
                // don't test for specific text.
                expect(indicatorWrapper.getText()).not.toEqual(initialText);
                expect(indicatorWrapper.getGlyphClass()).not.toEqual(initialGlyphClass);
                expect(indicatorWrapper.getDescription()).not.toEqual(initialDescrption);

                // Do check for specific class
                expect(indicatorWrapper.getGlyphClass()).toEqual("err");
            });
            it("has a customized cssClass if supplied in initialization", function () {
                opts = {
                    url: "http://localhost:8080",
                    cssClass: "cssClass-checked",
                    interval: 10000
                };
                indicatorWrapper = new Indicator();
                expect(indicatorWrapper.getCssClass()).toEqual("cssClass-checked");
            });
            it("has a customized interval if supplied in initialization", function () {
                opts = {
                    url: "http://localhost:8080",
                    interval: 1814
                };
                indicatorWrapper = new Indicator();
                expect(mockInterval).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    1814,
                    0,
                    false
                );
            });
            it("has a custom label if supplied in initialization", function () {
                opts = {
                    url: "http://localhost:8080",
                    label: "Localhost"
                };
                indicatorWrapper = new Indicator();
                expect(indicatorWrapper.getText()).toEqual("Checking status of Localhost please stand by...");
            });
            it("has a default label if not supplied in initialization", function () {
                opts = {
                    url: "http://localhost:8080"
                };
                indicatorWrapper = new Indicator();
                expect(indicatorWrapper.getText()).toEqual(
                  "Checking status of http://localhost:8080 please stand by..."
                );
            });
            it("has a default interval if not supplied in initialization", function () {
                opts = {
                    url: "http://localhost:8080"
                };
                indicatorWrapper = new Indicator();
                expect(mockInterval).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    10000,
                    0,
                    false
                );
            });
        });
    }
);
