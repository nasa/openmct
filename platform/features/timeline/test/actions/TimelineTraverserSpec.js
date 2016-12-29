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

define([
    "../../src/actions/TimelineTraverser"
], (TimelineTraverser) => {

    describe("TimelineTraverser", () => {
        let testModels,
            mockDomainObjects,
            traverser;

        const addMockDomainObject = (id) => {
            let mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    [
                        'getId',
                        'getCapability',
                        'useCapability',
                        'hasCapability',
                        'getModel'
                    ]
                ),
                mockRelationships,
                model = testModels[id];

            mockDomainObject.getId.andReturn(id);
            mockDomainObject.getModel.andReturn(model);

            mockDomainObject.hasCapability.andCallFake( (c) => {
                return c === 'composition' ? !!model.composition :
                    c === 'relationship' ? !!model.relationships :
                        false;
            });

            if (!!model.composition) {
                mockDomainObject.useCapability.andCallFake( (c) => {
                    return c === 'composition' &&
                        Promise.resolve(model.composition.map( (cid) => {
                            return mockDomainObjects[cid];
                        }));
                });
            }

            if (!!model.relationships) {
                mockRelationships = jasmine.createSpyObj(
                    'relationship',
                    ['getRelatedObjects']
                );
                mockRelationships.getRelatedObjects.andCallFake( (k) => {
                    let ids = model.relationships[k] || [];
                    return Promise.resolve(ids.map( (objId) => {
                        return mockDomainObjects[objId];
                    }));
                });
                mockDomainObject.getCapability.andCallFake( (c) => {
                    return c === 'relationship' && mockRelationships;
                });
            }

            mockDomainObjects[id] = mockDomainObject;
        }

        beforeEach(() => {
            testModels = {
                a: { composition: ['b', 'c']},
                b: { composition: ['c'] },
                c: { relationships: { modes: ['d'] } },
                d: {},
                unreachable: {}
            };

            mockDomainObjects = {};
            Object.keys(testModels).forEach(addMockDomainObject);

            traverser = new TimelineTraverser(mockDomainObjects.a);
        });

        describe("buildObjectList", () => {
            let objects;

            const contains = (id) => {
                return objects.some( (object) => {
                    return object.getId() === id;
                });
            }

            beforeEach(() => {
                traverser.buildObjectList().then( (objectList) => {
                    objects = objectList;
                });
                waitsFor(() => {
                    return objects !== undefined;
                });
            });

            it("includes the object originally passed in", () => {
                expect(contains('a')).toBe(true);
            });

            it("includes objects reachable via composition", () => {
                expect(contains('b')).toBe(true);
                expect(contains('c')).toBe(true);
            });

            it("includes objects reachable via relationships", () => {
                expect(contains('d')).toBe(true);
            });

            it("does not include unreachable objects", () => {
                expect(contains('unreachable')).toBe(false);
            });
        });

    });
});
