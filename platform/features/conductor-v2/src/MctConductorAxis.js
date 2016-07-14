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

define(
    [
        "zepto",
        "d3"
    ],
    function ($, d3) {

        /**
         * The mct-control will dynamically include the control
         * for a form element based on a symbolic key. Individual
         * controls are defined under the extension category
         * `controls`; this allows plug-ins to introduce new form
         * control types while still making use of the form
         * generator to ensure an overall consistent form style.
         * @constructor
         * @memberof platform/forms
         */
        function MCTConductorAxis(conductor) {

            function link(scope, element, attrs, ngModelController) {
                var target = element[0].firstChild,
                    height = target.offsetHeight,
                    padding = 1;

                var vis = d3.select(target)
                            .append('svg:svg')
                            .attr('width', '100%')
                            .attr('height', height);
                var xScale = d3.scaleUtc();
                var xAxis = d3.axisTop();
                // draw x axis with labels and move to the bottom of the chart area
                var axisElement = vis.append("g")
                    .attr("transform", "translate(0," + (height - padding) + ")");

                function setScale(start, end) {
                    var width = target.offsetWidth;
                    xScale.domain([new Date(start), new Date(end)])
                        .range([padding, width - padding * 2]);
                    xAxis.scale(xScale);
                    axisElement.call(xAxis);
                }

                scope.resize = function () {
                    setScale(conductor.bounds().start, conductor.bounds().end);
                };

                conductor.on('bounds', function (bounds) {
                    setScale(bounds.start, bounds.end);
                });

                //Set initial scale.
                setScale(conductor.bounds().start, conductor.bounds().end);
            }

            return {
                // Only show at the element level
                restrict: "E",

                template: "<div class=\"l-axis-holder\" mct-resize=\"resize()\"></div>",

                // ngOptions is terminal, so we need to be higher priority
                priority: 1000,

                // Link function
                link: link,

                // Pass through Angular's normal input field attributes
                scope: {
                    // Used to choose which form control to use
                    start: "=",
                    end: "="
                }
            };
        }

        return MCTConductorAxis;
    }
);
