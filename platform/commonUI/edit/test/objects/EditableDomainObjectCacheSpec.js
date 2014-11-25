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

            function WrapObject(domainObject) {
                var result = Object.create(domainObject);
                result.wrapped = true;
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

            it("only wraps objects once", function () {
                var domainObject = new TestObject('test-id'),
                    wrappedObject;

                // Verify precondition
                expect(captured.wraps).toBeUndefined();

                // Invoke a few more times; expect count not to increment
                wrappedObject = cache.getEditableObject(domainObject);
                expect(captured.wraps).toEqual(1);
                wrappedObject = cache.getEditableObject(domainObject);
                expect(captured.wraps).toEqual(1);
                wrappedObject = cache.getEditableObject(domainObject);
                expect(captured.wraps).toEqual(1);

                // Verify that the last call still gave us a wrapped object
                expect(wrappedObject.wrapped).toBeTruthy();
                expect(wrappedObject.getId()).toEqual(domainObject.getId());
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
