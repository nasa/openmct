/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define(
    [],
    function () {

        /**
         * Policy controlling when the `edit` and/or `properties` actions
         * can appear as applicable actions of the `view-control` category
         * (shown as buttons in the top-right of browse mode.)
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Policy.<Action, ActionContext>}
         */
        function EditActionPolicy(policyService) {
            this.policyService = policyService;
        }

        /**
         * Get a count of views which are not flagged as non-editable.
         * @private
         */
        EditActionPolicy.prototype.countEditableViews = function (context) {
            var domainObject = context.domainObject,
                count = 0,
                type, views;

            if (!domainObject) {
                return count;
            }

            type = domainObject.getCapability('type');
            views = domainObject.useCapability('view');


            // A view is editable unless explicitly flagged as not
            (views || []).forEach(function (view) {
                if (view.editable === true ||
                    (view.key === 'plot' && type.getKey() === 'telemetry.panel') ||
                    (view.key === 'table' && type.getKey() === 'table') ||
                    (view.key === 'rt-table' && type.getKey() === 'rttable')
                    ) {
                    count++;
                }
            });

            return count;
        };

        /**
         * Checks whether the domain object is currently being edited. If
         * so, the edit action is not applicable.
         * @param context
         * @returns {*|boolean}
         */
        function isEditing(context) {
            var domainObject = (context || {}).domainObject;
            return domainObject &&
                domainObject.hasCapability('editor') &&
                domainObject.getCapability('editor').isEditContextRoot();
        }

        EditActionPolicy.prototype.allow = function (action, context) {
            var key = action.getMetadata().key,
                category = (context || {}).category;

            // Restrict 'edit' to cases where there are editable
            // views (similarly, restrict 'properties' to when
            // the converse is true), and where the domain object is not
            // already being edited.
            if (key === 'edit') {
                return this.countEditableViews(context) > 0 && !isEditing(context);
            } else if (key === 'properties' && category === 'view-control') {
                return this.countEditableViews(context) < 1 && !isEditing(context);
            }

            // Like all policies, allow by default.
            return true;
        };

        return EditActionPolicy;
    }
);
