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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine */

define(
    ['../src/Region'],
    function (Region) {
        "use strict";

        describe("The region class ", function () {

            var region,
                part2 = {'name': 'part2'};

            beforeEach(function(){
                region = new Region();
                region.parts = [
                    {name: 'part1'},
                    {name: 'part3'},
                    {name: 'part4'}
                ];
            });

            it("adding a region part at a specified index adds it in that" +
                " position", function() {

                region.addPart(part2, 1);

                expect(region.parts.length).toBe(4);
                expect(region.parts[1]).toBe(part2);
            });

            it("adding a region part without an index adds it at the end", function() {
                var partN = {'name': 'partN'};

                region.addPart(partN);

                expect(region.parts.length).toBe(4);
                expect(region.parts[region.parts.length-1]).toBe(partN);
            });

            describe("removing a region part", function(){
                var partName = "part2";

                beforeEach(function(){
                    region.parts = [
                        {name: 'part1'},
                        part2,
                        {name: 'part3'},
                        {name: 'part4'}
                    ];
                });

                it("with a string matches on region part" +
                    " name", function() {
                    expect(region.parts.length).toBe(4);
                    expect(region.parts.indexOf(part2)).toBe(1);

                    region.removePart(partName);

                    expect(region.parts.length).toBe(3);
                    expect(region.parts.indexOf(part2)).toBe(-1);
                });

                it("with a number removes by index", function() {
                    expect(region.parts.length).toBe(4);
                    expect(region.parts.indexOf(part2)).toBe(1);

                    region.removePart(1);

                    expect(region.parts.length).toBe(3);
                    expect(region.parts.indexOf(part2)).toBe(-1);
                });


                it("with object matches that object", function() {
                    expect(region.parts.length).toBe(4);
                    expect(region.parts.indexOf(part2)).toBe(1);

                    region.removePart(part2);

                    expect(region.parts.length).toBe(3);
                    expect(region.parts.indexOf(part2)).toBe(-1);
                });
            });
        });
    }
);
