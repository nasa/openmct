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

        });
    }
);