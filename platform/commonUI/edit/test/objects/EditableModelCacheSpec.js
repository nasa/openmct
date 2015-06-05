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