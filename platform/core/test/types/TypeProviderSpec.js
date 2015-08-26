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
/*global define,describe,it,expect,beforeEach, waitsFor, runs*/

define(
    ['../../src/types/TypeProvider'],
    function (TypeProvider) {
        "use strict";

        describe("Type provider", function () {

            var captured = {},
                capture = function (name) {
                    return function (value) {
                        captured[name] = value;
                    };
                },
                testTypeDefinitions = [
                    {
                        key: 'basic',
                        glyph: "X",
                        name: "Basic Type"
                    },
                    {
                        key: 'multi1',
                        glyph: "Z",
                        description: "Multi1 Description",
                        capabilities: ['a1', 'b1']
                    },
                    {
                        key: 'multi2',
                        glyph: "Y",
                        capabilities: ['a2', 'b2', 'c2']
                    },
                    {
                        key: 'single-subtype',
                        inherits: 'basic',
                        name: "Basic Subtype",
                        description: "A test subtype"
                    },
                    {
                        key: 'multi-subtype',
                        inherits: ['multi1', 'multi2'],
                        name: "Multi-parent Subtype",
                        capabilities: ['a3']
                    },
                    {
                        name: "Default"
                    }
                ],
                provider;

            beforeEach(function () {
                captured = {};
                provider = new TypeProvider(testTypeDefinitions);
            });

            it("looks up non-inherited types by name", function () {
                captured.type = provider.getType('basic');

                expect(captured.type.getGlyph()).toEqual("X");
                expect(captured.type.getName()).toEqual("Basic Type");
                expect(captured.type.getDescription()).toBeUndefined();
            });

            it("supports single inheritance", function () {
                captured.type = provider.getType('single-subtype');

                expect(captured.type.getGlyph()).toEqual("X");
                expect(captured.type.getName()).toEqual("Basic Subtype");
                expect(captured.type.getDescription()).toEqual("A test subtype");
            });

            it("supports multiple inheritance", function () {
                captured.type = provider.getType('multi-subtype');

                expect(captured.type.getGlyph()).toEqual("Y");
                expect(captured.type.getName()).toEqual("Multi-parent Subtype");
                expect(captured.type.getDescription()).toEqual("Multi1 Description");
            });

            it("concatenates capabilities in order", function () {
                captured.type = provider.getType('multi-subtype');

                expect(captured.type.getDefinition().capabilities).toEqual(
                    ['a1', 'b1', 'a2', 'b2', 'c2', 'a3']
                );
            });

            it("allows lookup of the undefined type", function () {
                captured.type = provider.getType(undefined);

                expect(captured.type.getName()).toEqual("Default");
            });

            it("concatenates capabilities of all undefined types", function () {
                captured.type = new TypeProvider(
                    testTypeDefinitions.concat([
                        { capabilities: ['a', 'b', 'c'] },
                        { capabilities: ['x', 'y', 'z'] }
                    ])
                ).getType(undefined);


                expect(captured.type.getDefinition().capabilities).toEqual(
                    ['a', 'b', 'c', 'x', 'y', 'z']
                );

            });

            it("includes capabilities from undefined type in all types", function () {
                captured.type = new TypeProvider(
                    testTypeDefinitions.concat([
                        { capabilities: ['a', 'b', 'c'] },
                        { capabilities: ['x', 'y', 'z'] }
                    ])
                ).getType('multi-subtype');

                expect(captured.type.getDefinition().capabilities).toEqual(
                    ['a', 'b', 'c', 'x', 'y', 'z', 'a1', 'b1', 'a2', 'b2', 'c2', 'a3']
                );
            });

            it("allows types to be listed", function () {
                captured.types = provider.listTypes();

                expect(captured.types.length).toEqual(
                    testTypeDefinitions.filter(function (t) {
                        return t.key;
                    }).length
                );
            });


        });
    }
);