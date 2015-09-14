/*global define*/
define(
    ['./TimelineGraph', './TimelineGraphRenderer'],
    function (TimelineGraph, TimelineGraphRenderer) {
        'use strict';

        /**
         * Responsible for determining which resource graphs
         * to display (based on capabilities exposed by included
         * domain objects) and allocating data to those different
         * graphs.
         * @constructor
         */
        function TimelineGraphPopulator($q) {
            var graphs =  [],
                cachedAssignments = {},
                renderer = new TimelineGraphRenderer();

            // Compare two domain objects
            function idsMatch(objA, objB) {
                return (objA && objA.getId && objA.getId()) ===
                        (objB && objB.getId && objB.getId());
            }

            // Compare two object sets for equality, to detect
            // when graph updates are truly needed.
            function deepEquals(objA, objB) {
                var keysA, keysB;

                // Check if all keys in both objects match
                function keysMatch(keys) {
                    return keys.map(function (k) {
                        return deepEquals(objA[k], objB[k]);
                    }).reduce(function (a, b) {
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
            function populate(swimlanes) {
                // Somewhere to store resource assignments
                // (as key -> swimlane[])
                var assignments = {};

                // Look up resources for a domain object
                function lookupResources(swimlane) {
                    var graphs = swimlane.domainObject.useCapability('graph');
                    function getKeys(obj) {
                        return Object.keys(obj);
                    }
                    return $q.when(graphs ? (graphs.then(getKeys)) : []);
                }

                // Add all graph assignments appropriate for this swimlane
                function buildAssignments(swimlane) {
                    // Assign this swimlane to graphs for its resource keys
                    return lookupResources(swimlane).then(function (resources) {
                        resources.forEach(function (key) {
                            assignments[key] = assignments[key] || {};
                            assignments[key][swimlane.color()] =
                                swimlane.domainObject;
                        });
                    });
                }

                // Make a graph for this resource (after assigning)
                function makeGraph(key) {
                    return new TimelineGraph(
                        key,
                        assignments[key],
                        renderer
                    );
                }

                // Used to filter down to swimlanes which need graphs
                function needsGraph(swimlane) {
                    // Only show swimlanes with graphs & resources to graph
                    return swimlane.graph() &&
                        swimlane.domainObject.hasCapability('graph');
                }

                // Create graphs according to assignments that have been built
                function createGraphs() {
                    // Only refresh graphs if our assignments actually changed
                    if (!deepEquals(cachedAssignments, assignments)) {
                        // Make new graphs
                        graphs = Object.keys(assignments).sort().map(makeGraph);
                        // Save resource->color->object assignments
                        cachedAssignments = assignments;
                    } else {
                        // Just refresh the existing graphs
                        graphs.forEach(function (graph) {
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
                get: function () {
                    return graphs;
                }
            };
        }

        return TimelineGraphPopulator;

    }
);