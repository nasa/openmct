/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/representers/EditToolbar'],
    function (EditToolbar) {
        "use strict";

        describe("An Edit mode toolbar", function () {
            var testStructure,
                testAB,
                testABC,
                testABC2,
                testABCXYZ,
                testABCYZ,
                testM;

            beforeEach(function () {
                testStructure = {
                    sections: [
                        {
                            items: [
                                { name: "A", property: "a" },
                                { name: "B", property: "b" },
                                { name: "C", property: "c" }
                            ]
                        },
                        {
                            items: [
                                { name: "X", property: "x", inclusive: true },
                                { name: "Y", property: "y" },
                                { name: "Z", property: "z" }
                            ]
                        },
                        {
                            items: [
                                { name: "M", method: "m" }
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

            it("prunes empty sections", function () {
                // Verify that all sections are included when applicable...
                expect(
                    new EditToolbar(testStructure, [ testABCXYZ ])
                        .getStructure()
                        .sections
                        .length
                ).toEqual(2);
                // ...but omitted when only some are applicable
                expect(
                    new EditToolbar(testStructure, [ testABC ])
                        .getStructure()
                        .sections
                        .length
                ).toEqual(1);
            });

            it("reads properties from selections", function () {
                var toolbar = new EditToolbar(testStructure, [ testABC ]),
                    structure = toolbar.getStructure(),
                    state = toolbar.getState();

                expect(state[structure.sections[0].items[0].key])
                    .toEqual(testABC.a);
                expect(state[structure.sections[0].items[1].key])
                    .toEqual(testABC.b);
                expect(state[structure.sections[0].items[2].key])
                    .toEqual(testABC.c);
            });

            it("reads properties from getters", function () {
                var toolbar, structure, state;

                testABC.a = function () { return "from a getter!"; };

                toolbar = new EditToolbar(testStructure, [ testABC ]);
                structure = toolbar.getStructure();
                state = toolbar.getState();

                expect(state[structure.sections[0].items[0].key])
                    .toEqual("from a getter!");
            });

            it("sets properties on update", function () {
                var toolbar = new EditToolbar(testStructure, [ testABC ]),
                    structure = toolbar.getStructure();
                toolbar.updateState(
                    structure.sections[0].items[0].key,
                    "new value"
                );
                // Should have updated the underlying object
                expect(testABC.a).toEqual("new value");
            });

            it("invokes setters on update", function () {
                var toolbar, structure, state;

                testABC.a = jasmine.createSpy('a');

                toolbar = new EditToolbar(testStructure, [ testABC ]);
                structure = toolbar.getStructure();

                toolbar.updateState(
                    structure.sections[0].items[0].key,
                    "new value"
                );
                // Should have updated the underlying object
                expect(testABC.a).toHaveBeenCalledWith("new value");
            });

            it("removes inapplicable items", function () {
                // First, verify with all items
                expect(
                    new EditToolbar(testStructure, [ testABC ])
                        .getStructure()
                        .sections[0]
                        .items
                        .length
                ).toEqual(3);
                // Then, try with some items omitted
                expect(
                    new EditToolbar(testStructure, [ testABC, testAB ])
                        .getStructure()
                        .sections[0]
                        .items
                        .length
                ).toEqual(2);
            });

            it("removes inconsistent states", function () {
                // Only two of three values match among these selections
                expect(
                    new EditToolbar(testStructure, [ testABC, testABC2 ])
                        .getStructure()
                        .sections[0]
                        .items
                        .length
                ).toEqual(2);
            });

            it("allows inclusive items", function () {
                // One inclusive item is in the set, property 'x' of the
                // second section; make sure items are pruned down
                // when only some of the selection has x,y,z properties
                expect(
                    new EditToolbar(testStructure, [ testABC, testABCXYZ ])
                        .getStructure()
                        .sections[1]
                        .items
                        .length
                ).toEqual(1);
            });

            it("removes inclusive items when there are no matches", function () {
                expect(
                    new EditToolbar(testStructure, [ testABCYZ ])
                        .getStructure()
                        .sections[1]
                        .items
                        .length
                ).toEqual(2);
            });

            it("adds click functions when a method is specified", function () {
                var testCommit = jasmine.createSpy('commit'),
                    toolbar = new EditToolbar(testStructure, [ testM ], testCommit);
                // Verify precondition
                expect(testM.m).not.toHaveBeenCalled();
                // Click!
                toolbar.getStructure().sections[0].items[0].click();
                // Should have called the underlying function
                expect(testM.m).toHaveBeenCalled();
                // Should also have committed the change
                expect(testCommit).toHaveBeenCalled();
            });
        });
    }
);


