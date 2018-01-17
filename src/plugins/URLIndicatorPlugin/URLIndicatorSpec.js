/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    [
        "./URLIndicator",
        "./URLIndicatorPlugin",
        "../../MCT",
        "zepto"
    ],
    function (
        URLIndicator,
        URLIndicatorPlugin,
        MCT,
        $
    ) {
        var defaultPrototypeFunction = URLIndicator.prototype.get;
        describe("The URLIndicator", function () {
            var openmct;
            var indicatorElement;
            var urlIndicator;
            var mockHttpRequestFunction;
            var returned;
            var options;

            beforeEach(function () {
                returned = false;
                jasmine.Clock.useMock();
                openmct = new MCT();
                spyOn(openmct.indicators, 'add');

                mockHttpRequest();
            });

            afterEach(function () {
                URLIndicator.prototype.get = defaultPrototypeFunction;
                jasmine.Clock.reset();
            })

            function mockHttpRequest() {
                mockHttpRequestFunction = jasmine.createSpy('get');
                URLIndicator.prototype.get = mockHttpRequestFunction;
                mockSuccess();
            }

            function mockSuccess(){
                mockHttpRequestFunction
                    .andReturn(Promise.resolve().then(function() {
                        returned = true;
                    }));
            }

            function mockError(){
                mockHttpRequestFunction
                    .andReturn(Promise.reject().then(function() {
                        returned = true;
                        //Throw error to ensure chained catch is invoked
                        throw undefined;
                    }));
            }

            function httpRequestReturned() {
                return returned;
            }

            function mockInterval(interval) {
                jasmine.Clock.tick(interval);
            }

            describe("on initialization", function () {
                describe("with default options", function () {
                    beforeEach(function () {
                        options = {
                            url: "someURL"
                        };
                        urlIndicator = URLIndicatorPlugin(options)(openmct);
                        indicatorElement = openmct.indicators.add.mostRecentCall.args[0].element;
                    });
    
                    it("has a default icon class if none supplied", function () {
                        var iconElement = getIconElement();
                        expect(iconElement.hasClass('icon-connectivity')).toBe(true);
                    }); 

                    it("defaults to the URL if no label supplied", function () {
                        var textElement = getTextElement();
                        expect(textElement.text().indexOf(options.url) >= 0).toBe(true);
                    });
                });

                describe("with custom options", function () {
                    beforeEach(function () {
                        options = {
                            url: "customURL",
                            interval: 1814,
                            iconClass: "iconClass-checked",
                            label: "custom label"
                        };
                        urlIndicator = URLIndicatorPlugin(options)(openmct);
                        indicatorElement = openmct.indicators.add.mostRecentCall.args[0].element;
                    });

                    it("uses the custom iconClass", function () {
                        var iconElement = getIconElement();
                        expect(iconElement.hasClass('iconClass-checked')).toBe(true);
                    });
                    it("uses custom interval", function () {
                        expect(mockHttpRequestFunction.calls.length).toEqual(1);
                        jasmine.Clock.tick(1);
                        expect(mockHttpRequestFunction.calls.length).toEqual(1);
                        mockInterval(options.interval + 1);
                        expect(mockHttpRequestFunction.calls.length).toEqual(2);
                    });
                    it("uses custom label if supplied in initialization", function () {
                        var textElement = getTextElement();
                        expect(textElement.text().indexOf(options.label) >=0).toBe(true);
                    });    
                });
            })

            describe("when running", function () {
                beforeEach(function () {
                    options = {
                        url: "someURL",
                        interval: 100
                    };
                    urlIndicator = URLIndicatorPlugin(options)(openmct);
                    indicatorElement = openmct.indicators.add.mostRecentCall.args[0].element;
                });
            
                it("requests the provided URL", function () {
                    mockInterval(options.interval + 1);
                    expect(mockHttpRequestFunction).toHaveBeenCalledWith(options.url);
                });

                it("indicates success if connection is nominal", function () {
                    mockSuccess();
                    mockInterval(options.interval + 1);

                    waitsFor(httpRequestReturned);
                    runs(function () {
                        var iconElement = getIconElement();
                        expect(iconElement.hasClass('s-status-ok')).toBe(true);
                    })
                });

                it("indicates an error when the server cannot be reached", function () {
                    mockError();
                    mockInterval(options.interval + 1);

                    waitsFor(httpRequestReturned);
                    runs(function () {
                        var iconElement = getIconElement();
                        expect(iconElement.hasClass('s-status-warning-hi')).toBe(true);
                    });
                });
            });

            function getIconElement(){
                return $('.indicator-icon', indicatorElement);
            }

            function getTextElement(){
                return $('.indicator-text', indicatorElement);
            }
        });
    }
);
