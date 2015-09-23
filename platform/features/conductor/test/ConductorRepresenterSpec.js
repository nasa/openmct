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
/*global define,describe,it,expect,beforeEach,waitsFor,afterEach,jasmine*/

/**
 *  EventSpec. Created by vwoeltje on 11/6/14. Modified by shale on 06/23/2015.
 */
define(
    ["../src/ConductorRepresenter"],
    function (ConductorRepresenter) {
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
                'remove'
            ];

        describe("ConductorRepresenter", function () {
            var mockConductorService,
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
                mockConductorService = jasmine.createSpyObj(
                    'conductorService',
                    ['getConductor']
                );
                mockCompile = jasmine.createSpy('$compile');
                testViews = [ { someKey: "some value" } ];
                mockScope = jasmine.createSpyObj('scope', SCOPE_METHODS);
                mockElement = jasmine.createSpyObj('element', ELEMENT_METHODS);
                mockConductor = jasmine.createSpyObj(
                    'conductor',
                    [ 'queryStart', 'queryEnd', 'displayStart', 'displayEnd' ]
                );
                mockCompiledTemplate = jasmine.createSpy('template');
                mockNewScope = jasmine.createSpyObj('newScope', SCOPE_METHODS);
                mockNewElement = jasmine.createSpyObj('newElement', ELEMENT_METHODS);
                mockNewElement[0] = mockNewElement;

                mockConductorService.getConductor.andReturn(mockConductor);
                mockCompile.andReturn(mockCompiledTemplate);
                mockCompiledTemplate.andReturn(mockNewElement);
                mockScope.$new.andReturn(mockNewScope);

                representer = new ConductorRepresenter(
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
                mockConductor.queryStart.andReturn(42);
                mockConductor.queryEnd.andReturn(12321);
                mockConductor.displayStart.andReturn(1977);
                mockConductor.displayEnd.andReturn(1984);
                representer.represent(testViews[0], {});

                expect(mockNewScope.conductor).toEqual({
                    inner: { start: 1977, end: 1984 },
                    outer: { start: 42, end: 12321 }
                });
            });

            it("updates conductor state from scope", function () {
                var testState = {
                    inner: { start: 42, end: 1984 },
                    outer: { start: -1977, end: 12321 }
                };

                representer.represent(testViews[0], {});

                mockNewScope.conductor = testState;

                fireWatch(mockNewScope, 'conductor.inner.start', testState.inner.start);
                expect(mockConductor.displayStart).toHaveBeenCalledWith(42);

                fireWatch(mockNewScope, 'conductor.inner.end', testState.inner.end);
                expect(mockConductor.displayEnd).toHaveBeenCalledWith(1984);

                fireWatch(mockNewScope, 'conductor.outer.start', testState.outer.start);
                expect(mockConductor.queryStart).toHaveBeenCalledWith(-1977);

                fireWatch(mockNewScope, 'conductor.outer.end', testState.outer.end);
                expect(mockConductor.queryEnd).toHaveBeenCalledWith(12321);
            });

        });
    }
);
