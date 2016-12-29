/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
    ['../src/Region'],
    (Region) => {

        describe("The region class ", () {

            let region,
                part2 = new Region({'name': 'part2'});

            beforeEach( () => {
                region = new Region();
                region.regions = [
                    new Region({name: 'part1'}),
                    new Region({name: 'part3'}),
                    new Region({name: 'part4'})
                ];
            });

            it("adding a region at a specified index adds it in that" +
                " position", () => {

                    region.addRegion(part2, 1);

                    expect(region.regions.length).toBe(4);
                    expect(region.regions[1]).toBe(part2);
                });

            it("adding a region without an index adds it at the end", () => {
                let partN = new Region({'name': 'partN'});

                region.addRegion(partN);

                expect(region.regions.length).toBe(4);
                expect(region.regions[region.regions.length - 1]).toBe(partN);
            });

            describe("removing a region", () => {
                let partName = "part2";

                beforeEach( () => {
                    region.regions = [
                        new Region({name: 'part1'}),
                        part2,
                        new Region({name: 'part3'}),
                        new Region({name: 'part4'})
                    ];
                });

                it("with a string matches on region name", () => {
                    expect(region.regions.length).toBe(4);
                    expect(region.regions.indexOf(part2)).toBe(1);

                    region.removeRegion(partName);

                    expect(region.regions.length).toBe(3);
                    expect(region.regions.indexOf(part2)).toBe(-1);
                });

                it("with a number removes by index", () => {
                    expect(region.regions.length).toBe(4);
                    expect(region.regions.indexOf(part2)).toBe(1);

                    region.removeRegion(1);

                    expect(region.regions.length).toBe(3);
                    expect(region.regions.indexOf(part2)).toBe(-1);
                });


                it("with object matches that object", () => {
                    expect(region.regions.length).toBe(4);
                    expect(region.regions.indexOf(part2)).toBe(1);

                    region.removeRegion(part2);

                    expect(region.regions.length).toBe(3);
                    expect(region.regions.indexOf(part2)).toBe(-1);
                });
            });
        });
    }
);
