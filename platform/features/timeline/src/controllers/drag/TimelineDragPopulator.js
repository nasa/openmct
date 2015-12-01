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
    ['./TimelineDragHandler', './TimelineSnapHandler', './TimelineDragHandleFactory'],
    function (TimelineDragHandler, TimelineSnapHandler, TimelineDragHandleFactory) {
        "use strict";

        /**
         * Provides drag handles for the active selection in a timeline view.
         * @constructor
         */
        function TimelineDragPopulator(objectLoader) {
            var handles = [],
                factory,
                selectedObject;

            // Refresh active set of drag handles
            function refreshHandles() {
                handles = (factory && selectedObject) ?
                        factory.handles(selectedObject) :
                        [];
            }

            // Create a new factory for handles, based on root object in view
            function populateForObject(domainObject) {
                var dragHandler = domainObject && new TimelineDragHandler(
                        domainObject,
                        objectLoader
                    );

                // Reinstantiate the factory
                factory = dragHandler && new TimelineDragHandleFactory(
                    dragHandler,
                    new TimelineSnapHandler(dragHandler)
                );

                // If there's a selected object, restore the handles
                refreshHandles();
            }

            // Change the current selection
            function select(swimlane) {
                // Cache selection to restore handles if other changes occur
                selectedObject = swimlane && swimlane.domainObject;

                // Provide handles for this selection, if it's defined
                refreshHandles();
            }

            return {
                /**
                 * Get the currently-applicable set of drag handles.
                 * @returns {Array} drag handles
                 */
                get: function () {
                    return handles;
                },
                /**
                 * Set the root object in view. Drag interactions consider
                 * the full graph for snapping behavior, so this is needed.
                 * @param {DomainObject} domainObject the timeline object
                 *        being viewed
                 */
                populate: populateForObject,
                /**
                 * Update selection state. Passing undefined means there
                 * is no selection.
                 * @param {TimelineSwimlane} swimlane the selected swimlane
                 */
                select: select
            };
        }

        return TimelineDragPopulator;
    }
);