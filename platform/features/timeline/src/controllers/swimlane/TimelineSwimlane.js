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
         * Describes a swimlane in a timeline view. This will be
         * used directly from timeline view.
         *
         * Only general properties of swimlanes are included here.
         * Since swimlanes are also directly selected and exposed to the
         * toolbar, the TimelineSwimlaneDecorator should also be used
         * to add additional properties to specific swimlanes.
         *
         * @constructor
         * @param {DomainObject} domainObject the represented object
         * @param {TimelineColorAssigner} assigner color assignment handler
         * @param configuration the view's configuration object
         * @param {TimelineSwimlane} parent the parent swim lane (if any)
         */
        function TimelineSwimlane(domainObject, assigner, configuration, parent, index) {
            var id = domainObject.getId(),
                highlight = false, // Drop highlight (middle)
                highlightBottom = false, // Drop highlight (lower)
                idPath = (parent ? parent.idPath : []).concat([domainObject.getId()]),
                depth = parent ? (parent.depth + 1) : 0,
                timespan,
                path = (!parent || !parent.parent) ? "" : parent.path +
                        //(parent.path.length > 0 ? " / " : "") +
                        parent.domainObject.getModel().name +
	                    " > ";

            // Look up timespan for this object
            domainObject.useCapability('timespan').then(function (t) {
                timespan = t;
            });

            return {
                /**
                 * Check if this swimlane is currently visible. (That is,
                 * check to see if its parents are expanded.)
                 * @returns {boolean} true if it is visible
                 */
                visible: function () {
                    return !parent || (parent.expanded && parent.visible());
                },
                /**
                 * Show the Edit Properties dialog.
                 */
                properties: function () {
                    return domainObject.getCapability("action").perform("properties");
                },
                /**
                 * Toggle inclusion of this swimlane's represented object in
                 * the resource graph area.
                 */
                toggleGraph: function () {
                    configuration.graph = configuration.graph || {};
                    configuration.graph[id] = !configuration.graph[id];
                    // Assign or release legend color
                    assigner[configuration.graph[id] ? 'assign' : 'release'](id);
                },
                /**
                 * Get (or set, if an argument is provided) the flag which
                 * determines if the object in this swimlane is included in
                 * the set of active resource graphs.
                 * @param {boolean} [value] the state to set (if setting)
                 * @returns {boolean} true if included; otherwise false
                 */
                graph: function (value) {
                    // Set if an argument was provided
                    if (arguments.length > 0) {
                        configuration.graph = configuration.graph || {};
                        configuration.graph[id] = !!value;
                        // Assign or release the legend color
                        assigner[value ? 'assign' : 'release'](id);
                    }
                    // Provide the current state
                    return (configuration.graph || {})[id];
                },
                /**
                 * Get (or set, if an argument is provided) the color
                 * associated with this swimlane when its contents are
                 * included in the set of active resource graphs.
                 * @param {string} [value] the color to set (if setting)
                 * @returns {string} the color for resource graphing
                 */
                color: function (value) {
                    // Set if an argument was provided
                    if (arguments.length > 0) {
                        // Defer to the color assigner
                        assigner.assign(id, value);
                    }
                    // Provide the current value
                    return assigner.get(id);
                },
                /**
                 * Get (or set, if an argument is provided) the drag
                 * highlight state for this swimlane. True means the body
                 * of the swimlane should be highlighted for drop into.
                 */
                highlight: function (value) {
                    // Set if an argument was provided
                    if (arguments.length > 0) {
                        highlight = value;
                    }
                    // Provide current value
                    return highlight;
                },
                /**
                 * Get (or set, if an argument is provided) the drag
                 * highlight state for this swimlane. True means the body
                 * of the swimlane should be highlighted for drop after.
                 */
                highlightBottom: function (value) {
                    // Set if an argument was provided
                    if (arguments.length > 0) {
                        highlightBottom = value;
                    }
                    // Provide current value
                    return highlightBottom;
                },
                /**
                 * Check if a swimlane exceeds the bounds of its parent.
                 * @returns {boolean} true if there is a bounds violation
                 */
                exceeded: function () {
                    var parentTimespan = parent && parent.timespan();
                    return timespan && parentTimespan &&
                            (timespan.getStart() < parentTimespan.getStart() ||
                                timespan.getEnd() > parentTimespan.getEnd());
                },
                /**
                 * Get the timespan associated with this swimlane
                 */
                timespan: function () {
                    return timespan;
                },
                // Expose domain object, expansion state, indentation depth
                domainObject: domainObject,
                expanded: true,
                depth: depth,
                path: path,
                id: id,
                idPath: idPath,
                parent: parent,
                index: index,
                children: [] // Populated by populator
            };
        }

        return TimelineSwimlane;
    }
);