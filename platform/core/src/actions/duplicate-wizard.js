/*global define,Promise*/

/**
 * Module defining duplicate-wizard. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function DuplicateWizard(model, type, parent) {
            var properties = type.getProperties();

            return {
                getSections: function () {
                    var parentRow = Object.create(parent),
                        sections = [];

                    sections.push({
                        label: "Properties",
                        rows: properties.map(function (property) {
                            // Property definition is same as form row definition
                            var row = Object.create(property.getDefinition());
                            // But pull an initial value from the model
                            row.value = property.getValue(model);
                            return row;
                        })
                    });

                    // Ensure there is always a "save in" section
                    parentRow.label = "Save In";
                    parentRow.cssclass = "selector-list";
                    parentRow.control = "_locator";
                    parentRow.key = "createParent";
                    sections.push({ label: 'Location', rows: [parentRow]});

                    return sections;
                },
                createModel: function (formValue) {
                    // Clone
                    var newModel = JSON.parse(JSON.stringify(model));

                    // Always use the type from the type definition
                    newModel.type = type.getKey();

                    // Update all properties
                    properties.forEach(function (property) {
                        var value = formValue[property.getDefinition().key];
                        property.setValue(newModel, value);
                    });

                    return newModel;
                }
            };

        }

        return DuplicateWizard;
    }
);