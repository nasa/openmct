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
         * Policy controlling whether navigation events should proceed
         * when object is being edited.
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Policy.<Action, ActionContext>}
         */
        function EditNavigationPolicy(policyService) {
            this.policyService = policyService;
        }

        /**
         * @private
         */
        EditNavigationPolicy.prototype.isDirty = function(domainObject) {
            var navigatedObject = domainObject,
                editorCapability = navigatedObject &&
                    navigatedObject.getCapability("editor"),
                statusCapability = navigatedObject &&
                    navigatedObject.getCapability("status");

            return statusCapability && statusCapability.get('editing')
                && editorCapability && editorCapability.dirty();
        };

        /**
         * Allow navigation if an object is not dirty, or if the user elects
         * to proceed anyway.
         * @param currentNavigation
         * @returns {boolean|*} true if the object model is clean; or if
         * it's dirty and the user wishes to proceed anyway.
         */
        EditNavigationPolicy.prototype.allow = function (currentNavigation) {
            return !this.isDirty(currentNavigation);
        };

        return EditNavigationPolicy;
    }
);
