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
 * Module defining CreateAction. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {

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
         */
        function CreateAction(type, parent, context) {
            this.metadata = {
                key: 'create',
                cssclass: type.getCssClass(),
                name: type.getName(),
                type: type.getKey(),
                description: type.getDescription(),
                context: context
            };
            this.type = type;
            this.parent = parent;
        }

        /**
         * Create a new object of the given type.
         * This will prompt for user input first.
         */
        CreateAction.prototype.perform = function () {
            var newModel = this.type.getInitialModel(),
                newObject,
                editAction,
                editorCapability;

            function closeEditor() {
                return editorCapability.finish();
            }

            function onSave() {
                return editorCapability.save()
                    .then(closeEditor);
            }

            function onCancel() {
                return closeEditor();
            }

            newModel.type = this.type.getKey();
            newModel.location = this.parent.getId();
            newObject = this.parent.useCapability('instantiation', newModel);
            editorCapability = newObject.hasCapability('editor') && newObject.getCapability("editor");

            editAction = newObject.getCapability("action").getActions("edit")[0];
            //If an edit action is available, perform it
            if (editAction) {
                return editAction.perform();
            } else if (editorCapability) {
                //otherwise, use the save as action
                editorCapability.edit();
                return newObject.getCapability("action").perform("save-as").then(onSave, onCancel);
            }
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
