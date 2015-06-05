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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Filters out actions based on policy.
         * @param {PolicyService} policyService the service which provides
         *        policy decisions
         * @param {ActionService} actionService the service to decorate
         */
        function PolicyActionDecorator(policyService, actionService) {
            return {
                /**
                 * Get actions which are applicable in this context.
                 * These will be filtered to remove any actions which
                 * are deemed inapplicable by policy.
                 * @param context the context in which the action will occur
                 * @returns {Action[]} applicable actions
                 */
                getActions: function (context) {
                    // Check if an action is allowed by policy.
                    function allow(action) {
                        return policyService.allow('action', action, context);
                    }

                    // Look up actions, filter out the disallowed ones.
                    return actionService.getActions(context).filter(allow);
                }
            };
        }

        return PolicyActionDecorator;
    }
);