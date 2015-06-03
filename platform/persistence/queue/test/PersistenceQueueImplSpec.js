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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceQueueImpl"],
    function (PersistenceQueueImpl) {
        "use strict";

        var TEST_DELAY = 42;

        describe("The implemented persistence queue", function () {
            var mockQ,
                mockTimeout,
                mockHandler,
                mockDeferred,
                mockPromise,
                queue;

            function makeMockDomainObject(id) {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    [ 'getId' ]
                );
                mockDomainObject.getId.andReturn(id);
                return mockDomainObject;
            }

            function makeMockPersistence(id) {
                var mockPersistence = jasmine.createSpyObj(
                    'persistence-' + id,
                    [ 'persist' ]
                );
                return mockPersistence;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when', 'defer']);
                mockTimeout = jasmine.createSpy('$timeout');
                mockHandler = jasmine.createSpyObj('handler', ['persist']);
                mockDeferred = jasmine.createSpyObj('deferred', ['resolve']);
                mockDeferred.promise = jasmine.createSpyObj('promise', ['then']);
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockQ.defer.andReturn(mockDeferred);
                mockTimeout.andReturn({});
                mockHandler.persist.andReturn(mockPromise);
                mockPromise.then.andReturn(mockPromise);
                queue = new PersistenceQueueImpl(
                    mockQ,
                    mockTimeout,
                    mockHandler,
                    TEST_DELAY
                );
            });

            it("schedules a timeout to persist objects", function () {
                expect(mockTimeout).not.toHaveBeenCalled();
                queue.put(makeMockDomainObject('a'), makeMockPersistence('a'));
                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    TEST_DELAY,
                    false
                );
            });

            it("does not schedule multiple timeouts for multiple objects", function () {
                // Put three objects in without triggering the timeout;
                // shouldn't schedule multiple timeouts
                queue.put(makeMockDomainObject('a'), makeMockPersistence('a'));
                queue.put(makeMockDomainObject('b'), makeMockPersistence('b'));
                queue.put(makeMockDomainObject('c'), makeMockPersistence('c'));
                expect(mockTimeout.calls.length).toEqual(1);
            });

            it("returns a promise", function () {
                expect(queue.put(makeMockDomainObject('a'), makeMockPersistence('a')))
                    .toEqual(mockDeferred.promise);
            });

            it("waits for quiescence to proceed", function () {
                // Keep adding objects to the queue between timeouts.
                // Should keep scheduling timeouts instead of resolving.
                queue.put(makeMockDomainObject('a'), makeMockPersistence('a'));
                expect(mockTimeout.calls.length).toEqual(1);
                mockTimeout.mostRecentCall.args[0]();
                queue.put(makeMockDomainObject('b'), makeMockPersistence('b'));
                expect(mockTimeout.calls.length).toEqual(2);
                mockTimeout.mostRecentCall.args[0]();
                queue.put(makeMockDomainObject('c'), makeMockPersistence('c'));
                expect(mockTimeout.calls.length).toEqual(3);
                mockTimeout.mostRecentCall.args[0]();
                expect(mockHandler.persist).not.toHaveBeenCalled();
            });

            it("persists upon quiescence", function () {
                // Add objects to the queue, but fire two timeouts afterward
                queue.put(makeMockDomainObject('a'), makeMockPersistence('a'));
                queue.put(makeMockDomainObject('b'), makeMockPersistence('b'));
                queue.put(makeMockDomainObject('c'), makeMockPersistence('c'));
                mockTimeout.mostRecentCall.args[0]();
                mockTimeout.mostRecentCall.args[0]();
                expect(mockHandler.persist).toHaveBeenCalled();
            });

            it("waits on an active flush, while flushing", function () {
                // Persist some objects
                queue.put(makeMockDomainObject('a'), makeMockPersistence('a'));
                queue.put(makeMockDomainObject('b'), makeMockPersistence('b'));
                mockTimeout.mostRecentCall.args[0]();
                mockTimeout.mostRecentCall.args[0]();
                expect(mockTimeout.calls.length).toEqual(2);
                // Adding a new object should not trigger a new timeout,
                // because we haven't completed the previous flush
                queue.put(makeMockDomainObject('c'), makeMockPersistence('c'));
                expect(mockTimeout.calls.length).toEqual(2);
            });

            it("clears the active flush after it has completed", function () {
                // Persist some objects
                queue.put(makeMockDomainObject('a'), makeMockPersistence('a'));
                queue.put(makeMockDomainObject('b'), makeMockPersistence('b'));
                mockTimeout.mostRecentCall.args[0]();
                mockTimeout.mostRecentCall.args[0]();
                expect(mockTimeout.calls.length).toEqual(2);
                // Resolve the promise from handler.persist
                mockPromise.then.calls[0].args[0](true);
                // Adding a new object should now trigger a new timeout,
                // because we have completed the previous flush
                queue.put(makeMockDomainObject('c'), makeMockPersistence('c'));
                expect(mockTimeout.calls.length).toEqual(3);
            });
        });
    }
);