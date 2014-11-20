/*global define*/

/**
 * Implements the Create action, which users may utilize to
 * create new domain objects.
 *
 * @module core/action/create-action
 */
define(
    ['core/promises', 'core/action/create-wizard', 'uuid'],
    function (promises, CreateWizard, uuid) {
        "use strict";

        // Handles issuing Navigate actions in order to
        // display a newly-created object immediately.
        function navigateTo(id, parent) {
            // Look up child objects...
            promises.decorate(
                parent.getCapability('composition'),
                function (c) { return c.list(); }
            ).then(
                function (composition) {
                    // ...and find one with a matching id...
                    composition.forEach(function (child) {
                        if (child.getId() === id) {
                            // ...and navigate to it.
                            child.getCapability('action').then(
                                function (action) {
                                    action.performAction('navigate', {});
                                }
                            );
                        }
                    });
                }
            );
        }

        /**
         * Instantiate a new Create action for a specified type.
         *
         * @param {ActionContext} context the context in which the action would occur
         * @param {module:core/type/type-impl.Type} type the type of domain object
         *        to be createdxs
         * @param {DialogService} dialogService the service used to display the
         *        Create dialog
         * @param {PersistenceService} persistenceService the service used to
         *        persist the model of the newly-created domain object
         * @param {string} spaceName the name of the space in which to store
         *        the created object; used when communicating with the
         *        persistence service.
         * @constructor CreateAction
         * @memberof module:core/action/create-action
         */
        return function CreateAction(context, type, dialogService, persistenceService, spaceName) {

            // Invoked when the Create Action is performed
            function perform() {
                var id = uuid(), // get a unique id for the new object
                    parent = context.selection[0].object,
                    wizard = new CreateWizard(type, parent);

                // Pop up the create dialog
                dialogService.getUserInput(
                    {sections: wizard.getSections()},
                    "Create a New " + type.getName()
                ).then(function (userInput) {
                    // userInput will be undefined if cancelled
                    if (userInput) {
                        userInput.type = userInput.type || type.getKey();

                        // Create and persist the model for the new object.
                        // Note that we rely upon the persistence service
                        // being wired such that this model will be available
                        // via a model service.
                        persistenceService.createObject(
                            spaceName,
                            id,
                            wizard.createModel(userInput)
                        ).then(function (result) {
                            var model,
                                destination = userInput.createParent || parent;
                            if (result) {
                                // Mutate the containing object: Add the newly
                                // created object as part of its composition.
                                destination.getCapability('mutation').then(
                                    function (mutation) {
                                        return mutation.mutate(function (model) {
                                            model.composition = model.composition || [];
                                            model.composition.push(id);
                                            return model;
                                        });
                                    }
                                ).then(function (mutated) {
                                    // Persist immediately (persistence upon mutation
                                    // is not automatic, to permit "working copy"
                                    // changes to objects, as in edit mode)
                                    if (mutated) {
                                        destination.getCapability('persistence').then(
                                            function (persistence) {
                                                promises.as(
                                                    persistence.persist()
                                                ).then(function () {
                                                    navigateTo(id, destination);
                                                });
                                            }
                                        );
                                    }
                                });
                            }
                        });
                    }
                });


            }

            function metadata() {
                return {
                    id: 'create-' + type.getKey(),
                    name: type.getName(),
                    category: 'create',
                    glyph: type.getGlyph(),
                    context: context,
                    description: type.getDescription()
                };
            }


            return {
                perform: perform,
                metadata: metadata
            };


        };

    }
);