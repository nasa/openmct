/*global define,describe,it,expect,beforeEach*/

define(
    ["../../src/objects/EditableDomainObjectCache"],
    function (EditableDomainObjectCache) {
        'use strict';

        describe("Editable domain object cache", function () {

            var captured,
                completionCapability,
                object,
                cache;


            // Constructors for test objects
            function TestObject(id) {
                return {
                    getId: function () { return id; },
                    getModel: function () { return {}; },
                    getCapability: function (name) {
                        return completionCapability;
                    }
                };
            }

            function WrapObject(domainObject, model) {
                var result = Object.create(domainObject);
                result.wrapped = true;
                result.wrappedModel = model;
                captured.wraps = (captured.wraps || 0) + 1;
                return result;
            }

            beforeEach(function () {
                captured = {};
                completionCapability = {
                    save: function () {
                        captured.saved = (captured.saved || 0) + 1;
                    }
                };

                cache = new EditableDomainObjectCache(WrapObject);
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
                var objects = ['a', 'b', 'c'].map(TestObject).map(cache.getEditableObject);

                cache.markDirty(objects[0]);
                cache.markDirty(objects[2]);

                cache.saveAll();

                expect(captured.saved).toEqual(2);
            });

            it("does not save objects that have been marked clean", function () {
                var objects = ['a', 'b', 'c'].map(TestObject).map(cache.getEditableObject);

                cache.markDirty(objects[0]);
                cache.markDirty(objects[2]);
                cache.markClean(objects[0]);

                cache.saveAll();

                expect(captured.saved).toEqual(1);
            });


        });
    }

);
