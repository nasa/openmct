/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    [
        "../../src/actions/ExportAsJSONAction",
        "../../../entanglement/test/DomainObjectFactory"
    ],
    function (ExportAsJSONAction, domainObjectFactory) {

        describe("The export JSON action", function () {

            var context,
                action,
                exportService,
                identifierService,
                policyService,
                mockType,
                exportedTree;

            beforeEach(function () {
                exportService = jasmine.createSpyObj('exportService',
                ['exportJSON']);
                identifierService = jasmine.createSpyObj('identifierService',
                            ['generate']);
                policyService = jasmine.createSpyObj('policyService',
                    ['allow']);
                mockType =
                    jasmine.createSpyObj('type', ['hasFeature']);

                mockType.hasFeature.andCallFake(function (feature) {
                    return feature === 'creation';
                });
                context = {};
                context.domainObject = domainObjectFactory(
                    {
                        name: 'test',
                        id: 'someID',
                        capabilities: {type: mockType}
                    });
                identifierService.generate.andReturn('brandNewId');
                exportService.exportJSON.andCallFake(function (tree, options) {
                    exportedTree = tree;
                });
                policyService.allow.andCallFake(function (capability, type) {
                    return type.hasFeature(capability);
                });

                action = new ExportAsJSONAction(exportService, policyService,
                        identifierService, context);
            });

            it("initializes happily", function () {
                expect(action).toBeDefined();
            });

            it("doesn't export non-creatable objects in tree", function () {
                var nonCreatableType = {
                    hasFeature :
                        function (feature) {
                            return feature !== 'creation';
                        }
                };

                var parentComposition =
                    jasmine.createSpyObj('parentComposition', ['invoke']);

                var parent = domainObjectFactory({
                    name: 'parent',
                    model: { name: 'parent', location: 'ROOT'},
                    id: 'parentId',
                    capabilities: {
                        composition: parentComposition,
                        type: mockType
                    }
                });

                var child = domainObjectFactory({
                    name: 'child',
                    model: { name: 'child', location: 'parentId' },
                    id: 'childId',
                    capabilities: {
                        type: nonCreatableType
                    }
                });

                parentComposition.invoke.andReturn(
                    Promise.resolve([child])
                );
                context.domainObject = parent;

                var init = false;
                runs(function () {
                    action.perform();
                    setTimeout(function () {
                        init = true;
                    }, 100);
                });

                waitsFor(function () {
                    return init;
                }, "Exported tree sohuld have been built");

                runs(function () {
                    expect(Object.keys(action.tree).length).toBe(1);
                    expect(action.tree.hasOwnProperty("parentId"))
                        .toBeTruthy();
                });
            });

            it("can export self-containing objects", function () {
                var infiniteParentComposition =
                    jasmine.createSpyObj('infiniteParentComposition',
                        ['invoke']
                    );

                var infiniteChildComposition =
                    jasmine.createSpyObj('infiniteChildComposition',
                        ['invoke']
                    );

                var parent = domainObjectFactory({
                    name: 'parent',
                    model: { name: 'parent', location: 'ROOT'},
                    id: 'infiniteParentId',
                    capabilities: {
                        composition: infiniteParentComposition,
                        type: mockType
                    }
                });

                var child = domainObjectFactory({
                    name: 'child',
                    model: { name: 'child', location: 'infiniteParentId' },
                    id: 'infiniteChildId',
                    capabilities: {
                        composition: infiniteChildComposition,
                        type: mockType
                    }
                });

                infiniteParentComposition.invoke.andReturn(
                    Promise.resolve([child])
                );
                infiniteChildComposition.invoke.andReturn(
                    Promise.resolve([parent])
                );
                context.domainObject = parent;

                var init = false;
                runs(function () {
                    action.perform();
                    setTimeout(function () {
                        init = true;
                    }, 100);
                });

                waitsFor(function () {
                    return init;
                }, "Exported tree sohuld have been built");

                runs(function () {
                    expect(Object.keys(action.tree).length).toBe(2);
                    expect(action.tree.hasOwnProperty("infiniteParentId"))
                        .toBeTruthy();
                    expect(action.tree.hasOwnProperty("infiniteChildId"))
                        .toBeTruthy();
                });
            });

            it("exports links to external objects as new objects", function () {
                var externallyLinkedComposition =
                    jasmine.createSpyObj('externallyLinkedComposition',
                        ['invoke']
                    );

                var parent = domainObjectFactory({
                    name: 'parent',
                    model: {
                        name: 'parent',
                        composition: ['externalId'],
                        location: 'ROOT'},
                    id: 'parentId',
                    capabilities: {
                        composition: externallyLinkedComposition,
                        type: mockType
                    }
                });

                var externalObject = domainObjectFactory({
                    name: 'external',
                    model: { name: 'external', location: 'outsideOfTree'},
                    id: 'externalId',
                    capabilities: {
                        type: mockType
                    }
                });

                externallyLinkedComposition.invoke.andReturn(
                    Promise.resolve([externalObject])
                );
                context.domainObject = parent;

                var init = false;
                runs(function () {
                    action.perform();
                    setTimeout(function () {
                        init = true;
                    }, 100);
                });

                waitsFor(function () {
                    return init;
                }, "Exported tree sohuld have been built");

                runs(function () {
                    expect(Object.keys(action.tree).length).toBe(2);
                    expect(action.tree.hasOwnProperty('parentId'))
                        .toBeTruthy();
                    expect(action.tree.hasOwnProperty('brandNewId'))
                        .toBeTruthy();
                    expect(action.tree.brandNewId.location).toBe('parentId');
                });
            });

            it("exports object tree in the correct format", function () {
                var init = false;
                runs(function () {
                    action.perform();
                    setTimeout(function () {
                        init = true;
                    }, 100);
                });

                waitsFor(function () {
                    return init;
                }, "Exported tree sohuld have been built");

                runs(function () {
                    expect(Object.keys(exportedTree).length).toBe(2);
                    expect(exportedTree.hasOwnProperty('openmct')).toBeTruthy();
                    expect(exportedTree.hasOwnProperty('rootId')).toBeTruthy();
                });
            });
        });
    }
);
