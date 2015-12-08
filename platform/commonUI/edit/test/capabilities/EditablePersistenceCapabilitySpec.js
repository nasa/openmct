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
    ["../../src/capabilities/EditablePersistenceCapability"],
    function (EditablePersistenceCapability) {
        "use strict";

        describe("An editable persistence capability", function () {
            var mockPersistence,
                mockEditableObject,
                mockDomainObject,
                mockCache,
                mockPromise,
                capability;

            beforeEach(function () {
                mockPersistence = jasmine.createSpyObj(
                    "persistence",
                    [ "persist", "refresh" ]
                );
                mockEditableObject = jasmine.createSpyObj(
                    "editableObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "editableObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockCache = jasmine.createSpyObj(
                    "cache",
                    [ "markDirty" ]
                );
                mockPromise = jasmine.createSpyObj("promise", ["then"]);

                mockCache.markDirty.andReturn(mockPromise);
                mockDomainObject.getCapability.andReturn(mockPersistence);

                capability = new EditablePersistenceCapability(
                    mockPersistence,
                    mockEditableObject,
                    mockDomainObject,
                    mockCache
                );
            });

            it("marks objects as dirty (in the cache) upon persist", function () {
                capability.persist();
                expect(mockCache.markDirty)
                    .toHaveBeenCalledWith(mockEditableObject);
            });

            it("does not invoke the underlying persistence capability", function () {
                capability.persist();
                expect(mockPersistence.persist).not.toHaveBeenCalled();
            });

            it("refreshes using the original domain object's persistence", function () {
                // Refreshing needs to delegate via the unwrapped domain object.
                // Otherwise, only the editable version of the object will be updated;
                // we instead want the real version of the object to receive these
                // changes.
                expect(mockDomainObject.getCapability).not.toHaveBeenCalled();
                expect(mockPersistence.refresh).not.toHaveBeenCalled();
                capability.refresh();
                expect(mockDomainObject.getCapability).toHaveBeenCalledWith('persistence');
                expect(mockPersistence.refresh).toHaveBeenCalled();
            });

            it("returns a promise from persist", function () {
                expect(capability.persist().then).toEqual(jasmine.any(Function));
            });

        });
    }
);