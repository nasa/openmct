/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    function () {

        /**
         * A class for capturing user input data from an object creation
         * dialog, and populating a domain object with that data.
         *
         * @param {DomainObject} domainObject the newly created object to
         * populate with user input
         * @param {DomainObject} parent the domain object to serve as
         *        the initial parent for the created object, in the dialog
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function CopyActionWizard(domainObject, parent, locationValidator) {
            this.type = domainObject.getCapability('type');
            this.model = domainObject.getModel();
            this.properties = this.type.getProperties();
            this.parent = parent;
            this.locationValidator = locationValidator;
            this.title = "Duplicate " + this.model.name + " To a Location";
            this.label = "Duplicate To";
        }

        /**
         * Get the form model for this wizard; this is a description
         * that will be rendered to an HTML form. See the
         * platform/forms bundle
         * @param {boolean} includeLocation if true, a 'location' section
         * will be included that will allow the user to select the location
         * of the newly created object, otherwise the .location property of
         * the model will be used.
         * @return {FormModel} formModel the form model to
         *         show in the create dialog
         */
        CopyActionWizard.prototype.getFormStructure = function () {
            return {
                sections: [
                    {
                        name: 'Properties',
                        rows: this.properties.map(function (property, index) {
                            var row = Object.create(property.getDefinition());
                            row.key = index;
                            return row;
                        }).filter(function (row) {
                            return row && row.control;
                        })
                    },
                    {
                        name: 'Location',
                        cssClass: 'grows',
                        rows: [
                            {
                                name: this.label,
                                control: 'locator',
                                validate: this.locationValidator,
                                key: 'location'
                            }
                        ]
                    }
                ],
                name: this.title
            };
        };

        /**
         * Get the initial value for the form being described.
         * This will include the values for all properties described
         * in the structure.
         *
         * @returns {object} the initial value of the form
         */
        CopyActionWizard.prototype.getInitialFormValue = function () {
            // Start with initial values for properties
            var model = this.model,
                formValue = this.properties.map(function (property) {
                    return property.getValue(model);
                });

            formValue.location = this.parent;

            return formValue;
        };

        return CopyActionWizard;
    }
);
