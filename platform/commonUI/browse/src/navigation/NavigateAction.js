/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * Module defining NavigateAction. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {

        /**
         * The navigate action navigates to a specific domain object.
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {Action}
         */
        function NavigateAction(navigationService, $q, policyService, $window, context) {
            this.domainObject = context.domainObject;
            this.$q = $q;
            this.navigationService = navigationService;
            this.policyService = policyService;
            this.$window = $window;
        }

        /**
         * Navigate to the object described in the context.
         * @returns {Promise} a promise that is resolved once the
         *          navigation has been updated
         */
        NavigateAction.prototype.perform = function () {
            var self = this,
                navigateTo = this.domainObject,
                currentObject = self.navigationService.getNavigation(),
                editing = currentObject.hasCapability('editor') &&
                    currentObject.getCapability('editor').isEditContextRoot();

            function allow() {
                var navigationAllowed = true;
                self.policyService.allow("navigation", currentObject, navigateTo, function (message) {
                    navigationAllowed = self.$window.confirm(message + "\r\n\r\n" +
                        " Are you sure you want to continue?");
                });
                return navigationAllowed;
            }

            function cancelIfEditing() {
                return self.$q.when(editing && currentObject.getCapability("editor").cancel());
            }

            function navigate() {
                return self.navigationService.setNavigation(navigateTo);
            }

            if (allow()) {
                return cancelIfEditing().then(navigate);
            } else {
                return this.$q.when(false);
            }

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
