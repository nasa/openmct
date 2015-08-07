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
         * @memberof platform/commonUI/browse
         * @constructor
         * @memberof module:core/action/create-wizard
         */
        function CreateWizard(type, parent, policyService) {
            var model = type.getInitialModel(),
                properties = type.getProperties();

            function validateLocation(locatingObject) {
                var locatingType = locatingObject &&
                        locatingObject.getCapability('type');
                return locatingType && policyService.allow(
                    "composition",
                    locatingType,
                    type
                );
            }

            return {
                /**
                 * Get the form model for this wizard; this is a description
                 * that will be rendered to an HTML form. See the
                 * platform/forms bundle
                 *
                 * @return {FormModel} formModel the form model to
                 *         show in the create dialog
                 * @memberof platform/commonUI/browse.CreateWizard#
                 */
                getFormStructure: function () {
                    var sections = [];

                    sections.push({
                        name: "Properties",
                        rows: properties.map(function (property, index) {
                            // Property definition is same as form row definition
                            var row = Object.create(property.getDefinition());

                            // Use index as the key into the formValue;
                            // this correlates to the indexing provided by
                            // getInitialFormValue
                            row.key = index;

                            return row;
                        })
                    });

                    // Ensure there is always a "save in" section
                    sections.push({ name: 'Location', rows: [{
                        name: "Save In",
                        control: "locator",
                        validate: validateLocation,
                        key: "createParent"
                    }]});

                    return {
                        sections: sections,
                        name: "Create a New " + type.getName()
                    };
                },
                /**
                 * Get the initial value for the form being described.
                 * This will include the values for all properties described
                 * in the structure.
                 *
                 * @returns {object} the initial value of the form
                 * @memberof platform/commonUI/browse.CreateWizard#
                 */
                getInitialFormValue: function () {
                    // Start with initial values for properties
                    var formValue = properties.map(function (property) {
                        return property.getValue(model);
                    });

                    // Include the createParent
                    formValue.createParent = parent;

                    return formValue;
                },
                /**
                 * Based on a populated form, get the domain object which
                 * should be used as a parent for the newly-created object.
                 * @return {DomainObject}
                 * @memberof platform/commonUI/browse.CreateWizard#
                 */
                getLocation: function (formValue) {
                    return formValue.createParent || parent;
                },
                /**
                 * Create the domain object model for a newly-created object,
                 * based on user input read from a formModel.
                 * @return {object} the domain object' model
                 * @memberof platform/commonUI/browse.CreateWizard#
                 */
                createModel: function (formValue) {
                    // Clone
                    var newModel = JSON.parse(JSON.stringify(model));

                    // Always use the type from the type definition
                    newModel.type = type.getKey();

                    // Update all properties
                    properties.forEach(function (property, index) {
                        property.setValue(newModel, formValue[index]);
                    });

                    return newModel;
                }
            };


        }

        return CreateWizard;
    }
);
