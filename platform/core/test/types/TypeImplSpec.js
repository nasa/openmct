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

define(
    ['../../src/types/TypeImpl'],
    (TypeImpl) => {

        describe("Type definition wrapper", () =>  {
            let testTypeDef,
                type;

            beforeEach(() =>  {
                testTypeDef = {
                    key: 'test-type',
                    name: 'Test Type',
                    description: 'A type, for testing',
                    cssclass: 'icon-telemetry-panel',
                    inherits: ['test-parent-1', 'test-parent-2'],
                    features: ['test-feature-1'],
                    properties: [{}],
                    model: {someKey: "some value"}
                };
                type = new TypeImpl(testTypeDef);
            });

            it("exposes key from definition", () =>  {
                expect(type.getKey()).toEqual('test-type');
            });

            it("exposes name from definition", () =>  {
                expect(type.getName()).toEqual('Test Type');
            });

            it("exposes description from definition", () =>  {
                expect(type.getDescription()).toEqual('A type, for testing');
            });

            it("exposes CSS class from definition", () =>  {
                expect(type.getCssClass()).toEqual('icon-telemetry-panel');
            });

            it("exposes its underlying type definition", () =>  {
                expect(type.getDefinition()).toEqual(testTypeDef);
            });

            it("supports instance-of checks by type key", () =>  {
                expect(type.instanceOf('test-parent-1')).toBeTruthy();
                expect(type.instanceOf('test-parent-2')).toBeTruthy();
                expect(type.instanceOf('some-other-type')).toBeFalsy();
            });

            it("supports instance-of checks by specific type key", () =>  {
                expect(type.instanceOf('test-type')).toBeTruthy();
            });

            it("supports instance-of checks by type object", () =>  {
                expect(type.instanceOf({
                    getKey: () =>  {
                        return 'test-parent-1';
                    }
                })).toBeTruthy();
                expect(type.instanceOf({
                    getKey: () =>  {
                        return 'some-other-type';
                    }
                })).toBeFalsy();
            });

            it("correctly recognizes instance-of checks upon itself", () =>  {
                expect(type.instanceOf(type)).toBeTruthy();
            });

            it("recognizes that all types are instances of the undefined type", () =>  {
                expect(type.instanceOf()).toBeTruthy();
                expect(type.instanceOf({ getKey: () =>  {} })).toBeTruthy();
            });

            it("allows features to be exposed", () =>  {
                expect(type.hasFeature('test-feature-1')).toBeTruthy();
                expect(type.hasFeature('test-feature-2')).toBeFalsy();
            });

            it("provides an initial model, if defined", () =>  {
                expect(type.getInitialModel().someKey).toEqual("some value");
            });

            it("provides a fresh initial model each time", () =>  {
                let model = type.getInitialModel();
                model.someKey = "some other value";
                expect(type.getInitialModel().someKey).toEqual("some value");
            });

            it("provides type properties", () =>  {
                expect(type.getProperties().length).toEqual(1);
            });
        });
    }
);
