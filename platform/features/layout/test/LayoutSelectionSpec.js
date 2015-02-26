/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../src/LayoutSelection'],
    function (LayoutSelection) {
        "use strict";

        describe("Layout/fixed position selection manager", function () {
            var testSelection,
                testProxy,
                testElement,
                otherElement,
                selection;

            beforeEach(function () {
                testSelection = [];
                testProxy = { someKey: "some value" };
                testElement = { someOtherKey: "some other value" };
                otherElement = { yetAnotherKey: 42 };
                selection = new LayoutSelection(testSelection, testProxy);
            });

            it("adds the proxy to the selection array", function () {
                expect(testSelection).toEqual([testProxy]);
            });

            it("includes selected objects alongside the proxy", function () {
                selection.select(testElement);
                expect(testSelection).toEqual([testProxy, testElement]);
            });

            it("allows elements to be deselected", function () {
                selection.select(testElement);
                selection.deselect();
                expect(testSelection).toEqual([testProxy]);
            });

            it("replaces old selections with new ones", function () {
                selection.select(testElement);
                selection.select(otherElement);
                expect(testSelection).toEqual([testProxy, otherElement]);
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

            it("cleans up the selection on destroy", function () {
                selection.destroy();
                expect(testSelection).toEqual([]);
            });

            it("preserves other elements in the array", function () {
                testSelection.push(42);
                selection.select(testElement);
                expect(testSelection).toEqual([testProxy, testElement, 42]);
            });

            it("considers the proxy to be selected", function () {
                expect(selection.selected(testProxy)).toBeTruthy();
                selection.select(testElement);
                // Even when something else is selected...
                expect(selection.selected(testProxy)).toBeTruthy();
            });

            it("treats selection of the proxy as a no-op", function () {
                selection.select(testProxy);
                expect(testSelection).toEqual([testProxy]);
            });

        });
    }
);
