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
        var SPLITTER_TEMPLATE = "<div class='abs'" +
                "mct-drag-down=\"splitter.startMove()\" " +
                "mct-drag=\"splitter.move(delta)\" " +
                "mct-drag-up=\"splitter.endMove()\"></div>",
            OFFSETS_BY_EDGE = {
                left: "offsetLeft",
                right: "offsetRight",
                top: "offsetTop",
                bottom: "offsetBottom"
            };

        /**
         * Implements `mct-splitter` directive.
         * @memberof platform/commonUI/general
         * @constructor
         */
        function MCTSplitter() {
            function link(scope, element, attrs, mctSplitPane) {
                var initialPosition;

                element.addClass("splitter");

                scope.splitter = {
                    // Begin moving this splitter
                    startMove: function () {
                        var splitter = element[0];
                        initialPosition = mctSplitPane.position();
                        mctSplitPane.toggleClass('resizing');
                    },
                    // Handle user changes to splitter position
                    move: function (delta) {
                        var anchor = mctSplitPane.anchor(),
                            index = anchor.orientation === "vertical" ? 0 : 1,
                            pixelDelta = delta[index] *
                                (anchor.reversed ? -1 : 1);

                        // Update the position of this splitter
                        mctSplitPane.position(initialPosition + pixelDelta);
                    },
                    // Grab the event when the user is done moving
                    // the splitter and pass it on
                    endMove: function() {
                        mctSplitPane.toggleClass('resizing');
                    }
                };
            }

            return {
                // Restrict to attributes
                restrict: "E",
                // Utilize the mct-split-pane controller
                require: "^mctSplitPane",
                // Expose its controller
                link: link,
                // Use the template defined above
                template: SPLITTER_TEMPLATE,
                // Create a new scope to put the splitter into
                scope: true
            };
        }

        return MCTSplitter;

    }
);

