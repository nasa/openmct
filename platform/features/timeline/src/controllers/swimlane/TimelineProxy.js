/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
         * Selection proxy for the Timeline view. Implements
         * behavior associated with the Add button in the
         * timeline's toolbar.
         * @constructor
         */
        function TimelineProxy(domainObject, selection) {
            var actionMap = {};

            // Populate available Create actions for this domain object
            function populateActionMap(domainObject) {
                var actionCapability = domainObject.getCapability('action'),
                    actions = actionCapability ?
                            actionCapability.getActions('add') : [];
                actions.forEach(function (action) {
                    actionMap[action.getMetadata().type] = action;
                });
            }

            // Populate available actions based on current selection
            // (defaulting to object-in-view if there is none.)
            function populateForSelection() {
                var swimlane = selection && selection.get(),
                    selectedObject = swimlane && swimlane.domainObject;
                populateActionMap(selectedObject || domainObject);
            }

            populateActionMap(domainObject);

            return {
                /**
                 * Add a domain object of the specified type.
                 * @param {string} type the type of domain object to add
                 */
                add: function (type) {
                    // Update list of create actions; this needs to reflect
                    // the current selection so that Save in defaults
                    // appropriately.
                    populateForSelection();

                    // Create an object of that type
                    if (actionMap[type]) {
                        return actionMap[type].perform();
                    }
                }
            };
        }

        return TimelineProxy;
    }
);