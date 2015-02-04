/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/objects/EditableModelCache"],
    function (EditableModelCache) {
        "use strict";

        describe("The editable model cache", function () {
            var mockObject,
                mockOtherObject,
                testModel,
                testId,
                otherModel,
                otherId,
                cache;

            beforeEach(function () {
                testId = "test";
                testModel = { someKey: "some value" };
                otherId = "other";
                otherModel = { someKey: "some other value" };

                mockObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel" ]
                );
                mockOtherObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel" ]
                );

                mockObject.getId.andReturn(testId);
                mockObject.getModel.andReturn(testModel);
                mockOtherObject.getId.andReturn(otherId);
                mockOtherObject.getModel.andReturn(otherModel);

                cache = new EditableModelCache();
            });

            it("provides clones of domain object models", function () {
                var model = cache.getCachedModel(mockObject);
                // Should be identical...
                expect(model).toEqual(testModel);
                // ...but not pointer-identical
                expect(model).not.toBe(testModel);
            });

            it("provides only one clone per object", function () {
                var model = cache.getCachedModel(mockObject);
                expect(cache.getCachedModel(mockObject)).toBe(model);
            });

            it("maintains separate caches per-object", function () {
                expect(cache.getCachedModel(mockObject))
                    .not.toEqual(cache.getCachedModel(mockOtherObject));
            });
        });

    }
);