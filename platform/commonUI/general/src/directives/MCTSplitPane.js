/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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

        // Pixel width to allocate for the splitter itself
        var SPLITTER_WIDTH = 8,
            HALF_WIDTH = SPLITTER_WIDTH / 2,
            DEFAULT_ANCHOR = 'left',
            CHILDREN_WARNING_MESSAGE = [
                "Invalid mct-split-pane contents.",
                "This element should contain exactly three",
                "child elements, where the middle-most element",
                "is an mct-splitter."
            ].join(" "),
            ANCHOR_WARNING_MESSAGE = [
                "Unknown anchor provided to mct-split-pane,",
                "defaulting to",
                DEFAULT_ANCHOR + "."
            ].join(" "),
            ANCHORS = {
                left: {
                    edge: "left",
                    opposite: "right",
                    dimension: "width",
                    orientation: "vertical"
                },
                right: {
                    edge: "right",
                    opposite: "left",
                    dimension: "width",
                    orientation: "vertical",
                    reversed: true
                },
                top: {
                    edge: "top",
                    opposite: "bottom",
                    dimension: "height",
                    orientation: "horizontal"
                },
                bottom: {
                    edge: "bottom",
                    opposite: "top",
                    dimension: "height",
                    orientation: "horizontal",
                    reversed: true
                }
            };

        /**
         * Implements `mct-split-pane` directive.
         *
         * This takes the following attributes:
         * * `initial`: Initial positioning to use, as a plain string.
         *   For example, "30%"
         * * `position`: Two-way bound scope variable which will contain
         *   the pixel position of the splitter, offset from the appropriate
         *   edge.
         * * `anchor`: Plain string, one of "left", "right", "top",
         *    or "bottom".
         *
         * When used, an `mct-split-pane` element should contain exactly
         * three child elements, where the middle is an `mct-splitter`
         * element. These should be included in either left-to-right
         * or top-to-bottom order (depending on anchoring.) If the contents
         * do not match this form, `mct-split-pane` will issue a warning
         * and its behavior will be undefined.
         *
         * @constructor
         */
        function MCTSplitPane($parse, $log) {
            var anchors = {
                left: true,
                right: true,
                top: true,
                bottom: true
            };

            function controller(scope, element, attrs) {
                var anchorKey = attrs.anchor || DEFAULT_ANCHOR,
                    anchor,
                    styleValue = attrs.initial,
                    positionParsed = $parse(attrs.position),
                    position; // Start undefined, until explicitly set

                // Convert a pixel offset to a calc expression
                function calc(offset) {
                    return "calc(" + styleValue + " + " + offset + "px)";
                }

                // Apply styles to child elements
                function updateChildren(children) {
                    // Pick out correct elements to update, flowing from
                    // selected anchor edge.
                    var first = children.eq(anchor.reversed ? 0 : 2),
                        splitter = children.eq(1),
                        last = children.eq(anchor.reversed ? 2 : 0);

                    first.css(anchor.edge, "0px");
                    first.css(anchor.dimension, calc(-HALF_WIDTH));

                    splitter.css(anchor.edge, calc(-HALF_WIDTH));
                    splitter.css(anchor.dimension, SPLITTER_WIDTH + "px");

                    last.css(anchor.edge, calc(HALF_WIDTH));
                    last.css(anchor.opposite, "0px");
                }

                // Update positioning of contained elements
                function updateElementPositions() {
                    var children = element.children();

                    // Check to make sure contents are well-formed
                    if (children.length !== 3 ||
                            children[1].nodeName !== 'mct-splitter') {
                        $log.warn(CHILDREN_WARNING_MESSAGE);
                        return;
                    }

                    updateChildren(children);
                }

                // Getter-setter for the pixel offset of the splitter,
                // relative to the current edge.
                function getSetPosition(value) {
                    if (typeof value === 'number') {
                        position = value;
                        // Pass change up so this state can be shared
                        if (positionParsed.assign) {
                            positionParsed.assign(scope, value);
                        }
                        styleValue = position + 'px';
                        updateElementPositions();
                    }
                    return position;
                }

                // Make sure anchor parameter is something we know
                if (!ANCHORS[anchorKey]) {
                    $log.warn(ANCHOR_WARNING_MESSAGE);
                    anchorKey = DEFAULT_ANCHOR;
                }
                anchor = ANCHORS[anchorKey];

                scope.$watch(attrs.position, getSetPosition);

                // Initialize positions
                updateElementPositions();

                // Interface exposed by controller, for mct-splitter to user
                return {
                    position: getSetPosition,
                    anchor: function () {
                        return anchor;
                    }
                };
            }

            return {
                // Restrict to attributes
                restrict: "A",
                // Expose its controller
                controller: controller
            };
        }

        return MCTSplitPane;

    }
);
