/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/drag/TimelineDragHandler'],
    function (TimelineDragHandler) {
        'use strict';

        describe("A Timeline drag handler", function () {
            var mockLoader,
                mockSelection,
                testConfiguration,
                mockDomainObject,
                mockDomainObjects,
                mockTimespans,
                mockMutations,
                mockPersists,
                mockCallback,
                handler;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function subgraph(domainObject, objects) {
                function lookupSubgraph(id) {
                    return subgraph(objects[id], objects);
                }
                return {
                    domainObject: domainObject,
                    composition: (domainObject.getModel().composition || [])
                        .map(lookupSubgraph)
                };
            }

            function makeMockDomainObject(id, composition) {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    ['getId', 'getModel', 'getCapability', 'useCapability']
                );

                mockDomainObject.getId.andReturn(id);
                mockDomainObject.getModel.andReturn({ composition: composition });
                mockDomainObject.useCapability.andReturn(asPromise(mockTimespans[id]));
                mockDomainObject.getCapability.andCallFake(function (c) {
                    return {
                        persistence: mockPersists[id],
                        mutation: mockMutations[id]
                    }[c];
                });

                return mockDomainObject;
            }

            beforeEach(function () {
                mockTimespans = {};
                mockPersists = {};
                mockMutations = {};
                ['a', 'b', 'c', 'd', 'e', 'f'].forEach(function (id, index) {
                    mockTimespans[id] = jasmine.createSpyObj(
                        'timespan-' + id,
                        [ 'getStart', 'getEnd', 'getDuration', 'setStart', 'setEnd', 'setDuration' ]
                    );
                    mockPersists[id] = jasmine.createSpyObj(
                        'persistence-' + id,
                        [ 'persist' ]
                    );
                    mockMutations[id] = jasmine.createSpyObj(
                        'mutation-' + id,
                        [ 'mutate' ]
                    );
                    mockTimespans[id].getStart.andReturn(index * 1000);
                    mockTimespans[id].getDuration.andReturn(4000 + index);
                    mockTimespans[id].getEnd.andReturn(4000 + index + index * 1000);
                });

                mockLoader = jasmine.createSpyObj('objectLoader', ['load']);
                mockDomainObject = makeMockDomainObject('a', ['b', 'c']);
                mockDomainObjects = {
                    a: mockDomainObject,
                    b: makeMockDomainObject('b', ['d']),
                    c: makeMockDomainObject('c', ['e', 'f']),
                    d: makeMockDomainObject('d', []),
                    e: makeMockDomainObject('e', []),
                    f: makeMockDomainObject('f', [])
                };
                mockSelection = jasmine.createSpyObj('selection', ['get', 'select']);
                mockCallback = jasmine.createSpy('callback');

                testConfiguration = {};

                mockLoader.load.andReturn(asPromise(
                    subgraph(mockDomainObject, mockDomainObjects)
                ));

                handler = new TimelineDragHandler(
                    mockDomainObject,
                    mockLoader
                );
            });

            it("uses the loader to find subgraph", function () {
                expect(mockLoader.load).toHaveBeenCalledWith(
                    mockDomainObject,
                    'timespan'
                );
            });

            it("reports available object identifiers", function () {
                expect(handler.ids())
                    .toEqual(Object.keys(mockDomainObjects).sort());
            });

            it("exposes start/end/duration from timespan capabilities", function () {
                expect(handler.start('a')).toEqual(0);
                expect(handler.start('b')).toEqual(1000);
                expect(handler.start('c')).toEqual(2000);
                expect(handler.duration('a')).toEqual(4000);
                expect(handler.duration('b')).toEqual(4001);
                expect(handler.duration('c')).toEqual(4002);
                expect(handler.end('a')).toEqual(4000);
                expect(handler.end('b')).toEqual(5001);
                expect(handler.end('c')).toEqual(6002);
            });

            it("accepts objects instead of identifiers for start/end/duration calls", function () {
                Object.keys(mockDomainObjects).forEach(function (id) {
                    expect(handler.start(mockDomainObjects[id])).toEqual(handler.start(id));
                    expect(handler.duration(mockDomainObjects[id])).toEqual(handler.duration(id));
                    expect(handler.end(mockDomainObjects[id])).toEqual(handler.end(id));
                });
            });

            it("mutates objects", function () {
                handler.start('a', 123);
                expect(mockTimespans.a.setStart).toHaveBeenCalledWith(123);
                handler.duration('b', 42);
                expect(mockTimespans.b.setDuration).toHaveBeenCalledWith(42);
                handler.end('c', 12321);
                expect(mockTimespans.c.setEnd).toHaveBeenCalledWith(12321);
            });

            it("disallows negative starts, durations", function () {
                handler.start('a', -100);
                handler.duration('b', -1000);
                expect(mockTimespans.a.setStart).toHaveBeenCalledWith(0);
                expect(mockTimespans.b.setDuration).toHaveBeenCalledWith(0);
            });

            it("disallows starts greater than ends violations", function () {
                handler.start('a', 5000);
                handler.end('b', 500);
                expect(mockTimespans.a.setStart).toHaveBeenCalledWith(4000); // end time
                expect(mockTimespans.b.setEnd).toHaveBeenCalledWith(1000); // start time
            });

            it("moves objects in groups", function () {
                handler.move('b', 42);
                expect(mockTimespans.b.setStart).toHaveBeenCalledWith(1042);
                expect(mockTimespans.b.setEnd).toHaveBeenCalledWith(5043);
                expect(mockTimespans.d.setStart).toHaveBeenCalledWith(3042);
                expect(mockTimespans.d.setEnd).toHaveBeenCalledWith(7045);
                // Verify no other interactions
                ['a', 'c', 'e', 'f'].forEach(function (id) {
                    expect(mockTimespans[id].setStart).not.toHaveBeenCalled();
                    expect(mockTimespans[id].setEnd).not.toHaveBeenCalled();
                });
            });

            it("moves whole subtrees", function () {
                handler.move('a', 12321);
                // We verify the math in the previous test, so just verify
                // that the whole tree is effected here.
                Object.keys(mockTimespans).forEach(function (id) {
                    expect(mockTimespans[id].setStart).toHaveBeenCalled();
                });
            });

            it("prevents bulk moves past 0", function () {
                // Have a start later; new lowest start is b, at 1000
                mockTimespans.a.getStart.andReturn(10000);
                handler.move('a', -10000);
                // Verify that move was stopped at 0, for b, even though
                // move was initiated at a
                expect(mockTimespans.a.setStart).toHaveBeenCalledWith(9000);
                expect(mockTimespans.b.setStart).toHaveBeenCalledWith(0);
                expect(mockTimespans.c.setStart).toHaveBeenCalledWith(1000);
            });

            it("persists mutated objects", function () {
                handler.start('a', 20);
                handler.end('b', 50);
                handler.duration('c', 30);
                handler.persist();
                expect(mockPersists.a.persist).toHaveBeenCalled();
                expect(mockPersists.b.persist).toHaveBeenCalled();
                expect(mockPersists.c.persist).toHaveBeenCalled();
                expect(mockPersists.d.persist).not.toHaveBeenCalled();
                expect(mockPersists.e.persist).not.toHaveBeenCalled();
                expect(mockPersists.f.persist).not.toHaveBeenCalled();
            });


        });
    }
);