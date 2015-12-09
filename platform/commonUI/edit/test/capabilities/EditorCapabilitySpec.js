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
/*global define,describe,it,expect,beforeEach,waitsFor,runs,jasmine,xit,xdescribe*/

define(
    ["../../src/capabilities/EditorCapability"],
    function (EditorCapability) {
        "use strict";

        describe("The editor capability", function () {
            var mockPersistence,
                mockEditableObject,
                mockDomainObject,
                mockCache,
                mockCallback,
                model,
                capability;

            beforeEach(function () {
                mockPersistence = jasmine.createSpyObj(
                    "persistence",
                    [ "persist" ]
                );
                mockEditableObject = {
                    getModel: function () { return model; }
                };
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability", "useCapability" ]
                );
                mockCache = jasmine.createSpyObj(
                    "cache",
                    [ "saveAll", "markClean" ]
                );
                mockCallback = jasmine.createSpy("callback");

                mockDomainObject.getCapability.andReturn(mockPersistence);

                model = { someKey: "some value", x: 42 };

                capability = new EditorCapability(
                    mockPersistence,
                    mockEditableObject,
                    mockDomainObject,
                    mockCache
                );
            });

            //TODO: Disabled for NEM Beta
            xit("mutates the real domain object on nonrecursive save", function () {
                capability.save(true).then(mockCallback);

                // Wait for promise to resolve
                waitsFor(function () {
                    return mockCallback.calls.length > 0;
                }, 250);

                runs(function () {
                    expect(mockDomainObject.useCapability)
                        .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                    // We should get the model from the editable object back
                    expect(
                        mockDomainObject.useCapability.mostRecentCall.args[1]()
                    ).toEqual(model);
                });
            });

            //TODO: Disabled for NEM Beta
            xit("tells the cache to save others", function () {
                capability.save().then(mockCallback);

                // Wait for promise to resolve
                waitsFor(function () {
                    return mockCallback.calls.length > 0;
                }, 250);

                runs(function () {
                    expect(mockCache.saveAll).toHaveBeenCalled();
                });
            });

            //TODO: Disabled for NEM Beta
            xit("has no interactions on cancel", function () {
                capability.cancel().then(mockCallback);

                // Wait for promise to resolve
                waitsFor(function () {
                    return mockCallback.calls.length > 0;
                }, 250);

                runs(function () {
                    expect(mockDomainObject.useCapability).not.toHaveBeenCalled();
                    expect(mockCache.markClean).not.toHaveBeenCalled();
                    expect(mockCache.saveAll).not.toHaveBeenCalled();
                });
            });


        });
    }
);