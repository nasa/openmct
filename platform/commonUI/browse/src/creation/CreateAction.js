/*global define,Promise*/

/**
 * Module defining CreateAction. Created by vwoeltje on 11/10/14.
 */
define(
    ['./CreateWizard'],
    function (CreateWizard) {
        "use strict";

        /**
         *
         * @constructor
         */
        function CreateAction(type, parent, context, dialogService, creationService) {
            /*

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
                var wizard = new CreateWizard(type, parent);

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
                perform: perform,
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