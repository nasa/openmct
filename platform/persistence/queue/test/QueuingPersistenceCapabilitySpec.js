/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/QueuingPersistenceCapability"],
    function (QueuingPersistenceCapability) {
        "use strict";

        describe("A queuing persistence capability", function () {
            var mockQueue,
                mockPersistence,
                mockDomainObject,
                persistence;

            beforeEach(function () {
                mockQueue = jasmine.createSpyObj('queue', ['put']);
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist', 'refresh']
                );
                mockDomainObject = {};
                persistence = new QueuingPersistenceCapability(
                    mockQueue,
                    mockPersistence,
                    mockDomainObject
                );
            });

            it("puts a request for persistence into the queue on persist", function () {
                // Verify precondition
                expect(mockQueue.put).not.toHaveBeenCalled();
                // Invoke persistence
                persistence.persist();
                // Should have queued
                expect(mockQueue.put).toHaveBeenCalledWith(
                    mockDomainObject,
                    mockPersistence
                );
            });

            it("exposes other methods from the wrapped persistence capability", function () {
                expect(persistence.refresh).toBe(mockPersistence.refresh);
            });
        });
    }
);