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
    ["../src/OneWayBinder"],
    function (OneWayBinder) {
        'use strict';

        describe("OneWayBinder", function () {
            var mockScope,
                testAttrs,
                testValues,
                mockUnwatches,
                binder;

            function fireEvent(event) {
                mockScope.$on.calls.forEach(function (call) {
                    if (call.args[0] === event) {
                        call.args[1]();
                    }
                });
            }

            function fireParentWatch(expr) {
                mockScope.$parent.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](mockScope.$parent.$eval(expr));
                    }
                });
            }

            beforeEach(function () {
                mockUnwatches = [];

                mockScope = jasmine.createSpyObj('$scope', ['$on']);
                mockScope.$parent = jasmine.createSpyObj(
                    '$parent',
                    [ '$watch', '$eval' ]
                );
                testAttrs = { a: 'attrA', b: 'attrB', c: 'attrC' };
                testValues = { attrA: 42, attrB: ['foo'], attrC: { a: 0 } };

                mockScope.$parent.$eval.andCallFake(function (expr) {
                    return testValues[expr];
                });

                mockScope.$parent.$watch.andCallFake(function () {
                    var mockUnwatch = jasmine.createSpy();
                    mockUnwatches.push(mockUnwatch);
                    return mockUnwatch;
                });

                binder = new OneWayBinder(mockScope, testAttrs);
            });

            describe("bind", function () {
                var attrNames;

                beforeEach(function () {
                    attrNames = Object.keys(testAttrs);
                    attrNames.forEach(function (attr) {
                        binder.bind(attr);
                    });
                });

                it("exposes values from the parent in scope", function () {
                    attrNames.forEach(function (attr) {
                        expect(mockScope[attr])
                            .toEqual(testValues[testAttrs[attr]]);
                    });
                });

                it("updates values from the parent in scope", function () {
                    var oldValues = testValues,
                        newValues = {};
                    Object.keys(oldValues).forEach(function (key) {
                        newValues[key] = oldValues[key] + " a change";
                    });

                    testValues = newValues;

                    attrNames.forEach(function (attr) {
                        expect(mockScope[attr])
                            .toEqual(oldValues[testAttrs[attr]]);
                        fireParentWatch(testAttrs[attr]);
                        expect(mockScope[attr])
                            .toEqual(newValues[testAttrs[attr]]);
                    });
                });

                it("attaches one watch per attribute", function () {
                    expect(mockUnwatches.length).toEqual(3);
                });
            });

            describe("alias", function () {
                var attrNames;

                beforeEach(function () {
                    binder.alias('a', 'someAlias');
                });

                it("exposes values under a different name", function () {
                    expect(mockScope.someAlias).toEqual(testValues.attrA);
                });

                it("updates values under a different name", function () {
                    var newValue = "some new value";
                    testValues.attrA = newValue;
                    expect(mockScope.someAlias).not.toEqual(newValue);
                    fireParentWatch(testAttrs.a);
                    expect(mockScope.someAlias).toEqual(newValue);
                });
            });

            describe("watch", function () {
                var mockCallback = jasmine.createSpy();
                beforeEach(function () {
                    binder.watch('b', mockCallback);
                });

                it("invokes callbacks when values change", function () {
                    var newValue = "some new value";
                    testValues.attrB = newValue;
                    expect(mockCallback).not.toHaveBeenCalled();
                    fireParentWatch(testAttrs.b);
                    expect(mockCallback).toHaveBeenCalledWith(newValue);
                });

                it("generally watches for reference equality", function () {
                    expect(mockScope.$parent.$watch.mostRecentCall.args[2])
                        .toBeFalsy();
                });

                it("watches for equivalence when expressions are anonymous objects", function () {
                    testAttrs.d = "{ a: 'foo' }";
                    binder.watch('d', mockCallback);
                    expect(mockScope.$parent.$watch.mostRecentCall.args[2])
                        .toBeTruthy();
                });
            });

            it("releases watches from parent when scope is destroyed", function () {
                binder.bind('a');
                binder.alias('b', 'xyz');
                binder.watch('c', jasmine.createSpy());
                fireEvent('$destroy');
                mockUnwatches.forEach(function (mockUnwatch) {
                    expect(mockUnwatch).toHaveBeenCalled();
                });
            });

        });

    }
);
