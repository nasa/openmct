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
                model = { x: "initial value" };
                properties = ["x", "y", "z"].map(function (k) {
                    return {
                        getValue: function (model) { return model[k]; },
                        setValue: function (model, v) { model[k] = v; },
                        getDefinition: function () { return {}; }
                    };
                });

                dialog = new PropertiesDialog(type, model);
            });

            it("provides sections based on type properties", function () {
                expect(dialog.getFormStructure().sections[0].rows.length)
                    .toEqual(properties.length);
            });

            it("pulls initial values from object model", function () {
                expect(dialog.getInitialFormValue()[0])
                    .toEqual("initial value");
            });

            it("populates models with form results", function () {
                dialog.updateModel(model, [
                    "new value",
                    "other new value",
                    42
                ]);
                expect(model).toEqual({
                    x: "new value",
                    y: "other new value",
                    z: 42
                });
            });

        });
    }
);
