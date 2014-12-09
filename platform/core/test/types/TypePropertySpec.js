/*global define,describe,it,xit,expect,beforeEach*/

define(
    ['../../src/types/TypeProperty'],
    function (TypeProperty) {
        "use strict";

        describe("Type property", function () {

            it("allows retrieval of its definition", function () {
                var definition = { key: "hello", someOtherKey: "hm?" };
                expect(
                    new TypeProperty(definition).getDefinition()
                ).toEqual(definition);
            });

            it("sets properties in object models", function () {
                var definition = {
                        key: "someKey",
                        property: "someProperty"
                    },
                    model = {},
                    property = new TypeProperty(definition);
                property.setValue(model, "some value");
                expect(model.someProperty).toEqual("some value");
            });

            it("gets properties from object models", function () {
                var definition = {
                        key: "someKey",
                        property: "someProperty"
                    },
                    model = { someProperty: "some value"},
                    property = new TypeProperty(definition);
                expect(property.getValue(model)).toEqual("some value");
            });

            it("sets properties by path", function () {
                var definition = {
                        key: "someKey",
                        property: [ "some", "property" ]
                    },
                    model = {},
                    property = new TypeProperty(definition);
                property.setValue(model, "some value");
                expect(model.some.property).toEqual("some value");
            });

            it("gets properties by path", function () {
                var definition = {
                        key: "someKey",
                        property: [ "some", "property" ]
                    },
                    model = { some: { property: "some value" } },
                    property = new TypeProperty(definition);
                expect(property.getValue(model)).toEqual("some value");
            });

            it("stops looking for properties when a path is invalid", function () {
                var definition = {
                        key: "someKey",
                        property: [ "some", "property" ]
                    },
                    property = new TypeProperty(definition);
                expect(property.getValue(undefined)).toBeUndefined();
            });

            it("gives undefined for empty paths", function () {
                var definition = {
                        key: "someKey",
                        property: []
                    },
                    model = { some: { property: "some value" } },
                    property = new TypeProperty(definition);
                expect(property.getValue(model)).toBeUndefined();
            });

            it("provides empty arrays for values that are array-like", function () {
                var definition = {
                        property: "someProperty",
                        items: [ {}, {}, {} ]
                    },
                    model = {},
                    property = new TypeProperty(definition);
                expect(property.getValue(model))
                    .toEqual([undefined, undefined, undefined]);
            });

            it("detects and ignores empty arrays on setValue", function () {
                var definition = {
                        property: "someProperty",
                        items: [ {}, {}, {} ]
                    },
                    model = {},
                    property = new TypeProperty(definition);

                property.setValue(model, [undefined, undefined, undefined]);
                expect(model.someProperty).toBeUndefined();

                // Verify that this only happens when all are undefined
                property.setValue(model, [undefined, "x", 42]);
                expect(model.someProperty).toEqual([undefined, "x", 42]);
            });

        });
    }
);