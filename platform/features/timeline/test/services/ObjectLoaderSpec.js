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
    ['../../src/services/ObjectLoader'],
    function (ObjectLoader) {
        "use strict";

        describe("The domain object loader", function () {
            var mockQ,
                mockCallback,
                mockDomainObjects,
                testCompositions,
                objectLoader;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function lookupObject(id) {
                return mockDomainObjects[id];
            }

            function fullSubgraph(id) {
                return {
                    domainObject: mockDomainObjects[id],
                    composition: (testCompositions[id] || [])
                        .map(fullSubgraph)
                };
            }

            function addDomainObject(id, children, capabilities) {
                var mockDomainObject = jasmine.createSpyObj(
                    'object-' + id,
                    [ 'useCapability', 'hasCapability', 'getId' ]
                );

                mockDomainObject.getId.andReturn(id);
                mockDomainObject.useCapability.andCallFake(function (c) {
                    return c === 'composition' ?
                            asPromise(children.map(lookupObject)) :
                            undefined;
                });
                mockDomainObject.hasCapability.andCallFake(function (c) {
                    return (capabilities.indexOf(c) !== -1) || (c === 'composition');
                });
                mockDomainObjects[id] = mockDomainObject;

                testCompositions[id] = children;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', [ 'when', 'all' ]);
                mockCallback = jasmine.createSpy('callback');
                mockDomainObjects = {};
                testCompositions = {};

                // Provide subset of q's actual behavior which we
                // expect object loader to really need
                mockQ.when.andCallFake(asPromise);
                mockQ.all.andCallFake(function (values) {
                    var result = [];
                    function addResult(v) { result.push(v); }
                    function promiseResult(v) { asPromise(v).then(addResult); }
                    values.forEach(promiseResult);
                    return asPromise(result);
                });

                // Populate some mock domain objects
                addDomainObject('a', ['b', 'c', 'd'], ['test']);
                addDomainObject('b', ['c', 'd', 'ba'], []);
                addDomainObject('c', ['ca'], ['test']);
                addDomainObject('d', [], ['test']);
                addDomainObject('ba', [], ['test']);
                addDomainObject('ca', [], ['test']);

                objectLoader = new ObjectLoader(mockQ);
            });



            it("loads sub-graphs of composition hierarchy", function () {
                objectLoader.load(mockDomainObjects.a).then(mockCallback);
                // Should have loaded full graph
                expect(mockCallback).toHaveBeenCalledWith(fullSubgraph('a'));
            });

            it("filters based on capabilities, if requested", function () {
                objectLoader.load(mockDomainObjects.a, 'test')
                    .then(mockCallback);
                // Should have pruned 'b'
                expect(mockCallback).toHaveBeenCalledWith({
                    domainObject: mockDomainObjects.a,
                    composition: [
                        fullSubgraph('c'),
                        fullSubgraph('d')
                    ]
                });
            });

            it("filters with a function, if requested", function () {
                function shortName(domainObject) {
                    return domainObject.getId().length === 1;
                }
                objectLoader.load(mockDomainObjects.a, shortName)
                    .then(mockCallback);
                // Should have pruned 'ba' and 'ca'
                expect(mockCallback).toHaveBeenCalledWith({
                    domainObject: mockDomainObjects.a,
                    composition: [
                        {
                            domainObject: mockDomainObjects.b,
                            composition: [
                                {
                                    domainObject: mockDomainObjects.c,
                                    composition: []
                                },
                                fullSubgraph('d')
                            ]
                        },
                        {
                            domainObject: mockDomainObjects.c,
                            composition: []
                        },
                        fullSubgraph('d')
                    ]
                });
            });

        });

    }
);