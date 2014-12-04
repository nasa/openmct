/*global define*/

/**
 * Defines the PropertiesDialog, used by the PropertiesAction to
 * populate the form shown in dialog based on the created type.
 *
 * @module common/actions/properties-dialog
 */
define(
    function () {
        'use strict';

        /**
         * Construct a new Properties dialog.
         *
         * @param {TypeImpl} type the type of domain object for which properties
         *        will be specified
         * @param {DomainObject} the object for which properties will be set
         * @constructor
         * @memberof module:common/actions/properties-dialog
         */
        function PropertiesDialog(type, model) {
            var properties = type.getProperties();

            return {
                /**
                 * Get sections provided by this dialog.
                 * @return {FormStructure} the structure of this form
                 */
                getFormStructure: function () {
                    return {
                        name: "Edit " + model.name,
                        sections: [{
                            name: "Properties",
                            rows: properties.map(function (property, index) {
                                // Property definition is same as form row definition
                                var row = Object.create(property.getDefinition());
                                row.key = index;
                                return row;
                            })
                        }]
                    };
                },
                /**
                 * Get the initial state of the form shown by this dialog
                 * (based on the object model)
                 * @returns {object} initial state of the form
                 */
                getInitialFormValue: function () {
                    // Start with initial values for properties
                    // Note that index needs to correlate to row.key
                    // from getFormStructure
                    return properties.map(function (property) {
                        return property.getValue(model);
                    });
                },
                /**
                 * Update a domain object model based on the value of a form.
                 */
                updateModel: function (model, formValue) {
                    // Update all properties
                    properties.forEach(function (property, index) {
                        property.setValue(model, formValue[index]);
                    });
                }
            };


        }

        return PropertiesDialog;
    }
);