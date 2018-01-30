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
        "../../MCT",
        "../../../platform/commonUI/general/src/directives/MCTIndicators",
        "zepto"
    ],
    function (
        MCT,
        MCTIndicators,
        $
    ) {
        describe("The Indicator API", function () {
            var openmct;
            var directive;
            var holderElement;
            var legacyExtensionFunction = MCT.prototype.legacyExtension;
            var legacyIndicatorsResolved = false;
            var legacyIndicatorsCallback;

            beforeEach(function () {
                mockLegacyExtensionFunction();

                openmct = new MCT();
                directive = new MCTIndicators(openmct);
                holderElement = document.createElement('div');

                mockAngularComponents();
            });

            afterEach(function () {
                MCT.prototype.legacyExtension = legacyExtensionFunction;
            });

            it("Displays any legacy indicators ", function () {
                var legacyIndicators = [{},{},{},{}];

                mockLegacyIndicatorsWith(legacyIndicators);

                renderIndicators();

                waitsFor(legacyIndicatorsToResolve, 1000);
                runs(function () {
                    expectIndicatorsShownToBe(legacyIndicators.length);
                });

            });

            it("If legacy indicator is defined as a constructor function, executes function ", function () {
                var mockConstructorFunction = jasmine.createSpy('mockIndicatorConstructor');
                var legacyIndicators = [{}, mockConstructorFunction];

                mockConstructorFunction.andReturn({});
                mockLegacyIndicatorsWith(legacyIndicators);
                renderIndicators();

                waitsFor(legacyIndicatorsToResolve, 1000);
                runs(function () {
                    expectIndicatorsShownToBe(legacyIndicators.length);
                    expect(mockConstructorFunction).toHaveBeenCalled();
                });

            });

            describe("The simple indicator", function () {
                var simpleIndicator;

                beforeEach(function () {
                    simpleIndicator = openmct.indicators.simpleIndicator();
                    mockLegacyIndicatorsWith([]);
                    openmct.indicators.add(simpleIndicator);
                    renderIndicators();
                });
                it("applies the set icon class", function () {
                    simpleIndicator.iconClass('testIconClass');

                    waitsFor(legacyIndicatorsToResolve);
                    runs(function () {
                        expect(getIconElement().hasClass('testIconClass')).toBe(true);
                    });
                });
                it("applies the set status class", function () {
                    simpleIndicator.statusClass('testStatusClass');

                    waitsFor(legacyIndicatorsToResolve);
                    runs(function () {
                        expect(getIconElement().hasClass('testStatusClass')).toBe(true);
                    });
                });
                it("displays the set text", function () {
                    simpleIndicator.text('some test text');

                    waitsFor(legacyIndicatorsToResolve);
                    runs(function () {
                        expect(getTextElement().text().trim()).toEqual('some test text');
                    });
                });
                it("sets the indicator's title", function () {
                    simpleIndicator.description('a test description');

                    waitsFor(legacyIndicatorsToResolve);
                    runs(function () {
                        expect(getIndicatorElement().attr('title')).toEqual('a test description');
                    });
                });

                it("Hides indicator text if no text is set", function () {
                    simpleIndicator.text('');

                    waitsFor(legacyIndicatorsToResolve);
                    runs(function () {
                        expect(getIndicatorElement().hasClass('hidden')).toBe(true);
                    });
                });
            });

            it("Supports registration of a completely custom indicator", function () {
                var customIndicator = $('<div class="customIndicator">A custom indicator</div>')[0];
                mockLegacyIndicatorsWith([]);
                openmct.indicators.add({element: customIndicator});
                renderIndicators();

                waitsFor(legacyIndicatorsToResolve);
                runs(function () {
                    expect($('.customIndicator', holderElement).text().trim()).toEqual('A custom indicator');
                });
            });

            function mockLegacyExtensionFunction() {
                spyOn(MCT.prototype, "legacyExtension");
                MCT.prototype.legacyExtension.andCallFake(function (extensionName, definition) {
                    if (extensionName === 'runs') {
                        legacyIndicatorsCallback = definition.implementation;
                    }
                });
            }

            function mockAngularComponents() {
                var mockInjector = jasmine.createSpyObj('$injector', ['get']);
                var mockCompile = jasmine.createSpy('$compile');
                var mockRootScope = jasmine.createSpyObj('rootScope', ['$new']);
                var mockScope = {};

                mockRootScope.$new.andReturn(mockScope);
                mockInjector.get.andCallFake(function (service) {
                    return {
                        '$compile': mockCompile,
                        '$rootScope': mockRootScope
                    }[service];
                });
                openmct.$injector = mockInjector;
                mockCompile.andCallFake(function () {
                    return function () {
                        return $('<div></div>');
                    };
                });
            }

            function renderIndicators() {
                directive.link({}, holderElement);
            }

            function mockLegacyIndicatorsWith(legacyIndicators) {
                legacyIndicatorsResolved = false;

                openmct.indicators.allIndicatorElements().then(function () {
                    legacyIndicatorsResolved = true;
                });

                legacyIndicatorsCallback(legacyIndicators);
            }

            function legacyIndicatorsToResolve() {
                return legacyIndicatorsResolved;
            }

            function expectIndicatorsShownToBe(number) {
                expect(holderElement.children.length).toBe(number);
            }

            function getIconElement() {
                return $('.indicator-icon', holderElement);
            }

            function getIndicatorElement() {
                return $('.status', holderElement);
            }

            function getTextElement() {
                return $('.indicator-text', holderElement);
            }
        });
    });
