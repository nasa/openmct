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
    ['../../src/elements/ElementProxy'],
    function (ElementProxy) {

        describe("A fixed position element proxy", function () {
            var testElement,
                testElements,
                proxy;

            beforeEach(function () {
                testElement = {
                    x: 1,
                    y: 2,
                    stroke: '#717171',
                    width: 42,
                    height: 24,
                    useGrid: true
                };
                testElements = [{}, {}, testElement, {}];
                proxy = new ElementProxy(
                    testElement,
                    testElements.indexOf(testElement),
                    testElements,
                    [13,21]
                );
            });

            it("exposes element properties", function () {
                Object.keys(testElement).forEach(function (k) {
                    expect(proxy[k]()).toEqual(testElement[k]);
                });
            });

            it("allows order to be changed", function () {
                proxy.order("down");
                expect(testElements).toEqual([{}, testElement, {}, {}]);
                proxy.order("up");
                expect(testElements).toEqual([{}, {}, testElement, {}]);
                proxy.order("bottom");
                expect(testElements).toEqual([testElement, {}, {}, {}]);
                proxy.order("top");
                expect(testElements).toEqual([{}, {}, {}, testElement]);
            });

            it("ensures x/y values are non-negative", function () {
                proxy.x(-1);
                proxy.y(-400);
                expect(proxy.x()).toEqual(0);
                expect(proxy.y()).toEqual(0);
            });

            it("allows modifying the current grid size", function () {
                proxy.setGridSize([112,420]);
                expect(proxy.gridSize).toEqual([112,420]);
            });

            it("returns the current grid size only if the element snaps to grid", function () {
                expect(proxy.getGridSize()).toEqual([13,21]);
                proxy.useGrid(false);
                expect(proxy.getGridSize()).toEqual([1,1]);
            });

            it("returns the mininum height and width of an element currently used units", function () {
                // Assumes mininum height and width are 10, in pixels
                expect(proxy.getMinWidth()).toEqual(1);
                expect(proxy.getMinHeight()).toEqual(1);
                proxy.setGridSize([7,4]);
                expect(proxy.getMinWidth()).toEqual(2);
                expect(proxy.getMinHeight()).toEqual(3);
                proxy.useGrid(false);
                expect(proxy.getMinWidth()).toEqual(10);
                expect(proxy.getMinHeight()).toEqual(10);
            });
        });
    }
);
