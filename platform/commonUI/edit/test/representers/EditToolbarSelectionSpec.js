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
/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../../src/representers/EditToolbarSelection'],
    function (EditToolbarSelection) {
        "use strict";

        describe("The Edit mode selection manager", function () {
            var testProxy,
                testElement,
                otherElement,
                selection;

            beforeEach(function () {
                testProxy = { someKey: "some value" };
                testElement = { someOtherKey: "some other value" };
                otherElement = { yetAnotherKey: 42 };
                selection = new EditToolbarSelection();
                selection.proxy(testProxy);
            });

            it("adds the proxy to the selection array", function () {
                expect(selection.all()).toEqual([testProxy]);
            });

            it("exposes view proxy", function () {
                expect(selection.proxy()).toBe(testProxy);
            });

            it("includes selected objects alongside the proxy", function () {
                selection.select(testElement);
                expect(selection.all()).toEqual([testProxy, testElement]);
            });

            it("allows elements to be deselected", function () {
                selection.select(testElement);
                selection.deselect();
                expect(selection.all()).toEqual([testProxy]);
            });

            it("replaces old selections with new ones", function () {
                selection.select(testElement);
                selection.select(otherElement);
                expect(selection.all()).toEqual([testProxy, otherElement]);
            });

            it("allows retrieval of the current selection", function () {
                selection.select(testElement);
                expect(selection.get()).toBe(testElement);
                selection.select(otherElement);
                expect(selection.get()).toBe(otherElement);
            });

            it("can check if an element is selected", function () {
                selection.select(testElement);
                expect(selection.selected(testElement)).toBeTruthy();
                expect(selection.selected(otherElement)).toBeFalsy();
                selection.select(otherElement);
                expect(selection.selected(testElement)).toBeFalsy();
                expect(selection.selected(otherElement)).toBeTruthy();
            });

            it("considers the proxy to be selected", function () {
                expect(selection.selected(testProxy)).toBeTruthy();
                selection.select(testElement);
                // Even when something else is selected...
                expect(selection.selected(testProxy)).toBeTruthy();
            });

            it("treats selection of the proxy as a no-op", function () {
                selection.select(testProxy);
                expect(selection.all()).toEqual([testProxy]);
            });

        });
    }
);
