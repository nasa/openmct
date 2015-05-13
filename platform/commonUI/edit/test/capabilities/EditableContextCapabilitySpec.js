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
    ["../../src/capabilities/EditableContextCapability"],
    function (EditableContextCapability) {
        "use strict";

        describe("An editable context capability", function () {
            var mockContext,
                mockEditableObject,
                mockDomainObject,
                mockTestObject,
                someValue,
                mockFactory,
                capability;

            beforeEach(function () {
                // EditableContextCapability should watch ALL
                // methods for domain objects, so give it an
                // arbitrary interface to wrap.
                mockContext =
                    jasmine.createSpyObj("context", [ "getDomainObject", "getRoot" ]);
                mockTestObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockFactory = jasmine.createSpyObj(
                    "factory",
                    ["getEditableObject", "isRoot"]
                );

                someValue = { x: 42 };

                mockContext.getRoot.andReturn(mockTestObject);
                mockContext.getDomainObject.andReturn(mockTestObject);
                mockFactory.getEditableObject.andReturn(someValue);
                mockFactory.isRoot.andReturn(true);

                capability = new EditableContextCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    mockFactory
                );

            });

            it("presumes idempotence of its wrapped capability", function () {
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(1);
            });

            it("hides the root object", function () {
                expect(capability.getRoot()).toEqual(mockEditableObject);
                expect(capability.getPath()).toEqual([mockEditableObject]);
            });

            it("exposes the root object through a different method", function () {
                // Should still go through the factory...
                expect(capability.getTrueRoot()).toEqual(someValue);
                // ...with value of the unwrapped capability's getRoot
                expect(mockFactory.getEditableObject)
                    .toHaveBeenCalledWith(mockTestObject);
            });
        });
    }
);