/*global define,describe,it,expect,beforeEach, waitsFor, runs*/

define(
    ['../../src/types/TypeProvider'],
    function (typeProviderModule) {
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
                provider = typeProviderModule.instantiate({
                    definitions: testTypeDefinitions
                });
            });

            it("can be instantiated from a factory method", function () {
                expect(provider).toBeTruthy();
            });

            it("looks up non-inherited types by name", function () {
                provider.getType('basic').then(capture('type'));

                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getGlyph()).toEqual("X");
                    expect(captured.type.getName()).toEqual("Basic Type");
                    expect(captured.type.getDescription()).toBeUndefined();
                });
            });

            it("supports single inheritance", function () {
                provider.getType('single-subtype').then(capture('type'));

                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getGlyph()).toEqual("X");
                    expect(captured.type.getName()).toEqual("Basic Subtype");
                    expect(captured.type.getDescription()).toEqual("A test subtype");
                });
            });

            it("supports multiple inheritance", function () {
                provider.getType('multi-subtype').then(capture('type'));
                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getGlyph()).toEqual("Y");
                    expect(captured.type.getName()).toEqual("Multi-parent Subtype");
                    expect(captured.type.getDescription()).toEqual("Multi1 Description");
                });
            });

            it("concatenates capabilities in order", function () {
                provider.getType('multi-subtype').then(capture('type'));
                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getDefinition().capabilities).toEqual(
                        ['a1', 'b1', 'a2', 'b2', 'c2', 'a3']
                    );
                });
            });

            it("allows lookup of the undefined type", function () {
                provider.getType(undefined).then(capture('type'));
                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getName()).toEqual("Default");
                });
            });

            it("concatenates capabilities of all undefined types", function () {
                typeProviderModule.instantiate({
                    definitions: testTypeDefinitions.concat([
                        {
                            capabilities: ['a', 'b', 'c']
                        },
                        {
                            capabilities: ['x', 'y', 'z']
                        }
                    ])
                }).getType(undefined).then(capture('type'));

                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getDefinition().capabilities).toEqual(
                        ['a', 'b', 'c', 'x', 'y', 'z']
                    );
                });
            });

            it("includes capabilities from undefined type in all types", function () {
                typeProviderModule.instantiate({
                    definitions: testTypeDefinitions.concat([
                        {
                            capabilities: ['a', 'b', 'c']
                        },
                        {
                            capabilities: ['x', 'y', 'z']
                        }
                    ])
                }).getType('multi-subtype').then(capture('type'));
                waitsFor(
                    function () {
                        return captured.type !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.type.getDefinition().capabilities).toEqual(
                        ['a', 'b', 'c', 'x', 'y', 'z', 'a1', 'b1', 'a2', 'b2', 'c2', 'a3']
                    );
                });
            });

            it("allows types to be listed", function () {
                provider.listTypes().then(capture('types'));
                waitsFor(
                    function () {
                        return captured.types !== undefined;
                    },
                    "promise resolution",
                    250
                );
                runs(function () {
                    expect(captured.types.length).toEqual(
                        testTypeDefinitions.filter(function (t) {
                            return t.key;
                        }).length
                    );
                });
            });


        });
    }
);