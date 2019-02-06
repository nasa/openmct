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
    ['../../src/elements/UnitAccessorMutator'],
    function (UnitAccessorMutator) {

        var GRID_SIZE = [13,17];

        describe("An elementProxy.gridSize accessor-mutator", function () {
            var mockElementProxy,
                testElement,
                mockLineProxy,
                testLine,
                uAM,
                uAMLine;

            beforeEach(function () {
                testElement = {
                    x: 2,
                    y: 3,
                    width: 4,
                    height: 5,
                    useGrid: true
                };

                mockElementProxy = {
                    element: testElement,
                    gridSize: GRID_SIZE,
                    getMinHeight: jasmine.createSpy('minHeight'),
                    getMinWidth: jasmine.createSpy('minWidth')
                };

                testLine = {
                    x: 7,
                    y: 8,
                    x2: 9,
                    y2: 10,
                    width: 11,
                    height: 12,
                    useGrid: true
                };

                mockLineProxy = {
                    element: testLine,
                    gridSize: GRID_SIZE,
                    getMinHeight: jasmine.createSpy('minHeight'),
                    getMinWidth: jasmine.createSpy('minWidth')
                };



                uAM = new UnitAccessorMutator(mockElementProxy);
                uAMLine = new UnitAccessorMutator(mockLineProxy);

                mockElementProxy.getMinWidth.and.returnValue(1);
                mockElementProxy.getMinHeight.and.returnValue(1);

                mockLineProxy.getMinWidth.and.returnValue(1);
                mockLineProxy.getMinHeight.and.returnValue(1);
            });

            it("allows access to useGrid", function () {
                expect(uAM()).toEqual(mockElementProxy.element.useGrid);
            });

            it("allows mutation of useGrid", function () {
                uAM(false);
                expect(mockElementProxy.element.useGrid).toEqual(false);
            });

            it("converts coordinates appropriately for a box", function () {
                uAM(false);
                expect(mockElementProxy.element.x).toEqual(26);
                expect(mockElementProxy.element.y).toEqual(51);
                expect(mockElementProxy.element.width).toEqual(52);
                expect(mockElementProxy.element.height).toEqual(85);
                uAM(true);
                expect(mockElementProxy.element.x).toEqual(2);
                expect(mockElementProxy.element.y).toEqual(3);
                expect(mockElementProxy.element.width).toEqual(4);
                expect(mockElementProxy.element.height).toEqual(5);
            });

            it("converts coordinates appropriately for a line", function () {
                uAMLine(false);
                expect(mockLineProxy.element.x).toEqual(91);
                expect(mockLineProxy.element.y).toEqual(136);
                expect(mockLineProxy.element.x2).toEqual(117);
                expect(mockLineProxy.element.y2).toEqual(170);
                expect(mockLineProxy.element.width).toEqual(143);
                expect(mockLineProxy.element.height).toEqual(204);
                uAMLine(true);
                expect(mockLineProxy.element.x).toEqual(7);
                expect(mockLineProxy.element.y).toEqual(8);
                expect(mockLineProxy.element.x2).toEqual(9);
                expect(mockLineProxy.element.y2).toEqual(10);
                expect(mockLineProxy.element.width).toEqual(11);
                expect(mockLineProxy.element.height).toEqual(12);
            });

            it("doesn't covert coordinates unecessarily", function () {
                uAM(false);
                expect(mockElementProxy.element.x).toEqual(26);
                expect(mockElementProxy.element.y).toEqual(51);
                expect(mockElementProxy.element.width).toEqual(52);
                expect(mockElementProxy.element.height).toEqual(85);
                uAM(false);
                expect(mockElementProxy.element.x).toEqual(26);
                expect(mockElementProxy.element.y).toEqual(51);
                expect(mockElementProxy.element.width).toEqual(52);
                expect(mockElementProxy.element.height).toEqual(85);
            });

            it("snaps coordinates onto the grid", function () {
                uAM(false);
                mockElementProxy.element.x += 11;
                mockElementProxy.element.y -= 27;
                mockElementProxy.element.width -= 14;
                mockElementProxy.element.height += 4;
                uAM(true);
                expect(mockElementProxy.element.x).toEqual(3);
                expect(mockElementProxy.element.y).toEqual(1);
                expect(mockElementProxy.element.width).toEqual(3);
                expect(mockElementProxy.element.height).toEqual(5);
            });

            it("enforces a minimum height and width", function () {
                uAM(false);
                mockElementProxy.element.width = 4;
                mockElementProxy.element.height = 4;
                uAM(true);
                expect(mockElementProxy.element.width).toEqual(1);
                expect(mockElementProxy.element.height).toEqual(1);
            });
        });
    }
);
