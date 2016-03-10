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
/*global define,describe,xdescribe,it,expect,beforeEach,
 waitsFor,afterEach,jasmine*/

define(
    ["../src/ConductorRepresenter", "./TestTimeConductor"],
    function (ConductorRepresenter, TestTimeConductor) {
        "use strict";

        var SCOPE_METHODS = [
                '$on',
                '$watch',
                '$broadcast',
                '$emit',
                '$new',
                '$destroy'
            ],
            ELEMENT_METHODS = [
                'hasClass',
                'addClass',
                'removeClass',
                'css',
                'after',
                'remove',
                'parent'
            ];

        xdescribe("ConductorRepresenter", function () {
            var mockThrottle,
                mockConductorService,
                mockCompile,
                testViews,
                mockScope,
                mockElement,
                mockConductor,
                mockCompiledTemplate,
                mockNewScope,
                mockNewElement,
                representer;

            function fireWatch(scope, watch, value) {
                scope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === watch) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockThrottle = jasmine.createSpy('throttle');
                mockConductorService = jasmine.createSpyObj(
                    'conductorService',
                    ['getConductor']
                );
                mockCompile = jasmine.createSpy('$compile');
                testViews = [ { someKey: "some value" } ];
                mockScope = jasmine.createSpyObj('scope', SCOPE_METHODS);
                mockElement = jasmine.createSpyObj('element', ELEMENT_METHODS);
                mockElement.parent.andReturn(mockElement);
                mockConductor = new TestTimeConductor();
                mockCompiledTemplate = jasmine.createSpy('template');
                mockNewScope = jasmine.createSpyObj('newScope', SCOPE_METHODS);
                mockNewElement = jasmine.createSpyObj('newElement', ELEMENT_METHODS);
                mockNewElement[0] = mockNewElement;

                mockConductorService.getConductor.andReturn(mockConductor);
                mockCompile.andReturn(mockCompiledTemplate);
                mockCompiledTemplate.andReturn(mockNewElement);
                mockScope.$new.andReturn(mockNewScope);
                mockThrottle.andCallFake(function (fn) {
                    return fn;
                });

                representer = new ConductorRepresenter(
                    mockThrottle,
                    mockConductorService,
                    mockCompile,
                    testViews,
                    mockScope,
                    mockElement
                );
            });

            afterEach(function () {
                representer.destroy();
            });

            it("adds a conductor to views", function () {
                representer.represent(testViews[0], {});
                expect(mockElement.after).toHaveBeenCalledWith(mockNewElement);
            });

            it("adds nothing to non-view representations", function () {
                representer.represent({ someKey: "something else" }, {});
                expect(mockElement.after).not.toHaveBeenCalled();
            });

            it("removes the conductor when destroyed", function () {
                representer.represent(testViews[0], {});
                expect(mockNewElement.remove).not.toHaveBeenCalled();
                representer.destroy();
                expect(mockNewElement.remove).toHaveBeenCalled();
            });

            it("destroys any new scope created", function () {
                representer.represent(testViews[0], {});
                representer.destroy();
                expect(mockNewScope.$destroy.calls.length)
                    .toEqual(mockScope.$new.calls.length);
            });

            it("exposes conductor state in scope", function () {
                mockConductor.displayStart.andReturn(1977);
                mockConductor.displayEnd.andReturn(1984);
                mockConductor.domain.andReturn({ key: 'd' });
                representer.represent(testViews[0], {});

                expect(mockNewScope.ngModel.conductor).toEqual({
                    inner: { start: 1977, end: 1984, domain: 'd' },
                    outer: { start: 1977, end: 1984, domain: 'd' }
                });
            });

            it("updates conductor state from scope", function () {
                var testState = {
                    inner: { start: 42, end: 1984 },
                    outer: { start: -1977, end: 12321 }
                };

                representer.represent(testViews[0], {});

                mockNewScope.ngModel.conductor = testState;

                fireWatch(
                    mockNewScope,
                    'ngModel.conductor.inner.start',
                    testState.inner.start
                );
                expect(mockConductor.displayStart).toHaveBeenCalledWith(42);

                fireWatch(
                    mockNewScope,
                    'ngModel.conductor.inner.end',
                    testState.inner.end
                );
                expect(mockConductor.displayEnd).toHaveBeenCalledWith(1984);
            });

            describe("when bounds are changing", function () {
                var startWatch = "ngModel.conductor.inner.start",
                    endWatch = "ngModel.conductor.inner.end",
                    mockThrottledFn = jasmine.createSpy('throttledFn'),
                    testBounds;

                function fireThrottledFn() {
                    mockThrottle.mostRecentCall.args[0]();
                }

                beforeEach(function () {
                    mockThrottle.andReturn(mockThrottledFn);
                    representer.represent(testViews[0], {});
                    testBounds = { start: 0, end: 1000 };
                    mockNewScope.ngModel.conductor.inner = testBounds;
                    mockConductor.displayStart.andCallFake(function () {
                        return testBounds.start;
                    });
                    mockConductor.displayEnd.andCallFake(function () {
                        return testBounds.end;
                    });
                });

                it("does not broadcast while bounds are changing", function () {
                    expect(mockScope.$broadcast).not.toHaveBeenCalled();
                    testBounds.start = 100;
                    fireWatch(mockNewScope, startWatch, testBounds.start);
                    testBounds.end = 500;
                    fireWatch(mockNewScope, endWatch, testBounds.end);
                    fireThrottledFn();
                    testBounds.start = 200;
                    fireWatch(mockNewScope, startWatch, testBounds.start);
                    testBounds.end = 400;
                    fireWatch(mockNewScope, endWatch, testBounds.end);
                    fireThrottledFn();
                    expect(mockScope.$broadcast).not.toHaveBeenCalled();
                });

                it("does broadcast when bounds have stabilized", function () {
                    expect(mockScope.$broadcast).not.toHaveBeenCalled();
                    testBounds.start = 100;
                    fireWatch(mockNewScope, startWatch, testBounds.start);
                    testBounds.end = 500;
                    fireWatch(mockNewScope, endWatch, testBounds.end);
                    fireThrottledFn();
                    fireWatch(mockNewScope, startWatch, testBounds.start);
                    fireWatch(mockNewScope, endWatch, testBounds.end);
                    fireThrottledFn();
                    expect(mockScope.$broadcast).toHaveBeenCalled();
                });
            });

            it("exposes domain selection in scope", function () {
                representer.represent(testViews[0], null);

                expect(mockNewScope.ngModel.domain)
                    .toEqual(mockConductor.domain().key);
            });

            it("exposes domain options in scope", function () {
                representer.represent(testViews[0], null);

                mockConductor.domainOptions().forEach(function (option, i) {
                    expect(mockNewScope.ngModel.options[i].value)
                        .toEqual(option.key);
                    expect(mockNewScope.ngModel.options[i].name)
                        .toEqual(option.name);
                });
            });

            it("updates domain selection from scope", function () {
                var choice;
                representer.represent(testViews[0], null);

                // Choose a domain that isn't currently selected
                mockNewScope.ngModel.options.forEach(function (option) {
                    if (option.value !== mockNewScope.ngModel.domain) {
                        choice = option.value;
                    }
                });

                expect(mockConductor.domain)
                    .not.toHaveBeenCalledWith(choice);

                mockNewScope.ngModel.domain = choice;
                fireWatch(mockNewScope, "ngModel.domain", choice);

                expect(mockConductor.domain)
                    .toHaveBeenCalledWith(choice);
            });

        });
    }
);
