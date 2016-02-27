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
    ['../../../src/controllers/swimlane/TimelineSwimlanePopulator'],
    function (TimelineSwimlanePopulator) {
        'use strict';

        describe("A Timeline swimlane populator", function () {
            var mockLoader,
                mockSelection,
                testConfiguration,
                mockDomainObject,
                mockDomainObjects,
                mockCallback,
                populator;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function makeMockDomainObject(id, composition) {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    ['getId', 'getModel', 'getCapability', 'useCapability']
                );

                mockDomainObject.getId.andReturn(id);
                mockDomainObject.getModel.andReturn({ composition: composition });
                mockDomainObject.useCapability.andReturn(asPromise(false));

                return mockDomainObject;
            }

            function subgraph(domainObject, objects) {
                function lookupSubgraph(id) {
                    return subgraph(objects[id], objects);
                }
                return {
                    domainObject: domainObject,
                    composition: domainObject.getModel().composition
                        .map(lookupSubgraph)
                };
            }

            beforeEach(function () {
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
                mockSelection = jasmine.createSpyObj(
                    'selection',
                    ['get', 'select', 'proxy']
                );
                mockCallback = jasmine.createSpy('callback');

                testConfiguration = {};

                mockLoader.load.andReturn(asPromise(subgraph(
                    mockDomainObject,
                    mockDomainObjects
                )));

                populator = new TimelineSwimlanePopulator(
                    mockLoader,
                    testConfiguration,
                    mockSelection
                );
            });

            it("uses the loader to find subgraph", function () {
                populator.populate(mockDomainObject);
                expect(mockLoader.load).toHaveBeenCalledWith(
                    mockDomainObject,
                    'timespan'
                );
            });

            it("provides a list of swimlanes", function () {
                populator.populate(mockDomainObject);
                // Ensure swimlane order matches depth-first search
                expect(populator.get().map(function (swimlane) {
                    return swimlane.domainObject;
                })).toEqual([
                    mockDomainObjects.a,
                    mockDomainObjects.b,
                    mockDomainObjects.d,
                    mockDomainObjects.c,
                    mockDomainObjects.e,
                    mockDomainObjects.f
                ]);
            });

            it("clears swimlanes if no object is provided", function () {
                populator.populate();
                expect(populator.get()).toEqual([]);
            });

            it("preserves selection state when possible", function () {
                // Repopulate swimlanes
                populator.populate(mockDomainObject);

                // Act as if something is already selected
                mockSelection.get.andReturn(populator.get()[1]);

                // Verify precondition
                expect(mockSelection.select).not.toHaveBeenCalled();

                // Repopulate swimlanes
                populator.populate(mockDomainObject);

                // Selection should have been preserved
                expect(mockSelection.select).toHaveBeenCalled();
                expect(mockSelection.select.mostRecentCall.args[0].domainObject)
                    .toEqual(mockDomainObjects.b);
            });

            it("exposes a selection proxy for the timeline", function () {
                populator.populate(mockDomainObject);
                expect(mockSelection.proxy).toHaveBeenCalled();
            });

            it("allows selection object to be changed", function () {
                var mockNewSelectionObject = jasmine.createSpyObj(
                    'new-selection',
                    ['get', 'select', 'proxy']
                );
                populator.selection(mockNewSelectionObject);
                expect(mockNewSelectionObject.proxy)
                    .toHaveBeenCalled();
            });

        });
    }
);