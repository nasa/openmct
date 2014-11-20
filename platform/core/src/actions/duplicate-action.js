/*global define,Promise*/

/**
 * Module defining duplicate action. Created by vwoeltje on 11/5/14.
 */
define(
    ['core/promises', 'core/action/duplicate-wizard', 'uuid'],
    function (promises, DuplicateWizard, uuid) {
        "use strict";

        /**
         * Deep-copy a domain object and its composition.
         * @constructor
         */
        function DuplicateAction(context, dialogService, persistenceService, spaceName) {
            var object = context.selection[0].object;

            function makeWizard(parameters) {
                return new DuplicateWizard(
                    object.getModel(),
                    parameters.type,
                    parameters.parent
                );
            }

            function getParent() {
                return object.getCapability('context').then(function (c) {
                    return c.getParent();
                });
            }

            function showDialog(wizard) {
                return dialogService.getUserInput(
                    { sections: wizard.getSections() },
                    "Duplicate " + object.getModel().name
                );
            }

            function getComposition(object) {
                return object.getCapability('composition').then(
                    function (c) { return c.list(); },
                    function () { return []; }
                );
            }

            function getModels() {
                var models = {};

                function populateModelsFor(object) {
                    var id = object.getId();

                    // Already stored this object, don't keep going
                    if (models[id]) {
                        return models;
                    }

                    // Clone to new map
                    models[id] = JSON.parse(JSON.stringify(object.getModel()));

                    return getComposition(object).then(function (objs) {
                        return promises.merge(objs.map(populateModelsFor));
                    });
                }

                return populateModelsFor(object).then(function () {
                    return models;
                });
            }

            function buildIdMap(ids) {
                var idMap = {};

                ids.forEach(function (id) {
                    idMap[id] = uuid();
                });

                return idMap;
            }

            function rewriteComposition(models, idMap) {
                Object.keys(models).forEach(function (id) {
                    if (models[id].composition) {
                        models[id].composition = models[id].composition.map(function (childId) {
                            return idMap[childId] || childId;
                        });
                    }
                });
                return models;
            }

            function shouldRewrite(state, idMap) {
                var keys;

                function isId(key) {
                    return Object.prototype.hasOwnProperty.apply(idMap, [key]);
                }

                function and(a, b) {
                    return a && b;
                }

                keys = Object.keys(state);

                return keys.length > 0 && keys.map(isId).reduce(and, true);
            }

            function rewriteIdentifierKeys(state, idMap) {
                if (typeof state !== 'object' || state === null) {
                    return state;
                }

                if (shouldRewrite(state, idMap)) {
                    // Rewrite the keys of a JavaScript object
                    Object.keys(state).forEach(function (id) {
                        var newId = idMap[id] || id,
                            oldState = state[id];
                        delete state[id];
                        state[newId] = oldState;
                    });
                }

                // Recursively search for model contents which
                // look like id maps
                Object.keys(state).forEach(function (k) {
                    state[k] = rewriteIdentifierKeys(state[k], idMap);
                });

                return state;
            }

            function rewriteIdentifiers(models, idMap) {
                var newModels = {};

                Object.keys(models).forEach(function (id) {
                    var newId = idMap[id] || id;
                    newModels[newId] = models[id];
                });

                return newModels;
            }

            function doPersist(models) {
                var ids = Object.keys(models);
                return promises.merge(ids.map(function (id) {
                    return persistenceService.createObject(
                        spaceName,
                        id,
                        models[id]
                    );
                }));
            }

            function doDuplicate(newModel) {
                var idMap;

                if (!newModel) {
                    return undefined;
                }

                return getModels().then(function (models) {
                    // Add in the model from user input
                    models[object.getId()] = newModel;
                    idMap = buildIdMap(Object.keys(models));

                    rewriteComposition(models, idMap);
                    models = rewriteIdentifiers(models, idMap);
                    return rewriteIdentifierKeys(models, idMap);
                }).then(doPersist).then(function () {
                    // Return the new identifier for the object
                    return idMap[object.getId()];
                });
            }


            function addToComposition(destination, id) {
                function mutator(model) {
                    if (model.composition) {
                        model.composition.push(id);
                    }
                }

                return destination.getCapability('mutation').then(
                    function (m) { return m.mutate(mutator); }
                ).then(function () {
                    return destination.getCapability('persistence');
                }).then(function (p) {
                    return p.persist();
                });
            }

            function perform() {
                var destination, wizard;

                // Pop up the create dialog
                promises.merge({
                    type: object.getCapability('type'),
                    parent: getParent()
                }).then(function (params) {
                    // Record parent, to add to composition later
                    destination = params.parent;
                    return params;
                }).then(function (params) {
                    wizard = makeWizard(params);
                    return wizard;
                }).then(showDialog).then(function (formValue) {
                    // If user picked a different destination, use that
                    if (formValue && formValue.createParent) {
                        destination = formValue.createParent;
                    }
                    return formValue && wizard.createModel(formValue);
                }).then(doDuplicate).then(function (newId) {
                    return addToComposition(destination, newId);
                });
            }

            function metadata() {
                return {
                    id: 'duplicate-' + object.getId(),
                    name: "Duplicate...",
                    category: 'contextual',
                    glyph: "+",
                    context: context,
                    description: "Make a copy of this object, and its contained objects."
                };
            }

            return {
                perform: perform,
                metadata: metadata
            };
        }

        return DuplicateAction;
    }
);