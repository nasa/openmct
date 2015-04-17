/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceQueue"],
    function (PersistenceQueue) {
        "use strict";

        describe("The persistence queue", function () {
            var mockQ,
                mockTimeout,
                mockDialogService,
                queue;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ['defer']);
                mockTimeout = jasmine.createSpy("$timeout");
                mockDialogService = jasmine.createSpyObj(
                    'dialogService',
                    ['getUserChoice']
                );
                queue = new PersistenceQueue(mockQ, mockTimeout, mockDialogService);
            });

            // PersistenceQueue is just responsible for handling injected
            // dependencies and wiring the PersistenceQueueImpl and its
            // handlers. Functionality is tested there, so our test here is
            // minimal (get back expected interface, no exceptions)
            it("provides a queue with a put method", function () {
                expect(queue.put).toEqual(jasmine.any(Function));
            });

        });
    }
);