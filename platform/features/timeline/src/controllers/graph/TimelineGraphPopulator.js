/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ['./TimelineGraph', './TimelineGraphRenderer'],
    (TimelineGraph, TimelineGraphRenderer) => {

        /**
         * Responsible for determining which resource graphs
         * to display (based on capabilities exposed by included
         * domain objects) and allocating data to those different
         * graphs.
         * @constructor
         */
        const TimelineGraphPopulator = ($q) => {
            let graphs =  [],
                cachedAssignments = {},
                renderer = new TimelineGraphRenderer();

            // Compare two domain objects
            const idsMatch = (objA, objB) => {
                return (objA && objA.getId && objA.getId()) ===
                        (objB && objB.getId && objB.getId());
            }

            // Compare two object sets for equality, to detect
            // when graph updates are truly needed.
            const deepEquals = (objA, objB) => {
                let keysA, keysB;

                // Check if all keys in both objects match
                const keysMatch = (keys) => {
                    return keys.map( (k) => {
                        return deepEquals(objA[k], objB[k]);
                    }).reduce( (a, b) => {
                        return a && b;
                    }, true);
                }

                // First, check if they're matching domain objects
                if (typeof (objA && objA.getId) === 'function') {
                    return idsMatch(objA, objB);
                }

                // Otherwise, assume key-value pairs
                keysA = Object.keys(objA || {}).sort();
                keysB = Object.keys(objB || {}).sort();

                return (keysA.length === keysB.length) && keysMatch(keysA);
            }

            // Populate the graphs for these swimlanes
            const populate = (swimlanes) => {
                // Somewhere to store resource assignments
                // (as key -> swimlane[])
                let assignments = {};

                // Look up resources for a domain object
                const lookupResources = (swimlane) => {
                    let graphPromise =
                        swimlane.domainObject.useCapability('graph');
                    const getKeys = (obj) => {
                        return Object.keys(obj);
                    }
                    return $q.when(
                        graphPromise ? (graphPromise.then(getKeys)) : []
                    );
                }

                // Add all graph assignments appropriate for this swimlane
                const buildAssignments = (swimlane) => {
                    // Assign this swimlane to graphs for its resource keys
                    return lookupResources(swimlane).then( (resources) => {
                        resources.forEach( (key) => {
                            assignments[key] = assignments[key] || {};
                            assignments[key][swimlane.color()] =
                                swimlane.domainObject;
                        });
                    });
                }

                // Make a graph for this resource (after assigning)
                const makeGraph = (key) => {
                    return new TimelineGraph(
                        key,
                        assignments[key],
                        renderer
                    );
                }

                // Used to filter down to swimlanes which need graphs
                const needsGraph = (swimlane) => {
                    // Only show swimlanes with graphs & resources to graph
                    return swimlane.graph() &&
                        swimlane.domainObject.hasCapability('graph');
                }

                // Create graphs according to assignments that have been built
                const createGraphs = () => {
                    // Only refresh graphs if our assignments actually changed
                    if (!deepEquals(cachedAssignments, assignments)) {
                        // Make new graphs
                        graphs = Object.keys(assignments).sort().map(makeGraph);
                        // Save resource->color->object assignments
                        cachedAssignments = assignments;
                    } else {
                        // Just refresh the existing graphs
                        graphs.forEach( (graph) => {
                            graph.refresh();
                        });
                    }
                }

                // Build up list of assignments, then create graphs
                $q.all(swimlanes.filter(needsGraph).map(buildAssignments))
                    .then(createGraphs);
            }

            return {
                /**
                 * Populate (or re-populate) the list of available resource
                 * graphs, based on the provided list of swimlanes (and their
                 * current state.)
                 * @param {TimelineSwimlane[]} swimlanes the swimlanes to use
                 */
                populate: populate,
                /**
                 * Get the current list of displayable resource graphs.
                 * @returns {TimelineGraph[]} the resource graphs
                 */
                get: () => {
                    return graphs;
                }
            };
        }

        return TimelineGraphPopulator;

    }
);
