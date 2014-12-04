/*global define,describe,it,xit,expect,beforeEach*/

define(
    ["../../src/actions/PropertiesDialog"],
    function (PropertiesDialog) {
        "use strict";

        describe("Properties dialog", function () {

            var type, properties, domainObject, model, dialog;

            beforeEach(function () {
                type = {
                    getProperties: function () { return properties; }
                };
                domainObject = {
                    getModel: function () { return model; }
                };
                model = { x: "initial value" };

                dialog = new PropertiesDialog(type, domainObject);
            });

            it("provides sections based on type properties", function () {
                expect(
                    dialog.getSections()[0].rows.length
                ).toEqual(properties.length);
            });

            it("pulls initial values from object model", function () {
                expect(
                    dialog.getSections()[0].rows[0].value
                ).toEqual("initial value");
            });

            it("populates models with form results", function () {
                dialog.updateModel(model, {
                    a: "new value",
                    b: "other new value",
                    c: 42
                });
                expect(model).toEqual({
                    x: "new value",
                    y: "other new value",
                    z: 42
                });
            });

        });
    }
);
