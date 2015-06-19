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
    ["../src/LayoutDrag"],
    function (LayoutDrag) {
        "use strict";

        describe("A Layout drag handler", function () {
            var testPosition = {
                    position: [ 8, 11 ],
                    dimensions: [ 3, 2 ]
                };

            it("changes position by a supplied factor, rounding by grid size", function () {
                var handler = new LayoutDrag(
                    testPosition,
                    [ 1, 1 ],
                    [ 0, 0 ],
                    [ 10, 20 ]
                );

                expect(handler.getAdjustedPosition([ 37, 84 ])).toEqual({
                    position: [ 12, 15 ],
                    dimensions: [ 3, 2 ]
                });
                expect(handler.getAdjustedPosition([ -37, 84 ])).toEqual({
                    position: [ 4, 15 ],
                    dimensions: [ 3, 2 ]
                });
            });

            it("changes dimensions by a supplied factor, rounding by grid size", function () {
                var handler = new LayoutDrag(
                    testPosition,
                    [ 0, 0 ],
                    [ 1, 1 ],
                    [ 10, 20 ]
                );

                expect(handler.getAdjustedPosition([ 37, 84 ])).toEqual({
                    position: [ 8, 11 ],
                    dimensions: [ 7, 6 ]
                });
            });

            it("allows mixing dimension and position factors", function () {
                var handler = new LayoutDrag(
                    testPosition,
                    [ 0, 1 ],
                    [ -1, 0 ],
                    [ 10, 20 ]
                );

                expect(handler.getAdjustedPosition([ 11, 84 ])).toEqual({
                    position: [ 8, 15 ],
                    dimensions: [ 2, 2 ]
                });
            });

        });
    }
);