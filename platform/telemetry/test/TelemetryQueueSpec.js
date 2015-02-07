/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetryQueue"],
    function (TelemetryQueue) {
        "use strict";

        describe("The telemetry queue", function () {
            var queue;

            beforeEach(function () {
                // put, isEmpty, dequeue
                queue = new TelemetryQueue();
            });

            it("stores elements by key", function () {
                queue.put("a", { someKey: "some value" });
                expect(queue.poll())
                    .toEqual({ a: { someKey: "some value" }});
            });

            it("merges non-overlapping keys", function () {
                queue.put("a", { someKey: "some value" });
                queue.put("b", 42);
                expect(queue.poll())
                    .toEqual({ a: { someKey: "some value" }, b: 42 });
            });

            it("adds new objects for repeated keys", function () {
                queue.put("a", { someKey: "some value" });
                queue.put("a", { someKey: "some other value" });
                queue.put("b", 42);
                expect(queue.poll())
                    .toEqual({ a: { someKey: "some value" }, b: 42 });
                expect(queue.poll())
                    .toEqual({ a: { someKey: "some other value" }  });
            });

            it("reports emptiness", function () {
                expect(queue.isEmpty()).toBeTruthy();
                queue.put("a", { someKey: "some value" });
                queue.put("a", { someKey: "some other value" });
                queue.put("b", 42);
                expect(queue.isEmpty()).toBeFalsy();
                queue.poll();
                expect(queue.isEmpty()).toBeFalsy();
                queue.poll();
                expect(queue.isEmpty()).toBeTruthy();
            });


        });

    }
);