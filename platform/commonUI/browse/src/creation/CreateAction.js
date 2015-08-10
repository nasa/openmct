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
/*global define,Promise*/

/**
 * Module defining CreateAction. Created by vwoeltje on 11/10/14.
 */
define(
    ['./CreateWizard'],
    function (CreateWizard) {
        "use strict";

        /**
         * The Create Action is performed to create new instances of
         * domain objects of a specific type. This is the action that
         * is performed when a user uses the Create menu.
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
         * @param {DialogService} dialogService the dialog service
         *        to use when requesting user input
         * @param {CreationService} creationService the creation service,
         *        which handles the actual instantiation and persistence
         *        of the newly-created domain object
         */
        function CreateAction(type, parent, context, dialogService, creationService, policyService) {
            this.metadata = {
                key: 'create',
                glyph: type.getGlyph(),
                name: type.getName(),
                type: type.getKey(),
                description: type.getDescription(),
                context: context
            };

            this.type = type;
            this.parent = parent;
            this.policyService = policyService;
            this.dialogService = dialogService;
            this.creationService = creationService;
        }

        /**
         * Create a new object of the given type.
         * This will prompt for user input first.
         */
        CreateAction.prototype.perform = function () {
            /*
             Overview of steps in object creation:

             1. Show dialog
             a. Prepare dialog contents
             b. Invoke dialogService
             2. Create new object in persistence service
             a. Generate UUID
             b. Store model
             3. Mutate destination container
             a. Get mutation capability
             b. Add new id to composition
             4. Persist destination container
             a. ...use persistence capability.
             */

            // The wizard will handle creating the form model based
            // on the type...
            var wizard =
                new CreateWizard(this.type, this.parent, this.policyService),
                self = this;

            // Create and persist the new object, based on user
            // input.
            function persistResult(formValue) {
                var parent = wizard.getLocation(formValue),
                    newModel = wizard.createModel(formValue);
                return self.creationService.createObject(newModel, parent);
            }

            function doNothing() {
                // Create cancelled, do nothing
                return false;
            }

            return this.dialogService.getUserInput(
                wizard.getFormStructure(),
                wizard.getInitialFormValue()
            ).then(persistResult, doNothing);
        };


        /**
         * Metadata associated with a Create action.
         * @typedef {ActionMetadata} CreateActionMetadata
         * @property {string} type the key for the type of domain object
         *           to be created
         */

        /**
         * Get metadata about this action.
         * @returns {CreateActionMetadata} metadata about this action
         */
        CreateAction.prototype.getMetadata = function () {
           return this.metadata;
        };

        return CreateAction;
    }
);
