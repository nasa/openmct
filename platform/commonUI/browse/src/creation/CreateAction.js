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
    [
        './CreateWizard',
        '../../../edit/src/objects/EditableDomainObject'
    ],
    function (CreateWizard, EditableDomainObject) {
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
         * @param {NavigationService} navigationService the navigation service,
         *        which handles changes in navigation. It allows the object
         *        being browsed/edited to be set.
         */
        function CreateAction(type, parent, context, $q, navigationService) {
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
            this.navigationService = navigationService;
            this.$q = $q;
        }

        // Get a count of views which are not flagged as non-editable.
        function countEditableViews(domainObject) {
            var views = domainObject && domainObject.useCapability('view'),
                count = 0;

            // A view is editable unless explicitly flagged as not
            (views || []).forEach(function (view) {
                count += (view.editable !== false) ? 1 : 0;
            });

            return count;
        }

        /**
         * Create a new object of the given type.
         * This will prompt for user input first.
         */
        CreateAction.prototype.perform = function () {
            var newModel = this.type.getInitialModel(),
                parentObject = this.navigationService.getNavigation(),
                newObject,
                editableObject;

            newModel.type = this.type.getKey();
            newObject = parentObject.useCapability('instantiation', newModel);
            editableObject = new EditableDomainObject(newObject, this.$q);
            editableObject.setOriginalObject(parentObject);
            editableObject.getCapability('status').set('editing', true);
            editableObject.useCapability('mutation', function(model){
                model.location = parentObject.getId();
            });

            if (countEditableViews(editableObject) > 0 && editableObject.hasCapability('composition')) {
                this.navigationService.setNavigation(editableObject);
            } else {
                return editableObject.getCapability('action').perform('save');
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
