/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * DomainObjectSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/objects/DomainObjectImpl"],
    (DomainObject) => {

        describe("A domain object", () =>  {
            let testId = "test id",
                testModel = { someKey: "some value"},
                testCapabilities = {
                    "static": "some static capability",
                    "dynamic": (domainObject) => {
                        return "Dynamically generated for " +
                                    domainObject.getId();
                    },
                    "invokable": {
                        invoke: (arg) => {
                            return "invoked with " + arg;
                        }
                    }
                },
                domainObject;

            beforeEach(() =>  {
                domainObject = new DomainObject(
                    testId,
                    testModel,
                    testCapabilities
                );
            });

            it("reports its id", () =>  {
                expect(domainObject.getId()).toEqual(testId);
            });

            it("reports its model", () =>  {
                expect(domainObject.getModel()).toEqual(testModel);
            });

            it("reports static capabilities", () =>  {
                expect(domainObject.getCapability("static"))
                    .toEqual("some static capability");
            });

            it("instantiates dynamic capabilities", () =>  {
                expect(domainObject.getCapability("dynamic"))
                    .toEqual("Dynamically generated for test id");
            });

            it("allows for checking for the presence of capabilities", () =>  {
                Object.keys(testCapabilities).forEach( (capability) => {
                    expect(domainObject.hasCapability(capability)).toBeTruthy();
                });
                expect(domainObject.hasCapability("somethingElse")).toBeFalsy();
            });

            it("allows for shorthand capability invocation", () =>  {
                expect(domainObject.useCapability("invokable", "a specific value"))
                    .toEqual("invoked with a specific value");
            });

        });
    }
);
