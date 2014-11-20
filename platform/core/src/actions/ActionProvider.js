/*global define,Promise*/

/**
 * Module defining ActionProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ActionProvider(actions) {
            var actionsByKey = {},
                actionsByCategory = {};

            function instantiateAction(Action, context) {
                var action = new Action(context),
                    metadata;

                // Provide a getMetadata method that echos
                // declarative bindings, as well as context,
                // unless the action has defined its own.
                if (!action.getMetadata) {
                    metadata = Object.create(Action.definition);
                    metadata.context = context;
                    action.getMetadata = function () {
                        return metadata;
                    };
                }

                return action;
            }

            function createIfApplicable(actions, context) {
                return (actions || []).filter(function (Action) {
                    return Action.appliesTo ?
                            Action.appliesTo(context) : true;
                }).map(function (Action) {
                    return instantiateAction(Action, context);
                });
            }

            function getActions(actionContext) {
                var context = (actionContext || {}),
                    category = context.category,
                    key = context.key,
                    candidates;

                candidates = actions;
                if (key) {
                    candidates = actionsByKey[key];
                    if (category) {
                        candidates = candidates.filter(function (Action) {
                            return Action.category === category;
                        });
                    }
                } else if (category) {
                    candidates = actionsByCategory[category];
                }

                return createIfApplicable(candidates, context);
            }

            // Build up look-up tables
            actions.forEach(function (Action) {
                if (Action.category) {
                    actionsByCategory[Action.category] =
                        actionsByCategory[Action.category] || [];
                    actionsByCategory[Action.category].push(Action);
                }
                if (Action.key) {
                    actionsByKey[Action.key] =
                        actionsByKey[Action.key] || [];
                    actionsByKey[Action.key].push(Action);
                }
            });

            return {
                getActions: getActions
            };
        }

        return ActionProvider;
    }
);