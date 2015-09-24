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

/**
 * CompositionCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    [
        "../../src/capabilities/CompositionCapability",
        "../../src/capabilities/ContextualDomainObject"
    ],
    function (CompositionCapability, ContextualDomainObject) {
        "use strict";

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("The composition capability", function () {
            var mockDomainObject,
                mockInjector,
                mockContextualize,
                mockObjectService,
                composition;

            // Composition Capability makes use of promise chaining,
            // so support that, but don't introduce complication of
            // native promises.
            function mockPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    DOMAIN_OBJECT_METHODS
                );

                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );

                mockInjector = {
                    get: function (name) {
                        return (name === "objectService") && mockObjectService;
                    }
                };
                mockContextualize = jasmine.createSpy('contextualize');

                // Provide a minimal (e.g. no error-checking) implementation
                // of contextualize for simplicity
                mockContextualize.andCallFake(function (domainObject, parentObject) {
                    return new ContextualDomainObject(domainObject, parentObject);
                });

                mockObjectService.getObjects.andReturn(mockPromise([]));

                composition = new CompositionCapability(
                    mockInjector,
                    mockContextualize,
                    mockDomainObject
                );
            });

            it("applies only to models with a composition field", function () {
                expect(CompositionCapability.appliesTo({ composition: [] }))
                    .toBeTruthy();
                expect(CompositionCapability.appliesTo({}))
                    .toBeFalsy();
            });

            it("requests ids found in model's composition from the object service", function () {
                var ids = [ "a", "b", "c", "xyz" ];

                mockDomainObject.getModel.andReturn({ composition: ids });

                composition.invoke();

                expect(mockObjectService.getObjects).toHaveBeenCalledWith(ids);
            });

            it("adds a context capability to returned domain objects", function () {
                var result,
                    mockChild = jasmine.createSpyObj("child", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn({ composition: ["x"] });
                mockObjectService.getObjects.andReturn(mockPromise({x: mockChild}));
                mockChild.getCapability.andReturn(undefined);

                composition.invoke().then(function (c) { result = c; });

                // Should have been added by a wrapper
                expect(result[0].getCapability('context')).toBeDefined();

            });

            it("allows domain objects to be added", function () {
                var result,
                    testModel = { composition: [] },
                    mockChild = jasmine.createSpyObj("child", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn(testModel);
                mockObjectService.getObjects.andReturn(mockPromise({a: mockChild}));
                mockChild.getCapability.andReturn(undefined);
                mockChild.getId.andReturn('a');

                mockDomainObject.useCapability.andCallFake(function (key, mutator) {
                    if (key === 'mutation') {
                        mutator(testModel);
                        return mockPromise(true);
                    }
                });

                composition.add(mockChild).then(function (domainObject) {
                    result = domainObject;
                });

                expect(testModel.composition).toEqual(['a']);

                // Should have returned the added object in its new context
                expect(result.getId()).toEqual('a');
                expect(result.getCapability('context')).toBeDefined();
                expect(result.getCapability('context').getParent())
                    .toEqual(mockDomainObject);
            });

            it("does not re-add IDs which are already present", function () {
                var result,
                    testModel = { composition: [ 'a' ] },
                    mockChild = jasmine.createSpyObj("child", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn(testModel);
                mockObjectService.getObjects.andReturn(mockPromise({a: mockChild}));
                mockChild.getCapability.andReturn(undefined);
                mockChild.getId.andReturn('a');

                mockDomainObject.useCapability.andCallFake(function (key, mutator) {
                    if (key === 'mutation') {
                        mutator(testModel);
                        return mockPromise(true);
                    }
                });

                composition.add(mockChild).then(function (domainObject) {
                    result = domainObject;
                });

                // Still just 'a'
                expect(testModel.composition).toEqual(['a']);

                // Should have returned the added object in its new context
                expect(result.getId()).toEqual('a');
                expect(result.getCapability('context')).toBeDefined();
                expect(result.getCapability('context').getParent())
                    .toEqual(mockDomainObject);
            });

            it("can add objects at a specified index", function () {
                var result,
                    testModel = { composition: [ 'a', 'b', 'c' ] },
                    mockChild = jasmine.createSpyObj("child", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn(testModel);
                mockObjectService.getObjects.andReturn(mockPromise({a: mockChild}));
                mockChild.getCapability.andReturn(undefined);
                mockChild.getId.andReturn('a');

                mockDomainObject.useCapability.andCallFake(function (key, mutator) {
                    if (key === 'mutation') {
                        mutator(testModel);
                        return mockPromise(true);
                    }
                });

                composition.add(mockChild, 1).then(function (domainObject) {
                    result = domainObject;
                });

                // Still just 'a'
                expect(testModel.composition).toEqual(['b', 'a', 'c']);

                // Should have returned the added object in its new context
                expect(result.getId()).toEqual('a');
                expect(result.getCapability('context')).toBeDefined();
                expect(result.getCapability('context').getParent())
                    .toEqual(mockDomainObject);
            });

        });
    }
);
