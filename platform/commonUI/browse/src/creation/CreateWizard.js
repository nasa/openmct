/*global define*/

/**
 * Defines the CreateWizard, used by the CreateAction to
 * populate the form shown in dialog based on the created type.
 *
 * @module core/action/create-wizard
 */
define(
    function () {
        'use strict';

        /**
         * Construct a new CreateWizard.
         *
         * @param {TypeImpl} type the type of domain object to be created
         * @param {DomainObject} parent the domain object to serve as
         *        the initial parent for the created object, in the dialog
         * @constructor
         * @memberof module:core/action/create-wizard
         */
        function CreateWizard(type, parent) {
            var model = type.getInitialModel(),
                properties = type.getProperties();

            return {
                getFormModel: function () {
                    var parentRow = Object.create(parent),
                        sections = [];

                    sections.push({
                        name: "Properties",
                        rows: properties.map(function (property) {
                            // Property definition is same as form row definition
                            var row = Object.create(property.getDefinition());
                            // But pull an initial value from the model
                            row.value = property.getValue(model);
                            return row;
                        })
                    });

                    // Ensure there is always a "save in" section
                    parentRow.name = "Save In";
                    parentRow.cssclass = "selector-list";
                    parentRow.control = "_locator";
                    parentRow.key = "createParent";
                    sections.push({ label: 'Location', rows: [parentRow]});

                    return {
                        sections: sections,
                        name: "Create a New " + type.getName()
                    };
                },
                getLocation: function (formValue) {
                    return formValue.createParent || parent;
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

        return CreateWizard;
    }
);