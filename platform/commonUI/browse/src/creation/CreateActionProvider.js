/*global define,Promise*/

/**
 * Module defining CreateActionProvider.js. Created by vwoeltje on 11/10/14.
 */
define(
    ["./CreateAction"],
    function (CreateAction) {
        "use strict";

        /**
         * The CreateActionProvider is an ActionProvider which introduces
         * a Create action for each creatable domain object type.
         *
         * @constructor
         * @param {TypeService} typeService the type service, used to discover
         *        available types
         * @param {DialogService} dialogService the dialog service, used by
         *        specific Create actions to get user input to populate the
         *        model of the newly-created domain object.
         * @param {CreationService} creationService the creation service (also
         *        introduced in this bundle), responsible for handling actual
         *        object creation.
         */
        function CreateActionProvider(typeService, dialogService, creationService, policyService) {
            return {
                /**
                 * Get all Create actions which are applicable in the provided
                 * context.
                 * @memberof CreateActionProvider
                 * @method
                 * @returns {CreateAction[]}
                 */
                getActions: function (actionContext) {
                    var context = actionContext || {},
                        key = context.key,
                        destination = context.domainObject;

                    // We only provide Create actions, and we need a
                    // domain object to serve as the container for the
                    // newly-created object (although the user may later
                    // make a different selection)
                    if (key !== 'create' || !destination) {
                        return [];
                    }

                    // Introduce one create action per type
                    return typeService.listTypes().filter(function (type) {
                        return type.hasFeature("creation");
                    }).map(function (type) {
                        return new CreateAction(
                            type,
                            destination,
                            context,
                            dialogService,
                            creationService,
                            policyService
                        );
                    });
                }
            };
        }

        return CreateActionProvider;
    }
);