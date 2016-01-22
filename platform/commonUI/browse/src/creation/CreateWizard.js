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
         */
        function CreateWizard(type, parent, policyService, initialModel) {
            this.type = type;
            this.model = initialModel || type.getInitialModel();
            this.properties = type.getProperties();
            this.parent = parent;
            this.policyService = policyService;
        }

        /**
         * Get the form model for this wizard; this is a description
         * that will be rendered to an HTML form. See the
         * platform/forms bundle
         *
         * @return {FormModel} formModel the form model to
         *         show in the create dialog
         */
        CreateWizard.prototype.getFormStructure = function () {
            var sections = [],
                type = this.type,
                policyService = this.policyService;

            function validateLocation(locatingObject) {
                var locatingType = locatingObject &&
                    locatingObject.getCapability('type');
                return locatingType && policyService.allow(
                    "composition",
                    locatingType,
                    type
                );
            }

            sections.push({
                name: "Properties",
                rows: this.properties.map(function (property, index) {
                    // Property definition is same as form row definition
                    var row = Object.create(property.getDefinition());

                    // Use index as the key into the formValue;
                    // this correlates to the indexing provided by
                    // getInitialFormValue
                    row.key = index;

                    return row;
                }).filter(function (row) {
                    // Only show rows which have defined controls
                    return row && row.control;
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
                name: "Create a New " + this.type.getName()
            };
        };

        /**
         * Get the initial value for the form being described.
         * This will include the values for all properties described
         * in the structure.
         *
         * @returns {object} the initial value of the form
         */
        CreateWizard.prototype.getInitialFormValue = function () {
            // Start with initial values for properties
            var model = this.model,
                formValue = this.properties.map(function (property) {
                    return property.getValue(model);
                });

            // Include the createParent
            formValue.createParent = this.parent;

            return formValue;
        };

        /**
         * Based on a populated form, get the domain object which
         * should be used as a parent for the newly-created object.
         * @return {DomainObject}
         */
        CreateWizard.prototype.getLocation = function (formValue) {
            return formValue.createParent || this.parent;
        };

        /**
         * Create the domain object model for a newly-created object,
         * based on user input read from a formModel.
         * @return {object} the domain object model
         */
        CreateWizard.prototype.createModel = function (formValue) {
            // Clone
            var newModel = JSON.parse(JSON.stringify(this.model));

            // Always use the type from the type definition
            newModel.type = this.type.getKey();

            // Update all properties
            this.properties.forEach(function (property, index) {
                property.setValue(newModel, formValue[index]);
            });

            return newModel;
        };

        return CreateWizard;
    }
);
