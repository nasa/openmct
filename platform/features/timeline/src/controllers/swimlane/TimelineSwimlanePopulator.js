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
    [
        './TimelineSwimlane',
        './TimelineSwimlaneDecorator',
        './TimelineColorAssigner',
        './TimelineProxy'
    ],
    function (
        TimelineSwimlane,
        TimelineSwimlaneDecorator,
        TimelineColorAssigner,
        TimelineProxy
    ) {
        'use strict';

        /**
         * Populates and maintains a list of swimlanes for a given
         * timeline view.
         * @constructor
         */
        function TimelineSwimlanePopulator(objectLoader, configuration, selection) {
            var swimlanes = [],
                start = Number.POSITIVE_INFINITY,
                end = Number.NEGATIVE_INFINITY,
                colors = (configuration.colors || {}),
                assigner = new TimelineColorAssigner(colors),
                lastDomainObject;

            // Track extremes of start/end times
            function trackStartEnd(timespan) {
                if (timespan) {
                    start = Math.min(start, timespan.getStart());
                    end = Math.max(end, timespan.getEnd());
                }
            }

            // Add domain object (and its subgraph) in as swimlanes
            function populateSwimlanes(subgraph, parent, index) {
                var domainObject = subgraph.domainObject,
                    swimlane;

                // For the recursive step
                function populate(childSubgraph, index) {
                    populateSwimlanes(childSubgraph, swimlane, index);
                }

                // Make sure we have a valid object instance...
                if (domainObject) {
                    // Create the new swimlane
                    swimlane = new TimelineSwimlaneDecorator(new TimelineSwimlane(
                        domainObject,
                        assigner,
                        configuration,
                        parent,
                        index || 0
                    ), selection);
                    // Track start & end times of this domain object
                    domainObject.useCapability('timespan').then(trackStartEnd);
                    // Add it to our list
                    swimlanes.push(swimlane);
                    // Fill in parent's children
                    ((parent || {}).children || []).push(swimlane);
                    // Add in children
                    subgraph.composition.forEach(populate);
                }
            }

            // Restore a selection
            function reselect(path, candidates, depth) {
                // Next ID on the path
                var next = path[depth || 0];

                // Ensure a default
                depth = depth || 0;

                // Search through this layer of candidates to see
                // if they might contain our selection (based on id path)
                candidates.forEach(function (swimlane) {
                    // Check if we're on the right path...
                    if (swimlane.id === next) {
                        // Do we still have ids to check?
                        if (depth < path.length - 1) {
                            // Yes, so recursively explore that path
                            reselect(path, swimlane.children, depth + 1);
                        } else {
                            // Nope, we found the object to select
                            selection.select(swimlane);
                        }
                    }
                });
            }

            // Handle population of swimlanes
            function recalculateSwimlanes(domainObject) {
                function populate(subgraph) {
                    // Cache current selection state during refresh
                    var selected = selection && selection.get(),
                        selectedIdPath = selected && selected.idPath;

                    // Clear existing swimlanes
                    swimlanes = [];

                    // Build new set of swimlanes
                    populateSwimlanes(subgraph);

                    // Restore selection, if there was one
                    if (selectedIdPath && swimlanes.length > 0) {
                        reselect(selectedIdPath, [swimlanes[0]]);
                    }
                }

                // Repopulate swimlanes for this object
                if (!domainObject) {
                    populate({});
                } else {
                    objectLoader.load(domainObject, 'timespan').then(populate);
                }

                // Set the selection proxy as well (for the Add button)
                if (selection) {
                    selection.proxy(
                        domainObject && new TimelineProxy(domainObject, selection)
                    );
                }

                lastDomainObject = domainObject;
            }

            function setSelectionObject(s) {
                selection = s;
                recalculateSwimlanes(lastDomainObject);
            }

            // Ensure colors are exposed in configuration
            configuration.colors = colors;

            return {
                /**
                 * Set the selection object associated with this timeline view.
                 * @param {Object} selection the selection object
                 */
                selection: setSelectionObject,

                /**
                 * Update list of swimlanes to match those reachable from this
                 * object.
                 * @param {DomainObject} the timeline being viewed
                 */
                populate: recalculateSwimlanes,
                /**
                 * Get a list of swimlanes for this timeline view.
                 * @returns {TimelineSwimlane[]} current swimlanes
                 */
                get: function () {
                    return swimlanes;
                },
                /**
                 * Get the first timestamp in the set of swimlanes.
                 * @returns {number} first timestamp
                 */
                start: function () {
                    return start;
                },
                /**
                 * Get the last timestamp in the set of swimlanes.
                 * @returns {number} first timestamp
                 */
                end: function () {
                    return end;
                }
            };
        }

        return TimelineSwimlanePopulator;
    }
);