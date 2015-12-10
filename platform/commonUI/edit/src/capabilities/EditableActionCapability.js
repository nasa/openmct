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
    function () {
        'use strict';
        var DISALLOWED_ACTIONS = ["move", "copy", "link", "window", "follow"];
        /**
         * Editable Action Capability. Overrides the action capability
         * normally exhibited by a domain object and filters out certain
         * actions not applicable when an object is in edit mode.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         * @constructor
         * @memberof platform/commonUI/edit
         * @implements {PersistenceCapability}
         */
        function EditableActionCapability(
            actionCapability,
            editableObject,
            domainObject,
            cache
        ) {
            var action = Object.create(actionCapability);

            action.getActions = function(domainObject) {
                return actionCapability.getActions(domainObject).filter(function(action){
                   return DISALLOWED_ACTIONS.indexOf(action.getMetadata().key) === -1;
                });
            };

            return action;
        }

        return EditableActionCapability;
    }
);
