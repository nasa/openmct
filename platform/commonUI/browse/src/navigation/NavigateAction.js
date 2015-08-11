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
 * Module defining NavigateAction. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The navigate action navigates to a specific domain object.
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {Action}
         */
        function NavigateAction(navigationService, $q, context) {
            this.domainObject = context.domainObject;
            this.$q = $q;
            this.navigationService = navigationService;
        }

        /**
         * Navigate to the object described in the context.
         * @returns {Promise} a promise that is resolved once the
         *          navigation has been updated
         */
        NavigateAction.prototype.perform = function () {
            // Set navigation, and wrap like a promise
            return this.$q.when(
                this.navigationService.setNavigation(this.domainObject)
            );
        };

        /**
         * Navigate as an action is only applicable when a domain object
         * is described in the action context.
         * @param {ActionContext} context the context in which the action
         *        will be performed
         * @returns {boolean} true if applicable
         */
        NavigateAction.appliesTo = function (context) {
            return context.domainObject !== undefined;
        };

        return NavigateAction;
    }
);
