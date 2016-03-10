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
    ["../../src/capabilities/EditableLookupCapability"],
    function (EditableLookupCapability) {
        "use strict";

        describe("An editable lookup capability", function () {
            var mockContext,
                mockEditableObject,
                mockDomainObject,
                mockTestObject,
                someValue,
                factory,
                capability;

            beforeEach(function () {
                // EditableContextCapability should watch ALL
                // methods for domain objects, so give it an
                // arbitrary interface to wrap.
                mockContext = jasmine.createSpyObj(
                    "context",
                    [
                        "getSomething",
                        "getDomainObject",
                        "getDomainObjectArray"
                    ]
                );
                mockTestObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                factory = {
                    getEditableObject: function (v) {
                        return {
                            isFromTestFactory: true,
                            calledWith: v
                        };
                    }
                };

                someValue = { x: 42 };

                mockContext.getSomething.andReturn(someValue);
                mockContext.getDomainObject.andReturn(mockTestObject);
                mockContext.getDomainObjectArray.andReturn([mockTestObject]);

                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    false
                );

            });

            it("wraps retrieved domain objects", function () {
                var object = capability.getDomainObject();
                expect(object.isFromTestFactory).toBe(true);
                expect(object.calledWith).toEqual(mockTestObject);
            });

            it("wraps retrieved domain object arrays", function () {
                var object = capability.getDomainObjectArray()[0];
                expect(object.isFromTestFactory).toBe(true);
                expect(object.calledWith).toEqual(mockTestObject);
            });

            it("does not wrap non-domain-objects", function () {
                expect(capability.getSomething()).toEqual(someValue);
            });

            it("caches idempotent lookups", function () {
                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    true // idempotent
                );
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(1);
            });

            it("does not cache non-idempotent lookups", function () {
                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    false // Not idempotent
                );
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(2);
            });

            it("wraps inherited methods", function () {
                var CapabilityClass = function(){
                };
                CapabilityClass.prototype.inheritedMethod=function () {
                    return "an inherited method";
                };

                mockContext = new CapabilityClass();

                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    false
                );
                expect(capability.inheritedMethod()).toEqual("an inherited method");
                expect(capability.hasOwnProperty('inheritedMethod')).toBe(true);
                // The presence of an own property indicates that the method
                // has been wrapped on the object itself and this is a valid
                // test that the inherited method has been wrapped.
            });

        });
    }
);