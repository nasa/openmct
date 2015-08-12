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
        "use strict";

        /**
         * Provides a window on a telemetry data series, to support
         * insertion into a plot line.
         * @constructor
         * @memberof platform/features/plot
         * @implements {TelemetrySeries}
         */
        function PlotSeriesWindow(series, domain, range, start, end) {
            this.series = series;
            this.domain = domain;
            this.range = range;
            this.start = start;
            this.end = end;
        }

        PlotSeriesWindow.prototype.getPointCount = function () {
            return this.end - this.start;
        };

        PlotSeriesWindow.prototype.getDomainValue = function (index) {
            return this.series.getDomainValue(index + this.start, this.domain);
        };

        PlotSeriesWindow.prototype.getRangeValue = function (index) {
            return this.series.getRangeValue(index + this.start, this.range);
        };

        /**
         * Split this series into two series of equal (or nearly-equal) size.
         * @returns {PlotSeriesWindow[]} two series
         */
        PlotSeriesWindow.prototype.split = function () {
            var mid = Math.floor((this.end + this.start) / 2);
            return ((this.end - this.start) > 1) ?
                [
                    new PlotSeriesWindow(
                        this.series,
                        this.domain,
                        this.range,
                        this.start,
                        mid
                    ),
                    new PlotSeriesWindow(
                        this.series,
                        this.domain,
                        this.range,
                        mid,
                        this.end
                    )
                ] : [];
        };

        return PlotSeriesWindow;
    }
);
