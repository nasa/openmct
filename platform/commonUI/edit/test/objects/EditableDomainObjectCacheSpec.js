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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/objects/EditableDomainObjectCache"],
    function (EditableDomainObjectCache) {
        'use strict';

        describe("Editable domain object cache", function () {

            var captured,
                completionCapability,
                object,
                mockQ,
                mockType,
                cache;


            // Constructors for test objects
            function TestObject(id) {
                return {
                    getId: function () { return id; },
                    getModel: function () { return {}; },
                    getCapability: function (key) {
                        return {
                            editor: completionCapability,
                            type: mockType
                        }[key];
                    },
                    hasCapability: function (key) {
                        return false;
                    }
                };
            }

            function WrapObject(domainObject, model) {
                var result = Object.create(domainObject);
                result.wrapped = true;
                result.wrappedModel = model;
                result.hasCapability = function (name) {
                    return name === 'editor';
                };
                captured.wraps = (captured.wraps || 0) + 1;
                return result;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockType = jasmine.createSpyObj('type', ['hasFeature']);
                mockType.hasFeature.andReturn(true);
                captured = {};
                completionCapability = {
                    save: function () {
                        captured.saved = (captured.saved || 0) + 1;
                    }
                };

                cache = new EditableDomainObjectCache(WrapObject, mockQ);
            });

            it("wraps objects using provided constructor", function () {
                var domainObject = new TestObject('test-id'),
                    wrappedObject = cache.getEditableObject(domainObject);
                expect(wrappedObject.wrapped).toBeTruthy();
                expect(wrappedObject.getId()).toEqual(domainObject.getId());
            });

            it("wraps objects repeatedly, wraps models once", function () {
                var domainObject = new TestObject('test-id'),
                    wrappedObjects = [];

                // Verify precondition
                expect(captured.wraps).toBeUndefined();

                // Invoke a few more times; expect count not to increment
                wrappedObjects.push(cache.getEditableObject(domainObject));
                expect(captured.wraps).toEqual(1);
                wrappedObjects.push(cache.getEditableObject(domainObject));
                expect(captured.wraps).toEqual(2);
                wrappedObjects.push(cache.getEditableObject(domainObject));
                expect(captured.wraps).toEqual(3);

                // Verify that the last call still gave us a wrapped object
                expect(wrappedObjects[0].wrapped).toBeTruthy();
                expect(wrappedObjects[0].getId()).toEqual(domainObject.getId());

                // Verify that objects are distinct but models are identical
                expect(wrappedObjects[0].wrappedModel)
                    .toBe(wrappedObjects[1].wrappedModel);
                expect(wrappedObjects[0]).not
                    .toBe(wrappedObjects[1]);
            });

            it("saves objects that have been marked dirty", function () {
                var objects = ['a', 'b', 'c'].map(TestObject).map(function (domainObject) {
                    return cache.getEditableObject(domainObject);
                });

                cache.markDirty(objects[0]);
                cache.markDirty(objects[2]);

                cache.saveAll();

                expect(captured.saved).toEqual(2);
            });

            it("does not save objects that have been marked clean", function () {
                var objects = ['a', 'b', 'c'].map(TestObject).map(function (domainObject) {
                    return cache.getEditableObject(domainObject);
                });

                cache.markDirty(objects[0]);
                cache.markDirty(objects[2]);
                cache.markClean(objects[0]);

                cache.saveAll();

                expect(captured.saved).toEqual(1);
            });

            it("tracks the root object of the Edit mode subgraph", function () {
                // Root object is the first object exposed to the cache
                var domainObjects = ['a', 'b', 'c'].map(TestObject);
                domainObjects.forEach(function (obj) {
                    cache.getEditableObject(obj);
                });
                expect(cache.isRoot(domainObjects[0])).toBeTruthy();
                expect(cache.isRoot(domainObjects[1])).toBeFalsy();
                expect(cache.isRoot(domainObjects[2])).toBeFalsy();
            });

            it("does not double-wrap objects", function () {
                var domainObject = new TestObject('test-id'),
                    wrappedObject = cache.getEditableObject(domainObject);

                // Same instance should be returned if you try to wrap
                // twice. This is necessary, since it's possible to (e.g.)
                // use a context capability on an object retrieved via
                // composition, in which case a result will already be
                // wrapped.
                expect(cache.getEditableObject(wrappedObject))
                    .toBe(wrappedObject);
            });

            it("does not wrap non-editable objects", function () {
                var domainObject = new TestObject('test-id');

                mockType.hasFeature.andCallFake(function (key) {
                    return key !== 'creation';
                });

                expect(cache.getEditableObject(domainObject))
                    .toBe(domainObject);
            });


        });
    }

);
