/*global define*/

define(
    ['./ResourceGraph', './CumulativeGraph'],
    function (ResourceGraph, CumulativeGraph) {
        'use strict';

        /**
         * Implements the `graph` capability for Timeline and
         * Activity objects.
         *
         * @constructor
         * @param {DomainObject} domainObject the Timeline or Activity
         */
        function GraphCapability($q, domainObject) {


            // Build graphs for this group of utilizations
            function buildGraphs(utilizations) {
                var utilizationMap = {},
                    result = {};

                // Bucket utilizations by type
                utilizations.forEach(function (u) {
                    var k = u.key;
                    utilizationMap[k] = utilizationMap[k] || [];
                    utilizationMap[k].push(u);
                });

                // ...then convert to graphs
                Object.keys(utilizationMap).forEach(function (k) {
                    result[k] = new ResourceGraph(utilizationMap[k]);
                });

                // Add battery state of charge
                if (domainObject.getModel().type === 'timeline' &&
                        result.power &&
                            domainObject.getModel().capacity > 0) {

                    result.battery = new CumulativeGraph(
                        result.power,
                        0,
                        domainObject.getModel().capacity, // Watts
                        domainObject.getModel().capacity,
                        1 / 3600000 // millis-to-hour (since units are watt-hours)
                    );
                }

                return result;
            }

            return {
                /**
                 * Get resource graphs associated with this object.
                 * This is given as a promise for key-value pairs,
                 * where keys are resource types and values are graph
                 * objects.
                 * @returns {Promise} a promise for resource graphs
                 */
                invoke: function () {
                    return $q.when(
                        domainObject.useCapability('utilization') || []
                    ).then(buildGraphs);
                }
            };
        }

        // Only applies to timeline objects
        GraphCapability.appliesTo = function (model) {
            return model &&
                ((model.type === 'timeline') ||
                        (model.type === 'activity'));
        };

        return GraphCapability;

    }
);
