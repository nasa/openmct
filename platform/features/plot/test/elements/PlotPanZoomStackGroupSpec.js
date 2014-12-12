/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotPanZoomStackGroup"],
    function (PlotPanZoomStackGroup) {
        "use strict";

        var COUNT = 8;

        describe("A plot pan-zoom stack group", function () {
            var stacks,
                group;

            beforeEach(function () {
                group = new PlotPanZoomStackGroup(COUNT);
                stacks = [];
                while (stacks.length < COUNT) {
                    stacks.push(group.getPanZoomStack(stacks.length));
                }
            });

            it("creates a number of separate stacks", function () {
                expect(group.getPanZoomStack(0)).toBeDefined();
                expect(group.getPanZoomStack(COUNT - 1)).toBeDefined();
                expect(group.getPanZoomStack(COUNT)).toBeUndefined();
            });

            it("synchronizes pan-zoom stack depth", function () {
                expect(group.getDepth()).toEqual(1);
                group.getPanZoomStack(1).pushPanZoom([ 10, 20 ], [ 30, 40 ]);
                stacks.forEach(function (stack) {
                    expect(stack.getDepth()).toEqual(2);
                });
            });

            it("synchronizes domain but not range", function () {
                // Set up different initial states
                stacks.forEach(function (stack, i) {
                    stack.pushPanZoom([ i, i ], [ i, i ]);
                });

                // Push a new pan-zoom state onto one of the stacks
                group.getPanZoomStack(1).pushPanZoom([ 99, 99 ], [ 42, 42 ]);

                // Should changed domain values for all stacks, but
                // only changed range values for stack 1
                stacks.forEach(function (stack, i) {
                    expect(stack.getOrigin())
                        .toEqual([99, i === 1 ? 99 : i]);
                    expect(stack.getDimensions())
                        .toEqual([42, i === 1 ? 42 : i]);
                });
            });

            it("synchronizes base pan-zoom", function () {
                group.setBasePanZoom([10, 9], [8, 7]);
                stacks.forEach(function (stack) {
                    expect(stack.getOrigin()).toEqual([10, 9]);
                    expect(stack.getDimensions()).toEqual([8, 7]);
                });
            });

            it("clears pan-zoom on request", function () {
                // Set up different initial states
                stacks.forEach(function (stack, i) {
                    stack.pushPanZoom([ i, i ], [ i, i ]);
                });

                // Verify that we have a greater depth
                expect(group.getDepth() > 1).toBeTruthy();

                // Clear the pan-zoom state
                group.clearPanZoom();

                // Should be back down to our initial state
                expect(group.getDepth()).toEqual(1);
                stacks.forEach(function (stack) {
                    expect(stack.getDepth()).toEqual(1);
                });
            });

            it("pops pan-zoom on request", function () {
                // Set up different initial states
                stacks.forEach(function (stack, i) {
                    stack.pushPanZoom([ i, i ], [ i, i ]);
                });

                // Verify that we have a greater depth
                expect(group.getDepth()).toEqual(COUNT + 1);

                // Clear the pan-zoom state
                group.popPanZoom();

                // Should be back down to our initial state
                expect(group.getDepth()).toEqual(COUNT);
                stacks.forEach(function (stack) {
                    expect(stack.getDepth()).toEqual(COUNT);
                });
            });


        });
    }
);