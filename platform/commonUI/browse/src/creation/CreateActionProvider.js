/*global define,Promise*/

/**
 * Module defining CreateActionProvider.js. Created by vwoeltje on 11/10/14.
 */
define(
    ["./CreateAction"],
    function (CreateAction) {
        "use strict";

        /**
         *
         * @constructor
         */
        function CreateActionProvider(typeService, dialogService, creationService) {
            return {
                getActions: function (actionContext) {
                    var context = actionContext || {},
                        key = context.key,
                        destination = context.domainObject;

                    if (key !== 'create' || !destination) {
                        return [];
                    }

                    return typeService.listTypes().map(function (type) {
                        return new CreateAction(
                            type,
                            destination,
                            context,
                            dialogService,
                            creationService
                        );
                    });
                }
            };
        }

        return CreateActionProvider;
    }
);