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
         * Policy controlling when the `edit` and/or `properties` actions
         * can appear as applicable actions of the `view-control` category
         * (shown as buttons in the top-right of browse mode.)
         * @constructor
         */
        function EditActionPolicy() {
            // Get a count of views which are not flagged as non-editable.
            function countEditableViews(context) {
                var domainObject = (context || {}).domainObject,
                    views = domainObject && domainObject.useCapability('view'),
                    count = 0;

                // A view is editable unless explicitly flagged as not
                (views || []).forEach(function (view) {
                    count += (view.editable !== false) ? 1 : 0;
                });

                return count;
            }

            return {
                /**
                 * Check whether or not a given action is allowed by this
                 * policy.
                 * @param {Action} action the action
                 * @param context the context
                 * @returns {boolean} true if not disallowed
                 */
                allow: function (action, context) {
                    var key = action.getMetadata().key,
                        category = (context || {}).category;

                    // Only worry about actions in the view-control category
                    if (category === 'view-control') {
                        // Restrict 'edit' to cases where there are editable
                        // views (similarly, restrict 'properties' to when
                        // the converse is true)
                        if (key === 'edit') {
                            return countEditableViews(context) > 0;
                        } else if (key === 'properties') {
                            return countEditableViews(context) < 1;
                        }
                    }

                    // Like all policies, allow by default.
                    return true;
                }
            };
        }

        return EditActionPolicy;
    }
);