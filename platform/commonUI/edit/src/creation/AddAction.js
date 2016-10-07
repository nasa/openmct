/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

/**
 * Module defining AddAction. Created by ahenry on 01/21/16.
 */
define(
    [
        './CreateWizard'
    ],
    function (CreateWizard) {

        /**
         * The Add Action is performed to create new instances of
         * domain objects of a specific type that are subobjects of an
         * object being edited. This is the action that is performed when a
         * user uses the Add menu option.
         *
         * @memberof platform/commonUI/browse
         * @implements {Action}
         * @constructor
         *
         * @param {Type} type the type of domain object to create
         * @param {DomainObject} parent the domain object that should
         *        act as a container for the newly-created object
         *        (note that the user will have an opportunity to
         *        override this)
         * @param {ActionContext} context the context in which the
         *        action is being performed
         * @param {DialogService} dialogService
         */
        function AddAction(type, parent, context, $q, dialogService, policyService) {
            this.metadata = {
                key: 'add',
                cssclass: type.getCssClass(),
                name: type.getName(),
                type: type.getKey(),
                description: type.getDescription(),
                context: context
            };

            this.type = type;
            this.parent = parent;
            this.$q = $q;
            this.dialogService = dialogService;
            this.policyService = policyService;
        }

        /**
         *
         * Create a new object of the given type.
         * This will prompt for user input first.
         *
         * @returns {Promise} that will be resolved with the object that the
         * action was originally invoked on (ie. the 'parent')
         */
        AddAction.prototype.perform = function () {
            var newModel = this.type.getInitialModel(),
                newObject,
                parentObject = this.parent,
                wizard;

            newModel.type = this.type.getKey();
            newObject = parentObject.getCapability('instantiation').instantiate(newModel);
            newObject.useCapability('mutation', function (model) {
                model.location = parentObject.getId();
            });

            wizard = new CreateWizard(newObject, this.parent, this.policyService);

            function populateObjectFromInput(formValue) {
                return wizard.populateObjectFromInput(formValue, newObject);
            }

            function persistAndReturn(domainObject) {
                return domainObject.getCapability('persistence')
                    .persist()
                    .then(function () {
                        return domainObject;
                    });
            }

            function addToParent(populatedObject) {
                parentObject.getCapability('composition').add(populatedObject);
                return persistAndReturn(parentObject);
            }

            return this.dialogService
                .getUserInput(wizard.getFormStructure(false), wizard.getInitialFormValue())
                .then(populateObjectFromInput)
                .then(persistAndReturn)
                .then(addToParent);

        };


        /**
         * Metadata associated with a Add action.
         * @typedef {ActionMetadata} AddActionMetadata
         * @property {string} type the key for the type of domain object
         *           to be created
         */

        /**
         * Get metadata about this action.
         * @returns {AddActionMetadata} metadata about this action
         */
        AddAction.prototype.getMetadata = function () {
            return this.metadata;
        };

        return AddAction;
    }
);
