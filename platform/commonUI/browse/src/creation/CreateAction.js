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
         * @constructor
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
        function CreateAction(type, parent, context, dialogService, creationService) {
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

            function perform() {
                // The wizard will handle creating the form model based
                // on the type...
                var wizard = new CreateWizard(type, parent);

                // Create and persist the new object, based on user
                // input.
                function persistResult(formValue) {
                    var parent = wizard.getLocation(formValue),
                        newModel = wizard.createModel(formValue);
                    return creationService.createObject(newModel, parent);
                }

                function doNothing() {
                    // Create cancelled, do nothing
                    return false;
                }

                return dialogService.getUserInput(
                    wizard.getFormModel()
                ).then(persistResult, doNothing);
            }

            return {
                /**
                 * Create a new object of the given type.
                 * This will prompt for user input first.
                 * @method
                 * @memberof CreateAction
                 */
                perform: perform,

                /**
                 * Get metadata about this action. This includes fields:
                 * * `name`: Human-readable name
                 * * `key`: Machine-readable identifier ("create")
                 * * `glyph`: Glyph to use as an icon for this action
                 * * `description`: Human-readable description
                 * * `context`: The context in which this action will be performed.
                 *
                 * @return {object} metadata about the create action
                 */
                getMetadata: function () {
                    return {
                        key: 'create',
                        glyph: type.getGlyph(),
                        name: type.getName(),
                        description: type.getDescription(),
                        context: context
                    };
                }
            };
        }

        return CreateAction;
    }
);