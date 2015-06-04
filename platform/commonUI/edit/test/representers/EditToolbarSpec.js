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
    ['../../src/representers/EditToolbar'],
    function (EditToolbar) {
        "use strict";

        describe("An Edit mode toolbar", function () {
            var mockCommit,
                testStructure,
                testAB,
                testABC,
                testABC2,
                testABCXYZ,
                testABCYZ,
                testM,
                toolbar;

            function getVisibility(obj) {
                return !obj.hidden;
            }

            beforeEach(function () {
                mockCommit = jasmine.createSpy('commit');
                testStructure = {
                    sections: [
                        {
                            items: [
                                { name: "A", property: "a", exclusive: true },
                                { name: "B", property: "b", exclusive: true },
                                { name: "C", property: "c", exclusive: true }
                            ]
                        },
                        {
                            items: [
                                { name: "X", property: "x" },
                                { name: "Y", property: "y", exclusive: true },
                                { name: "Z", property: "z", exclusive: true }
                            ]
                        },
                        {
                            items: [
                                { name: "M", method: "m", exclusive: true }
                            ]
                        }
                    ]
                };
                testAB = { a: 0, b: 1 };
                testABC = { a: 0, b: 1, c: 2 };
                testABC2 = { a: 4, b: 1, c: 2 }; // For inconsistent-state checking
                testABCXYZ = { a: 0, b: 1, c: 2, x: 'X!', y: 'Y!', z: 'Z!' };
                testABCYZ = { a: 0, b: 1, c: 2, y: 'Y!', z: 'Z!' };
                testM = { m: jasmine.createSpy("method") };

                toolbar = new EditToolbar(testStructure, mockCommit);
            });

            it("provides properties from the original structure", function () {
                expect(
                    new EditToolbar(testStructure, [ testABC ])
                        .getStructure()
                        .sections[0]
                        .items[1]
                        .name
                ).toEqual("B");
            });

            // This is needed by mct-toolbar
            it("adds keys to form structure", function () {
                expect(
                    new EditToolbar(testStructure, [ testABC ])
                        .getStructure()
                        .sections[0]
                        .items[1]
                        .key
                ).not.toBeUndefined();
            });

            it("marks empty sections as hidden", function () {
                // Verify that all sections are included when applicable...
                toolbar.setSelection([ testABCXYZ ]);
                expect(toolbar.getStructure().sections.map(getVisibility))
                    .toEqual([ true, true, false ]);

                // ...but omitted when only some are applicable
                toolbar.setSelection([ testABC ]);
                expect(toolbar.getStructure().sections.map(getVisibility))
                    .toEqual([ true, false, false ]);
            });

            it("reads properties from selections", function () {
                var structure, state;

                toolbar.setSelection([ testABC ]);

                structure = toolbar.getStructure();
                state = toolbar.getState();

                expect(state[structure.sections[0].items[0].key])
                    .toEqual(testABC.a);
                expect(state[structure.sections[0].items[1].key])
                    .toEqual(testABC.b);
                expect(state[structure.sections[0].items[2].key])
                    .toEqual(testABC.c);
            });

            it("reads properties from getters", function () {
                var structure, state;

                testABC.a = function () { return "from a getter!"; };

                toolbar.setSelection([ testABC ]);
                structure = toolbar.getStructure();
                state = toolbar.getState();

                expect(state[structure.sections[0].items[0].key])
                    .toEqual("from a getter!");
            });

            it("sets properties on update", function () {
                toolbar.setSelection([ testABC ]);
                toolbar.updateState(
                    toolbar.getStructure().sections[0].items[0].key,
                    "new value"
                );
                // Should have updated the underlying object
                expect(testABC.a).toEqual("new value");
            });

            it("invokes setters on update", function () {
                var structure, state;

                testABC.a = jasmine.createSpy('a');

                toolbar.setSelection([ testABC ]);
                structure = toolbar.getStructure();

                toolbar.updateState(
                    structure.sections[0].items[0].key,
                    "new value"
                );
                // Should have updated the underlying object
                expect(testABC.a).toHaveBeenCalledWith("new value");
            });

            it("provides a return value describing update status", function () {
                // Should return true if actually updated, otherwise false
                var key;
                toolbar.setSelection([ testABC ]);
                key = toolbar.getStructure().sections[0].items[0].key;
                expect(toolbar.updateState(key, testABC.a)).toBeFalsy();
                expect(toolbar.updateState(key, "new value")).toBeTruthy();
            });

            it("removes inapplicable items", function () {
                // First, verify with all items
                toolbar.setSelection([ testABC ]);
                expect(toolbar.getStructure().sections[0].items.map(getVisibility))
                    .toEqual([ true, true, true ]);
                // Then, try with some items omitted
                toolbar.setSelection([ testABC, testAB ]);
                expect(toolbar.getStructure().sections[0].items.map(getVisibility))
                    .toEqual([ true, true, false ]);
            });

            it("removes inconsistent states", function () {
                // Only two of three values match among these selections
                toolbar.setSelection([ testABC, testABC2 ]);
                expect(toolbar.getStructure().sections[0].items.map(getVisibility))
                    .toEqual([ false, true, true ]);
            });

            it("allows inclusive items", function () {
                // One inclusive item is in the set, property 'x' of the
                // second section; make sure items are pruned down
                // when only some of the selection has x,y,z properties
                toolbar.setSelection([ testABC, testABCXYZ ]);
                expect(toolbar.getStructure().sections[1].items.map(getVisibility))
                    .toEqual([ true, false, false ]);
            });

            it("removes inclusive items when there are no matches", function () {
                toolbar.setSelection([ testABCYZ ]);
                expect(toolbar.getStructure().sections[1].items.map(getVisibility))
                    .toEqual([ false, true, true ]);
            });

            it("adds click functions when a method is specified", function () {
                toolbar.setSelection([testM]);
                // Verify precondition
                expect(testM.m).not.toHaveBeenCalled();
                // Click!
                toolbar.getStructure().sections[2].items[0].click();
                // Should have called the underlying function
                expect(testM.m).toHaveBeenCalled();
                // Should also have committed the change
                expect(mockCommit).toHaveBeenCalled();
            });
        });
    }
);


