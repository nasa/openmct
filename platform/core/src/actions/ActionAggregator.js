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

define(
    function () {
        "use strict";

        /**
         * The ActionAggregator makes several actionService
         * instances act as those they were one. When requesting
         * actions for a given context, results from all
         * services will be assembled and concatenated.
         *
         * @memberof platform/core
         * @constructor
         * @param {ActionProvider[]} actionProviders an array
         *        of action services
         */
        function ActionAggregator(actionProviders) {

            function getActions(context) {
                // Get all actions from all providers, reduce down
                // to one array by concatenation
                return actionProviders.map(function (provider) {
                    return provider.getActions(context);
                }).reduce(function (a, b) {
                    return a.concat(b);
                }, []);
            }

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
                 * @memberof ActionAggregator
                 * @memberof platform/core.ActionAggregator#
                 */
                getActions: getActions
            };
        }

        return ActionAggregator;
    }
);
