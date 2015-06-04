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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/LineProxy'],
    function (LineProxy) {
        "use strict";

        describe("A fixed position line proxy", function () {
            var vertical, horizontal, diagonal, reversed;

            beforeEach(function () {
                vertical = { x: 1, y: 4, x2: 1, y2: 8 };
                horizontal = { x: 3, y: 3, x2: 12, y2: 3 };
                diagonal = { x: 3, y: 8, x2: 5, y2: 11 };
                reversed = { x2: 3, y2: 8, x: 5, y: 11 };
            });

            it("ensures visible width for vertical lines", function () {
                expect(new LineProxy(vertical).width()).toEqual(1);
            });

            it("ensures visible height for horizontal lines", function () {
                expect(new LineProxy(horizontal).height()).toEqual(1);
            });

            it("provides a bounding box for lines", function () {
                var proxy = new LineProxy(diagonal);
                expect(proxy.x()).toEqual(3);
                expect(proxy.y()).toEqual(8);
                expect(proxy.width()).toEqual(2);
                expect(proxy.height()).toEqual(3);
            });

            it("bounds lines identically regardless of point order", function () {
                // That is, x(), width(), y(), and height() should always give
                // the same results for the same line segments, regardless of
                // which point is x,y and which is x2,y2
                ['x', 'y', 'width', 'height'].forEach(function (method) {
                    expect(new LineProxy(diagonal)[method]())
                        .toEqual(new LineProxy(reversed)[method]());
                });
            });

            it("adjusts both ends when mutating x", function () {
                var proxy = new LineProxy(diagonal);
                proxy.x(6);
                expect(diagonal).toEqual({ x: 6, y: 8, x2: 8, y2: 11 });
            });

            it("adjusts both ends when mutating y", function () {
                var proxy = new LineProxy(diagonal);
                proxy.y(6);
                expect(diagonal).toEqual({ x: 3, y: 6, x2: 5, y2: 9 });
            });

            it("provides internal positions for SVG lines", function () {
                var proxy;
                proxy = new LineProxy(diagonal);
                expect(proxy.x1()).toEqual(0);
                expect(proxy.y1()).toEqual(0);
                expect(proxy.x2()).toEqual(2);
                expect(proxy.y2()).toEqual(3);
                proxy = new LineProxy(reversed);
                expect(proxy.x1()).toEqual(2);
                expect(proxy.y1()).toEqual(3);
                expect(proxy.x2()).toEqual(0);
                expect(proxy.y2()).toEqual(0);
            });

            it("provides handles for both ends", function () {
                expect(new LineProxy(diagonal).handles().length).toEqual(2);
            });

        });
    }
);