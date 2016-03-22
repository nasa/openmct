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
    ['./TimelineSwimlaneDropHandler'],
    function (TimelineSwimlaneDropHandler) {
        "use strict";

        var ACTIVITY_RELATIONSHIP = "modes";

        /**
         * Adds optional methods to TimelineSwimlanes, in order
         * to conditionally make available options in the toolbar.
         * @constructor
         */
        function TimelineSwimlaneDecorator(swimlane, selection) {
            var domainObject = swimlane && swimlane.domainObject,
                model = (domainObject && domainObject.getModel()) || {},
                mutator = domainObject && domainObject.getCapability('mutation'),
                persister = domainObject && domainObject.getCapability('persistence'),
                type = domainObject && domainObject.getCapability('type'),
                dropHandler = new TimelineSwimlaneDropHandler(swimlane);

            // Activity Modes dialog
            function modes(value) {
                // Can be used as a setter...
                if (arguments.length > 0 && Array.isArray(value)) {
                    if ((model.relationships || {})[ACTIVITY_RELATIONSHIP] !== value) {
                        // Update the relationships
                        mutator.mutate(function (model) {
                            model.relationships = model.relationships || {};
                            model.relationships[ACTIVITY_RELATIONSHIP] = value;
                        }).then(persister.persist);
                    }
                }
                // ...otherwise, use as a getter
                return (model.relationships || {})[ACTIVITY_RELATIONSHIP] || [];
            }

            // Activity Link dialog
            function link(value) {
                // Can be used as a setter...
                if (arguments.length > 0 && (typeof value === 'string') &&
                        value !== model.link) {
                    // Update the link
                    mutator.mutate(function (model) {
                        model.link = value;
                    }).then(persister.persist);
                }
                return model.link;
            }

            // Fire the Remove action
            function remove() {
                return domainObject.getCapability("action").perform("remove");
            }

            // Select the current swimlane
            function select() {
                selection.select(swimlane);
            }

            // Check if the swimlane is selected
            function selected() {
                return selection.get() === swimlane;
            }

            // Activities should have the Activity Modes and Activity Link dialog
            if (type && type.instanceOf("activity") && mutator && persister) {
                swimlane.modes = modes;
                swimlane.link = link;
            }

            // Everything but the top-level object should have Remove
            if (swimlane.parent) {
                swimlane.remove = remove;
            }

            // We're in edit mode, if a selection is available
            if (selection) {
                // Add shorthands to select, and check for selection
                swimlane.select = select;
                swimlane.selected = selected;
            }

            // Expose drop handlers (which needed a reference to the swimlane)
            swimlane.allowDropIn = dropHandler.allowDropIn;
            swimlane.allowDropAfter = dropHandler.allowDropAfter;
            swimlane.drop = dropHandler.drop;

            return swimlane;
        }

        return TimelineSwimlaneDecorator;
    }
);
