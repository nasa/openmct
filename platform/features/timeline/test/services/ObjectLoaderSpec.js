/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ['../../src/services/ObjectLoader'],
    (ObjectLoader) => {

        describe("The domain object loader", () => {
            let mockQ,
                mockCallback,
                mockDomainObjects,
                testCompositions,
                objectLoader;

            const asPromise = (value) => {
                return (value || {}).then ? value : {
                    then: (callback) => {
                        return asPromise(callback(value));
                    }
                };
            }

            const lookupObject = (id) => {
                return mockDomainObjects[id];
            }

            const fullSubgraph = (id) => {
                return {
                    domainObject: mockDomainObjects[id],
                    composition: (testCompositions[id] || [])
                        .map(fullSubgraph)
                };
            }

            const addDomainObject = (id, children, capabilities) => {
                let mockDomainObject = jasmine.createSpyObj(
                    'object-' + id,
                    ['useCapability', 'hasCapability', 'getId']
                );

                mockDomainObject.getId.andReturn(id);
                mockDomainObject.useCapability.andCallFake( (c) => {
                    return c === 'composition' ?
                            asPromise(children.map(lookupObject)) :
                            undefined;
                });
                mockDomainObject.hasCapability.andCallFake( (c) => {
                    return (capabilities.indexOf(c) !== -1) || (c === 'composition');
                });
                mockDomainObjects[id] = mockDomainObject;

                testCompositions[id] = children;
            }

            beforeEach(() => {
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockCallback = jasmine.createSpy('callback');
                mockDomainObjects = {};
                testCompositions = {};

                // Provide subset of q's actual behavior which we
                // expect object loader to really need
                mockQ.when.andCallFake(asPromise);
                mockQ.all.andCallFake( (values) => {
                    let result = [];
                    const addResult = (v) => {
                        result.push(v);
                    }
                    const promiseResult = (v) => {
                        asPromise(v).then(addResult);
                    }
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



            it("loads sub-graphs of composition hierarchy", () => {
                objectLoader.load(mockDomainObjects.a).then(mockCallback);
                // Should have loaded full graph
                expect(mockCallback).toHaveBeenCalledWith(fullSubgraph('a'));
            });

            it("filters based on capabilities, if requested", () => {
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

            it("filters with a function, if requested", () => {
                const shortName = (domainObject) => {
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
