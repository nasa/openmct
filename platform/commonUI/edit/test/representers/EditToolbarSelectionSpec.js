/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../../src/representers/EditToolbarSelection'],
    function (EditToolbarSelection) {
        "use strict";

        describe("The Edit mode selection manager", function () {
            var testProxy,
                testElement,
                otherElement,
                selection;

            beforeEach(function () {
                testProxy = { someKey: "some value" };
                testElement = { someOtherKey: "some other value" };
                otherElement = { yetAnotherKey: 42 };
                selection = new EditToolbarSelection();
                selection.proxy(testProxy);
            });

            it("adds the proxy to the selection array", function () {
                expect(selection.all()).toEqual([testProxy]);
            });

            it("exposes view proxy", function () {
                expect(selection.proxy()).toBe(testProxy);
            });

            it("includes selected objects alongside the proxy", function () {
                selection.select(testElement);
                expect(selection.all()).toEqual([testProxy, testElement]);
            });

            it("allows elements to be deselected", function () {
                selection.select(testElement);
                selection.deselect();
                expect(selection.all()).toEqual([testProxy]);
            });

            it("replaces old selections with new ones", function () {
                selection.select(testElement);
                selection.select(otherElement);
                expect(selection.all()).toEqual([testProxy, otherElement]);
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

            it("considers the proxy to be selected", function () {
                expect(selection.selected(testProxy)).toBeTruthy();
                selection.select(testElement);
                // Even when something else is selected...
                expect(selection.selected(testProxy)).toBeTruthy();
            });

            it("treats selection of the proxy as a no-op", function () {
                selection.select(testProxy);
                expect(selection.all()).toEqual([testProxy]);
            });

        });
    }
);
