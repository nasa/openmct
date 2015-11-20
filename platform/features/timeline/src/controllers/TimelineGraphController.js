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
        'use strict';

        /**
         * Controller for the graph area of a timeline view.
         * The set of graphs to show is provided by the timeline
         * controller and communicated into the template via "parameters"
         * in scope.
         * @constructor
         */
        function TimelineGraphController($scope, resources) {
            var resourceMap = {},
                labelCache = {};

            // Add an element to the resource map
            function addToResourceMap(resource) {
                var key = resource.key;
                if (key && !resourceMap[key]) {
                    resourceMap[key] = resource;
                }
            }

            // Update the display bounds for all graphs to match
            // scroll and/or width.
            function updateGraphs(parameters) {
                (parameters.graphs || []).forEach(function (graph) {
                    graph.setBounds(parameters.origin, parameters.duration);
                });
            }

            // Add all resources to map for simpler lookup
            resources.forEach(addToResourceMap);

            // Update graphs as parameters change
            $scope.$watchCollection("parameters", updateGraphs);

            return {
                /**
                 * Get a label object (suitable to pass into the
                 * `timeline-resource-graph-labels` template) for
                 * the specified graph.
                 * @param {TimelineGraph} the graph to label
                 * @returns {object} an object containing labels
                 */
                label: function (graph) {
                    var key = graph.key,
                        resource = resourceMap[key] || {},
                        name = resource.name || "",
                        units = resource.units,
                        min = graph.minimum() || 0,
                        max = graph.maximum() || 0,
                        label = labelCache[key] || {};

                    // Cache the label (this is passed into a template,
                    // so avoid excessive digest cycles)
                    labelCache[key] = label;

                    // Include units in title
                    label.title = name + (units ? (" (" + units + ")") : "");

                    // Provide low, middle, high data values
                    label.low = min.toFixed(3);
                    label.middle = ((min + max) / 2).toFixed(3);
                    label.high = max.toFixed(3);

                    return label;
                }
            };
        }

        return TimelineGraphController;
    }
);