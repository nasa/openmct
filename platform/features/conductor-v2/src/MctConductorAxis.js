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
        function MCTConductorAxis($timeout) {

            function link(scope, element, attrs, ngModelController) {
                $timeout(function () {
                    var target = element[0].firstChild,
                        width = target.offsetWidth,
                        height = target.offsetHeight,
                        padding = 1;

                    var vis = d3.select(target)
                                .append('svg:svg')
                                //.attr('viewBox', '0 0 ' + width + ' ' +
                                // height)
                                .attr('width', '100%')
                                .attr('height', height);
                                //.attr('preserveAspectRatio', 'xMidYMid meet');

                    // define the x scale (horizontal)
                    var mindate = new Date(2012,0,1),
                        maxdate = new Date(2016,0,1);

                    var xScale = d3.scaleTime()
                        .domain([mindate, maxdate])
                        .range([padding, width - padding * 2]);

                    var xAxis = d3.axisTop()
                        .scale(xScale);

                    // draw x axis with labels and move to the bottom of the chart area
                    var axisElement = vis.append("g")
                        .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
                        .attr("transform", "translate(0," + (height - padding) + ")");

                    axisElement.call(xAxis);
                }, 1000);
            }

            return {
                // Only show at the element level
                restrict: "E",

                template: "<div class=\"l-axis-holder\"></div>",

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
