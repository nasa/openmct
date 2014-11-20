/*global define*/

/**
 * Default type wizard. Type wizards provide both a declarative
 * description of the form which should be presented to a user
 * when a new domain object of a given type is instantiatd, as
 * well as the necessary functionality to convert this user input
 * to a model for a domain object.
 *
 * This wizard is intended to be both a general-purpose default
 * and a useful supertype; custom wizards for types which
 * require additional information should use this as a base
 * and append to the results of getSections(..) or add
 * properties to the result of createModel(..) as appropriate
 * to the more specific type.
 *
 * @module core/type/type-wizard
 */
define(
    {
        /**
         * Get all sections appropriate to the display of this type.
         *
         * @returns {Array<FormSection>}
         * @method
         */
        getSections: function (typeKey) {
            'use strict';

            return [
                {
	                label: "Title Options",
	                rows: [
                        {
                            control: '_textfield',
                            label: "Title",
                            key: "name"
                        },
                        {
                            control: '_checkbox',
                            label: "Display title by default",
                            key: "displayTitle"
                        }
                    ]
                }
            ];
        },

        /**
         * Create a model for a domain object based on user input.
         *
         * @param {object} formValue an object containing key-value
         *        pairs, where keys are properties indicated as part
         *        of a form's definition, and values are the result
         *        of user input.
         * @return {object} the new model for a domain object
         */
        createModel: function (formValue) {
            'use strict';

            var model = {
                type: formValue.type,
                name: formValue.name,
                display: { title: formValue.displayTitle }
            };

            return model;
        }
    }
);