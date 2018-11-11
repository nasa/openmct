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
    ['../../src/elements/ResizeHandle'],
    function (ResizeHandle) {

        var TEST_MIN_WIDTH = 4,
            TEST_MIN_HEIGHT = 2,
            TEST_GRID_SIZE = [34, 81];

        describe("A fixed position drag handle", function () {
            var testElement,
                mockElementProxy,
                handle;

            beforeEach(function () {
                testElement = {
                    x: 3,
                    y: 42,
                    width: 30,
                    height: 36,
                    useGrid: true
                };
                mockElementProxy = jasmine.createSpyObj('elementProxy', [
                    'getGridSize',
                    'getMinWidth',
                    'getMinHeight'
                ]);
                mockElementProxy.getGridSize.and.returnValue(TEST_GRID_SIZE);
                mockElementProxy.getMinWidth.and.returnValue(TEST_MIN_WIDTH);
                mockElementProxy.getMinHeight.and.returnValue(TEST_MIN_HEIGHT);

                handle = new ResizeHandle(
                    mockElementProxy,
                    testElement
                );
            });

            it("provides x/y grid coordinates for lower-right corner", function () {
                expect(handle.x()).toEqual(33);
                expect(handle.y()).toEqual(78);
            });

            it("changes width of an element", function () {
                handle.x(30);
                // Should change width, not x
                expect(testElement.x).toEqual(3);
                expect(testElement.width).toEqual(27);
            });

            it("changes height of an element", function () {
                handle.y(60);
                // Should change height, not y
                expect(testElement.y).toEqual(42);
                expect(testElement.height).toEqual(18);
            });

            it("enforces minimum width/height", function () {
                handle.x(testElement.x);
                handle.y(testElement.y);
                expect(testElement.x).toEqual(3);
                expect(testElement.y).toEqual(42);
                expect(testElement.width).toEqual(TEST_MIN_WIDTH);
                expect(testElement.height).toEqual(TEST_MIN_HEIGHT);
            });

            it("returns the correct grid size", function () {
                expect(handle.getGridSize()).toEqual(TEST_GRID_SIZE);
            });

        });
    }
);
