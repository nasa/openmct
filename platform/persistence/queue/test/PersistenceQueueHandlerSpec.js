/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceQueueHandler"],
    function (PersistenceQueueHandler) {
        "use strict";

        var TEST_ERROR = { someKey: "some value" };

        describe("The persistence queue handler", function () {
            var mockQ,
                mockFailureHandler,
                mockPersistences,
                mockDomainObjects,
                mockQueue,
                mockRejection,
                handler;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function makeMockPersistence(id) {
                var mockPersistence = jasmine.createSpyObj(
                    'persistence-' + id,
                    [ 'persist', 'refresh' ]
                );
                mockPersistence.persist.andReturn(asPromise(true));
                return mockPersistence;
            }

            function makeMockDomainObject(id) {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    [ 'getId' ]
                );
                mockDomainObject.getId.andReturn(id);
                return mockDomainObject;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['all']);
                mockFailureHandler = jasmine.createSpyObj('handler', ['handle']);
                mockQueue = jasmine.createSpyObj('queue', ['put']);
                mockPersistences = {};
                mockDomainObjects = {};
                ['a', 'b', 'c'].forEach(function (id) {
                    mockPersistences[id] = makeMockPersistence(id);
                    mockDomainObjects[id] = makeMockDomainObject(id);
                });
                mockRejection = jasmine.createSpyObj('rejection', ['then']);
                mockQ.all.andReturn(asPromise([]));
                mockRejection.then.andCallFake(function (callback, fallback) {
                    return asPromise(fallback({ someKey: "some value" }));
                });
                handler = new PersistenceQueueHandler(mockQ, mockFailureHandler);
            });

            it("invokes persistence on all members in the group", function () {
                handler.persist(mockPersistences, mockDomainObjects, mockQueue);
                expect(mockPersistences.a.persist).toHaveBeenCalled();
                expect(mockPersistences.b.persist).toHaveBeenCalled();
                expect(mockPersistences.c.persist).toHaveBeenCalled();
                // No failures in this group
                expect(mockFailureHandler.handle).not.toHaveBeenCalled();
            });

            it("handles failures that occur", function () {
                mockPersistences.b.persist.andReturn(mockRejection);
                mockPersistences.c.persist.andReturn(mockRejection);
                handler.persist(mockPersistences, mockDomainObjects, mockQueue);
                expect(mockFailureHandler.handle).toHaveBeenCalledWith([
                    {
                        id: 'b',
                        persistence: mockPersistences.b,
                        domainObject: mockDomainObjects.b,
                        requeue: jasmine.any(Function),
                        error: TEST_ERROR
                    },
                    {
                        id: 'c',
                        persistence: mockPersistences.c,
                        domainObject: mockDomainObjects.c,
                        requeue: jasmine.any(Function),
                        error: TEST_ERROR
                    }
                ]);
            });

            it("provides a requeue method for failures", function () {
                // This method is needed by PersistenceFailureHandler
                // to allow requeuing of objects for persistence when
                // Overwrite is chosen.
                mockPersistences.b.persist.andReturn(mockRejection);
                handler.persist(mockPersistences, mockDomainObjects, mockQueue);

                // Verify precondition
                expect(mockQueue.put).not.toHaveBeenCalled();

                // Invoke requeue
                mockFailureHandler.handle.mostRecentCall.args[0][0].requeue();

                // Should have returned the object to the queue
                expect(mockQueue.put).toHaveBeenCalledWith(
                    mockDomainObjects.b,
                    mockPersistences.b
                );
            });
        });
    }
);