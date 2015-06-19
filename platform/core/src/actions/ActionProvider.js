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
 * Module defining ActionProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * An ActionProvider (implementing ActionService) provides actions
         * that are applicable in specific contexts, chosen from a set
         * of actions exposed via extension (specifically, the "actions"
         * category of extension.)
         *
         * @constructor
         */
        function ActionProvider(actions) {
            var actionsByKey = {},
                actionsByCategory = {};

            // Instantiate an action; invokes the constructor and
            // additionally fills in the action's getMetadata method
            // with the extension definition (if no getMetadata
            // method was supplied.)
            function instantiateAction(Action, context) {
                var action = new Action(context),
                    metadata;

                // Provide a getMetadata method that echos
                // declarative bindings, as well as context,
                // unless the action has defined its own.
                if (!action.getMetadata) {
                    metadata = Object.create(Action.definition || {});
                    metadata.context = context;
                    action.getMetadata = function () {
                        return metadata;
                    };
                }

                return action;
            }

            // Filter the array of actions down to those which are
            // applicable in a given context, according to the static
            // appliesTo method of given actions (if defined), and
            // instantiate those applicable actions.
            function createIfApplicable(actions, context) {
                return (actions || []).filter(function (Action) {
                    return Action.appliesTo ?
                            Action.appliesTo(context) : true;
                }).map(function (Action) {
                    return instantiateAction(Action, context);
                });
            }

            // Get an array of actions that are valid in the supplied context.
            function getActions(actionContext) {
                var context = (actionContext || {}),
                    category = context.category,
                    key = context.key,
                    candidates;

                // Match actions to the provided context by comparing "key"
                // and/or "category" parameters, if specified.
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

                // Instantiate those remaining actions, with additional
                // filtering per any appliesTo methods defined on those
                // actions.
                return createIfApplicable(candidates, context);
            }

            // Build up look-up tables
            actions.forEach(function (Action) {
                // Get an action's category or categories
                var categories = Action.category || [];

                // Convert to an array if necessary
                categories = Array.isArray(categories) ?
                        categories : [categories];

                // Store action under all relevant categories
                categories.forEach(function (category) {
                    actionsByCategory[category] =
                        actionsByCategory[category] || [];
                    actionsByCategory[category].push(Action);
                });

                // Store action by ekey as well
                if (Action.key) {
                    actionsByKey[Action.key] =
                        actionsByKey[Action.key] || [];
                    actionsByKey[Action.key].push(Action);
                }
            });

            return {
                /**
                 * Get a list of actions which are valid in a given
                 * context.
                 *
                 * @param {ActionContext} the context in which
                 *        the action will occur; this is a
                 *        JavaScript object containing key-value
                 *        pairs. Typically, this will contain a
                 *        field "domainObject" which refers to
                 *        the domain object that will be acted
                 *        upon, but may contain arbitrary information
                 *        recognized by specific providers.
                 * @return {Action[]} an array of actions which
                 *        may be performed in the provided context.
                 *
                 * @method
                 * @memberof ActionProvider
                 */
                getActions: getActions
            };
        }

        return ActionProvider;
    }
);