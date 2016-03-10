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
        './swimlane/TimelineSwimlanePopulator',
        './graph/TimelineGraphPopulator',
        './drag/TimelineDragPopulator'
    ],
    function (
        TimelineSwimlanePopulator,
        TimelineGraphPopulator,
        TimelineDragPopulator
    ) {
        'use strict';

        /**
         * Controller for the Timeline view.
         * @constructor
         */
        function TimelineController($scope, $q, objectLoader, MINIMUM_DURATION) {
            var swimlanePopulator = new TimelineSwimlanePopulator(
                    objectLoader,
                    $scope.configuration || {},
                    $scope.selection
                ),
                graphPopulator = new TimelineGraphPopulator($q),
                dragPopulator = new TimelineDragPopulator(objectLoader);

            // Hash together all modification times. A sum is sufficient here,
            // since modified timestamps should be non-decreasing.
            function modificationSum() {
                var sum = 0;
                swimlanePopulator.get().forEach(function (swimlane) {
                    sum += swimlane.domainObject.getModel().modified || 0;
                });
                return sum;
            }

            // Reduce graph states to a watch-able number. A bitmask is
            // sufficient here, since only ~30 graphed elements make sense
            // (due to limits on recognizably unique line colors)
            function graphMask() {
                var mask = 0, bit = 1;
                swimlanePopulator.get().forEach(function (swimlane) {
                    mask += swimlane.graph() ? 0 : bit;
                    bit *= 2;
                });
                return mask;
            }

            // Repopulate based on detected modification to in-view objects
            function repopulateSwimlanes() {
                swimlanePopulator.populate($scope.domainObject);
                dragPopulator.populate($scope.domainObject);
                graphPopulator.populate(swimlanePopulator.get());
            }

            // Repopulate graphs based on modification to swimlane graph state
            function repopulateGraphs() {
                graphPopulator.populate(swimlanePopulator.get());
            }

            // Get pixel width for right pane, using zoom controller
            function width(zoomController) {
                var start = swimlanePopulator.start(),
                    end = swimlanePopulator.end();
                return zoomController.toPixels(zoomController.duration(
                    Math.max(end - start, MINIMUM_DURATION)
                ));
            }

            // Refresh resource graphs
            function refresh() {
                if (graphPopulator) {
                    graphPopulator.get().forEach(function (graph) {
                        graph.refresh();
                    });
                }
            }
            
            // Recalculate swimlane state on changes
            $scope.$watch("domainObject", swimlanePopulator.populate);

            // Also recalculate whenever anything in view is modified
            $scope.$watch(modificationSum, repopulateSwimlanes);

            // Carry over changes in swimlane set to changes in graphs
            $scope.$watch(graphMask, repopulateGraphs);

            // Pass selection object into swimlane populator
            $scope.$watch("selection", swimlanePopulator.selection);

            // Convey current selection to drag handle populator
            $scope.$watch("selection.get()", dragPopulator.select);

            // Provide initial scroll bar state, container for pane positions
            $scope.scroll = { x: 0, y: 0 };
            $scope.panes = {};

            // Expose active set of swimlanes
            return {
                /**
                 * Get the width, in pixels, of the timeline area
                 * @returns {number} width, in pixels
                 */
                width: width,
                /**
                 * Get the swimlanes which should currently be displayed.
                 * @returns {TimelineSwimlane[]} the swimlanes
                 */
                swimlanes: swimlanePopulator.get,
                /**
                 * Get the resource graphs which should currently be displayed.
                 * @returns {TimelineGraph[]} the graphs
                 */
                graphs: graphPopulator.get,
                /**
                 * Get drag handles for the current selection.
                 * @returns {TimelineDragHandle[]} the drag handles
                 */
                handles: dragPopulator.get,
                /**
                 * Refresh resource graphs (during drag.)
                 */
                refresh: refresh
            };
        }

        return TimelineController;
    }
);
