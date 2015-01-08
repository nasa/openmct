/*global define,Promise,describe,it,expect,beforeEach,jasmine,waitsFor*/

define(
    ["../../src/register/ExtensionSorter"],
    function (ExtensionSorter) {
        "use strict";

        describe("The extension sorter", function () {
            var mockLog,
                sorter;

            beforeEach(function () {
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "debug", "info"]
                );

                sorter = new ExtensionSorter(mockLog);
            });

            it("sorts extensions in priority order", function () {
                var a = { priority: 10 },
                    b = {},
                    c = { priority: 'mandatory' }; // Should be +Inf
                expect(sorter.sort([a, b, c])).toEqual([c, a, b]);
            });

            it("warns about unrecognized priorities", function () {
                var a = { priority: 10 },
                    b = {},
                    c = { priority: 'mandatory' }, // Should be +Inf
                    d = { priority: 'GARBAGE-TEXT' },
                    e = { priority: { mal: "formed"} },
                    f = { priority: 3 };

                // Sorting should use default order (note we assume
                // a stable sort here as well)
                expect(sorter.sort(
                    [a, b, c, d, e, f]
                )).toEqual(
                    [c, a, f, b, d, e]
                );

                // Should have been warned exactly twice (for d & e)
                expect(mockLog.warn.calls.length).toEqual(2);
            });

        });
    }
);
